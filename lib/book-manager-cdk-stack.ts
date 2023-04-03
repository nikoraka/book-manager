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

    // Create Lambda to access DynamoDB Database
    const bookCatalogManager = new lambda.Function(this, 'BookCatalogManager', {
      runtime: lambda.Runtime.NODEJS_16_X,
      functionName: 'book-catalog-manager',
      description: 'Supports CRUD operations for a book catalog',
      code: lambda.Code.fromAsset(path.join(__dirname, 'function')),
      handler: 'index.handler',
      environment: {
        DYNAMODB_TABLE_NAME: booksCatalogTable.tableName
      }
    });
    
    // Allow Lambda to access DynamoDB table with Read/Write rights
    booksCatalogTable.grantReadWriteData(bookCatalogManager)

    const api = new apigateway.RestApi(this, 'CRUDRestApi', {
      restApiName: 'book-crud-api',
      description: 'book-crud-api',
      deploy: true
    })

    const bookResource = api.root.addResource('book')
    bookResource.addMethod('POST', new apigateway.LambdaIntegration(bookCatalogManager), {
      apiKeyRequired: false
    })

    bookResource.addMethod('GET', new apigateway.LambdaIntegration(bookCatalogManager), {
      apiKeyRequired: false
    });
  }
}
