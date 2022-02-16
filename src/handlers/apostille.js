
const symbolSdk = require('symbol-sdk');
const Symbol = require('../symbol/transaction');

const testWallet = {
    address: process.env.ADDRESS,
    publicKey: process.env.PUB_KEY,
    privateKey: process.env.PV_KEY,
    explorerUrl: process.env.EXPLORER_URL
}

async function decodePrivateKey(key) {

    const networkName = key.replace("secret/", "");
    const AWS = require('aws-sdk'),
    region = "us-west-2",
    secretName = `symbol/${networkName}`;

    var client = new AWS.SecretsManager({
        region: region
    });

    return client.getSecretValue({SecretId: secretName}).promise().then(
        function(data) {
            // Decrypts secret using the associated KMS CMK.
            // Depending on whether the secret is a string or binary, one of these fields will be populated.
            if ('SecretString' in data) {
                const result = JSON.parse(data.SecretString);
                return result.private;
            
            } else {
                let buff = new Buffer(data.SecretBinary, 'base64');
                return buff.toString('ascii');
            }
          },
          function(error) {
            console.info(`getSecretValue: error => ${error.code}`);
            throw error;
          }
    );
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    console.info('received:', event);

    const message = (event.path.startsWith('/apostille/ipfs/')) ?
        `https://ipfs.io/ipfs/${event.pathParameters.hashipfs}` : JSON.parse(event.body).message;

    const address = testWallet.address;
    var privateKey;
    try {
        privateKey = (!testWallet.privateKey.startsWith('secret/')) ? 
        testWallet.privateKey : await decodePrivateKey(testWallet.privateKey);
    } catch (err) {
        const response = {
            statusCode: 500,
            body: JSON.stringify(`Unable to parse private_key for ${testWallet.privateKey}`)
        };
        console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
        return response;
    }

    var announceResponse, signedTransaction;
    try {
        const symbol = new Symbol();
        const postResponse = await symbol.postTransaction(address, privateKey, message);
        announceResponse = postResponse.announceResponse;
        signedTransaction = postResponse.signedTransaction;
    } catch(error) {
        console.error(`ERROR publishing transaction:`)
        const response = {
            statusCode: 502,
            body: JSON.stringify(`Unable to send transasction to Blockchain`)
        };
        console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
        return response;
    }

    console.info(`Transaction announced: ${announceResponse.message}`)
    if (announceResponse.message.startsWith('packet') &&
        announceResponse.message.includes('pushed') &&
        announceResponse.message.endsWith('/transactions')) {
            const result = {
                tx_hash: signedTransaction.hash,
                link: `${testWallet.explorerUrl}/${signedTransaction.hash}`
            }
            const response = {
                statusCode: 200,
                body: JSON.stringify(result)
            };
            console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
            return response;
        } else {
            const response = {
                statusCode: 502,
                body: JSON.stringify(announceResponse)
            };
            console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
            return response;
        }
    



    
}