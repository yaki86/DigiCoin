const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        // Cognitoユーザー情報から userId を取得
        const userId = event.requestContext.authorizer.claims.sub;
        
        // DynamoDBから取引履歴を取得
        const params = {
            TableName: 'DigiCoin-Transactions',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false, // 新しい順
            Limit: 20 // 最新20件を取得
        };
        
        const result = await dynamodb.query(params).promise();
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET"
            },
            body: JSON.stringify(result.Items)
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET"
            },
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
}; 