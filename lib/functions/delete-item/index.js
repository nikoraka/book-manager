const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json"
  };

  try {
    let requestJSON = JSON.parse(event.body);
    await dynamo
        .delete({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: {
              isbn: requestJSON.isbn
            }
        })
      .promise();
    body = `Successfully deleted product with ISBN ${requestJSON.isbn}`;
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