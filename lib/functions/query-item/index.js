const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json"
  };

  try {
    /* 
      If a language is defined in query string parameters, it returns 
      only the items matching the defined language.
      Otherwise, if no query string parameters are defined, it returns everything
    */ 
    if (event.queryStringParameters != null) {
        body = await dynamo
          .scan({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            ExpressionAttributeNames: {
              "#languages": "languages"
            },
            ExpressionAttributeValues: {
              ":languagesValue": event.queryStringParameters.languages
            },
            FilterExpression: "#languages = :languagesValue",
            KeyConditionExpression: "#languages = :languagesValue",
          })
          .promise();
    } else {
        body = await dynamo.scan({ TableName: process.env.DYNAMODB_TABLE_NAME }).promise();
    }
       
  } catch (err) {
    statusCode = 500;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers
  };
};