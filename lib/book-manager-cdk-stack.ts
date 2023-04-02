import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
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
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: 'book-catalog-manager',
      description: 'Supports CRUD operations for a book catalog',
      code: lambda.Code.fromAsset(path.join(__dirname, 'function')),
      handler: 'index.handler',
      environment: {
        DYNAMODB_TABLE: booksCatalogTable.tableName
      }
    });
    
    // Allow Lambda to access DynamoDB table with Read/Write rights
    booksCatalogTable.grantReadWriteData(bookCatalogManager)

  }
}
