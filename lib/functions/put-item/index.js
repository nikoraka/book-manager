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
      .put({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: {
          isbn: requestJSON.isbn,
          name: requestJSON.name,
          authors: requestJSON.authors,
          languages: requestJSON.languages,
          countries: requestJSON.countries,
          numberOfPages: requestJSON.numberOfPages,
          releaseDate: requestJSON.releaseDate
        }
      })
      .promise();
    body = `Successfully registered product with ISBN ${requestJSON.isbn}`;
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