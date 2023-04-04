# Serverless Book Manager App

## Overview
This is a CDK App that creates a REST API, a DynamoDB table and 5 Lambda functions. One of the Lambda functions serves as a custom authorizer to the REST API while the other lambdas are created to support CRUD operations to the DynamoDB table. The Lambda authorizer takes into account that a Third Party Identity Provider is in place to offer an authentication token for any user that would like to make a request. A valid authorization token is the one with value `allow`.

## Diagram
![Visualization](./assets/visualization.png?raw=true "Visualization")

## How to deploy AWS resources
* Clone the repository
* Run `npm install` to install relevant dependencies
* Run `cdk deploy` to deploy the AWS resources

## How to test
* After successfull deployment, locate the REST API ID from the API Gateway console. It should be something similar to `018iiq6b19`
* Lets say that we would like to register a new item of the following format to the DynamoDB table:
```json
{
   "name": "<name of the book>",
   "isbn": "<universal identifier of the book>",
   "authors": "<authors of the book>",
   "languages": "<languages the book is available>",
   "countries": "<countries where the book is available>",
   "numberOfPages": "<number of pages of the book>",
   "releaseDate": "<release date of the book>",
}
```
* In your terminal, execute bellow command:
```console
curl -X POST -H "Content-Type: application/json" -d '{ "isbn": "1", "name": "Robinson Crusoe", "authors": "Jules Verne", "languages": "French", "countries": "France", "numberOfPages": "100", "releaseDate": "1719"}' https://rest-api-id.execute-api.aws-region.amazonaws.com/prod/book --tlsv1.2 --header 'Accept: */*' --header 'Authorization: allow'
``` 

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
