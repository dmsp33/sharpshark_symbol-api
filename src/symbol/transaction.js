'use strict';
Object.defineProperty(exports, "__esModule", {
    value: true
});

const symbolSdk = require("symbol-sdk");

module.exports = class Symbol {
   
    node = {
        url: process.env.NODE_URL,
        networkName: process.env.NETWORK,
        networkGenerationHash: process.env.NETWORK_HASH,
        epochAdjustment: 1616694977,
    }

    async postTransaction($address, $privateKey, $message) {
        const recipientAddress = symbolSdk.Address.createFromRawAddress($address);
        const networkType = (this.node.networkName == "testnet") ? symbolSdk.NetworkType.TEST_NET : symbolSdk.NetworkType.MAIN_NET;

        const transferTransaction = symbolSdk.TransferTransaction.create(
            symbolSdk.Deadline.create(this.node.epochAdjustment),
            recipientAddress,
            [],
            symbolSdk.PlainMessage.create($message),
            networkType,
            symbolSdk.UInt64.fromUint(2000000),
        ).setMaxFee(45);

        const privateKey = $privateKey;
        const account = symbolSdk.Account.createFromPrivateKey(privateKey, networkType);
        const networkGenerationHash = this.node.networkGenerationHash;
        const signedTransaction = account.sign(transferTransaction, networkGenerationHash);
        
        console.trace(`SignedTXN: ${JSON.stringify(signedTransaction).toString()}`);
       
        const nodeUrl = this.node.url;
        const repositoryFactory = new symbolSdk.RepositoryFactoryHttp(nodeUrl);
        const transactionHttp = repositoryFactory.createTransactionRepository();
        
        console.info("before announce TX");
        const announceResponse = await transactionHttp
            .announce(signedTransaction).toPromise()
        
        return {signedTransaction, announceResponse};
    }
}