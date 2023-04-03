const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json"
  };

  try {
    switch (event.httpMethod) {
      case "DELETE":
        await dynamo
          .delete({
            TableName: "my-test-catalog",
            Key: {
              isbn: event.pathParameters.isbn
            }
          })
          .promise();
        body = `Deleted product ${event.pathParameters.id}`;
        break;
      case "GET":
        if (event.pathParameters != null) {
            body = await dynamo
              .get({
                TableName: "my-test-catalog",
                Key: {
                  isbn: event.pathParameters.isbn
                }
              })
              .promise();
        } else {
            body = await dynamo.scan({ TableName: "my-test-catalog" }).promise();
        }
        break;
      case "POST":
        let requestJSON = JSON.parse(event.body);
        console.log(requestJSON)
        await dynamo
          .put({
            TableName: "my-test-catalog",
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
        body = `Added/Updated product ${requestJSON.isbn}`;
        break;
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`);
    }
  } catch (err) {
    statusCode = 400;
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