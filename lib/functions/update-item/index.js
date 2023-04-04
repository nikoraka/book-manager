const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

function getParams(body, isbn) {
    return {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: {
            isbn: body.isbn
        },
        // name attribute cant be changed as its reserved keyword
        UpdateExpression: "set languages = :lg, authors = :ah, countries = :ct, numberOfPages = :np, releaseDate = :rd",
        ExpressionAttributeValues: {
          ":lg": body.languages, 
          ":ah": body.authors,
          ":ct": body.countries,
          ":np": body.numberOfPages,
          ":rd": body.releaseDate
        },
        ReturnValues: "ALL_NEW"
    };
}

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const params = getParams(body, body.isbn);
        // Update
        const data = await docClient.update(params).promise();
        return {
            statusCode: 200,
            body: `Successfully updated product with ISBN ${body.isbn}`
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify(err),
        };
    }
};