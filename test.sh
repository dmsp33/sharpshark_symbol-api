#!/bin/bash

functionName="Apostille"

caseName=$1
if [[ -z $caseName ]]
 then
  caseName="default"
fi

fullFunctionName="${functionName}Function"
eventFile="events/${caseName}.json"

echo "Invoke ${fullFunctionName}"
echo "event: ${eventFile}"

sam local invoke $fullFunctionName -e $eventFile --env-vars env.json --profile sharpshark

if [ $? -eq 0 ]; then
    echo "Invoke SUCCESS!"
else
    echo "Invoke FAIL"
    echo
    echo "Available functions to test:"
    cat template.yaml | grep "Function::" | sed 's/Handler: wabilytics//' | sed 's/Function::handleRequest//' | sed 's/\./@/g' | sed 's/ @.*@//'
fi

