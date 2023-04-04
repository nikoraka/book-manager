import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as path from 'path'

export class BookManagerCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

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
    )
   
    /*
      Create Lambda to Put Items to Dynamodb Table
      and grant relevant access
    */
    const putItemLambda = createLambdaStack(this, booksCatalogTable.tableName, 'put' )    
    booksCatalogTable.grant(putItemLambda, 'dynamodb:BatchWriteItem', 'dynamodb:PutItem', 'dynamodb:DescribeTable')

    /*
      Create Lambda to Delete Items from Dynamodb Table
      and grant relevant access
    */
    const deleteItemLambda = createLambdaStack(this, booksCatalogTable.tableName, 'delete')  
    booksCatalogTable.grant(deleteItemLambda, 'dynamodb:DeleteItem', 'dynamodb:DescribeTable')

    /*
      Create Lambda to Update Items in Dynamodb Table
      and grant relevant access
    */
    const updateItemLambda = createLambdaStack(this, booksCatalogTable.tableName, 'update')
    booksCatalogTable.grant(updateItemLambda,'dynamodb:BatchWriteItem', 'dynamodb:DescribeTable', 'dynamodb:UpdateItem')
        
    /*
      Create Lambda to Query Items in Dynamodb Table
      and grant relevant access
    */
    const queryItemLambda = createLambdaStack(this, booksCatalogTable.tableName, 'query')
    booksCatalogTable.grantReadData(queryItemLambda)  

    // Create a REST API
    const restApi = new apigateway.RestApi(this, 'CRUDRestApi', {
      restApiName: 'book-crud-api',
      description: 'REST API supporting CRUD operations for a book catalog',
      deploy: true
    })

    // Custom Lambda authoriser. Token needs to be retrieved from a Third Party App
    const lambdaAuth = new lambda.Function( this, 'BookCatalogAuthorizer',{
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: 'book-catalog-authorizer',
      timeout: cdk.Duration.seconds(15),
      code: lambda.Code.fromAsset(path.join(__dirname,'functions/authorizer')),
      handler: "index.handler",
    })

    const authorizer = new apigateway.TokenAuthorizer(
        this,
        `ApiTokenAuthorizer`, {
          handler: lambdaAuth
        }
    )
    const bookResource = restApi.root.addResource('book')   
    
    /*
      In order to edit an item in the DynamoDB table,
      authorization is needed. A token needs to be included
      in the request header    
    */
    bookResource.addMethod('POST', new apigateway.LambdaIntegration(putItemLambda), {
      apiKeyRequired: false,
      authorizer
    })    

    bookResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteItemLambda), {
      apiKeyRequired: false,
      authorizer
    })

    bookResource.addMethod('PUT', new apigateway.LambdaIntegration(updateItemLambda), {
      apiKeyRequired: false,
      authorizer
    })

    /*
      For retrieving an item no authorization is needed,
      i.e. no necessity to include a token in the request
      Filtering options are offered based on languages. 
      A value can be passed in the request as a query string
    */
    bookResource.addMethod('GET', new apigateway.LambdaIntegration(queryItemLambda), {
      apiKeyRequired: false,
      requestParameters: {
        "method.request.querystring.languages": true
      }
    })
  }
}

function createLambdaStack(scope: Construct, tableName: string, option: string): cdk.aws_lambda.Function{
  return new lambda.Function(scope, capitalizeFirstLetter(`${option}ItemLambda`), {
    runtime: lambda.Runtime.NODEJS_14_X,
    functionName: `${option}-item-function`,
    description: 'Supports CRUD operations for a book catalog',
    code: lambda.Code.fromAsset(path.join(__dirname, `functions/${option}-item`)),
    handler: 'index.handler',
    environment: {
      DYNAMODB_TABLE_NAME: tableName
    }
  })
}

function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}