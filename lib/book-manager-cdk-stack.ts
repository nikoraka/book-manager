import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as path from 'path'

export class BookManagerCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const booksCatalogTable = new dynamodb.Table(
      this,
      'BookCatalogTable',
      {
        tableName: 'books-catalog',
        partitionKey: {
          name: 'isbn',
          type: dynamodb.AttributeType.STRING
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
      }
    );

    // Create Lambda to Put Item to DynamoDB Table
    const putItemLambda = new lambda.Function(this, 'PutItemLambda', {
      runtime: lambda.Runtime.NODEJS_16_X,
      functionName: 'put-item-function',
      description: 'Supports CRUD operations for a book catalog',
      code: lambda.Code.fromAsset(path.join(__dirname, 'functions/put-item')),
      handler: 'index.handler',
      environment: {
        DYNAMODB_TABLE_NAME: booksCatalogTable.tableName
      }
    });
    
    booksCatalogTable.grant(putItemLambda, 'dynamodb:BatchWriteItem', 'dynamodb:PutItem', 'dynamodb:DescribeTable')

    // Create Lambda to access DynamoDB Database
    const deleteItemLambda = new lambda.Function(this, 'DeleteItemLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: 'delete-item-function',
      description: 'Supports CRUD operations for a book catalog',
      code: lambda.Code.fromAsset(path.join(__dirname, 'functions/delete-item')),
      handler: 'index.handler',
      environment: {
        DYNAMODB_TABLE_NAME: booksCatalogTable.tableName
      }
    });

    // Create Lambda to access DynamoDB Database
    const updateItemLambda = new lambda.Function(this, 'UpdateItemLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: 'update-item-function',
      description: 'Supports CRUD operations for a book catalog',
      code: lambda.Code.fromAsset(path.join(__dirname, 'functions/update-item')),
      handler: 'index.handler',
      environment: {
        DYNAMODB_TABLE_NAME: booksCatalogTable.tableName
      }
    });

    const queryItemLambda = new lambda.Function(this, 'QueryItemLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: 'query-item-function',
      description: 'Supports CRUD operations for a book catalog',
      code: lambda.Code.fromAsset(path.join(__dirname, 'functions/query-item')),
      handler: 'index.handler',
      environment: {
        DYNAMODB_TABLE_NAME: booksCatalogTable.tableName
    }
    });

    // Allow Lambda to access DynamoDB table with Read/Write rights
    booksCatalogTable.grantReadData(queryItemLambda)
    booksCatalogTable.grant(putItemLambda, 'dynamodb:BatchWriteItem', 'dynamodb:PutItem', 'dynamodb:DescribeTable')
    booksCatalogTable.grant(deleteItemLambda, 'dynamodb:DeleteItem', 'dynamodb:DescribeTable')
    booksCatalogTable.grant(updateItemLambda,'dynamodb:BatchWriteItem', 'dynamodb:DescribeTable', 'dynamodb:UpdateItem')

    const restApi = new apigateway.RestApi(this, 'CRUDRestApi', {
      restApiName: 'book-crud-api',
      description: 'REST API supporting CRUD operations for a book catalog',
      deploy: true
    })
    // Custom Lambda authoriser. Token needs to be retrieved from a Third Party App
    const lambdaAuth = new lambda.Function( this, 'my-lambda-authoriser',{
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: 'book-catalog-authorizer',
      timeout: cdk.Duration.seconds(15),
      code: lambda.Code.fromAsset(path.join(__dirname,'functions/authorizer')),
      handler: "index.handler",
    })

    const authorizer = new apigateway.TokenAuthorizer(
        this,
        `my-lambda-authorizer`, {
          handler: lambdaAuth
        }
    )
    const bookResource = restApi.root.addResource('book')   

    bookResource.addMethod('POST', new apigateway.LambdaIntegration(putItemLambda), {
      apiKeyRequired: false,
      authorizer
    })    

    bookResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteItemLambda), {
      apiKeyRequired: false,
      authorizer
    })

    bookResource.addMethod('GET', new apigateway.LambdaIntegration(queryItemLambda), {
      apiKeyRequired: false,
      requestParameters: {
        "method.request.querystring.isbn": true,
        "method.request.querystring.authors": true,
        "method.request.querystring.countries": true,
        "method.request.querystring.languages": true,
        "method.request.querystring.name": true,
        "method.request.querystring.numberOfPages": true,
        "method.request.querystring.releaseDate": true
      }
    })

    bookResource.addMethod('PUT', new apigateway.LambdaIntegration(updateItemLambda), {
      apiKeyRequired: false,
      authorizer
    })
  }
}