import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
};

export const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'OK' })
        };
    }

    try {
        // Authorization ヘッダーの取得（プロキシ統合では大文字小文字を区別）
        const authHeader = event.headers?.authorization || event.headers?.Authorization;
        console.log('Auth header found:', !!authHeader);

        if (!authHeader) {
            console.log('Headers received:', JSON.stringify(event.headers));
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Authorization header is missing or invalid' })
            };
        }

        // Bearer トークンの抽出
        const token = authHeader.replace(/^Bearer\s+/i, '');
        console.log('Token prefix:', token.substring(0, 20) + '...');

        // userIdの取得
        const userId = event.queryStringParameters?.userId;
        if (!userId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'userId is required' })
            };
        }
        
        console.log('Processing request for userId:', userId);
        
        const params = {
            TableName: 'DigiCoin-Transactions',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false,
            Limit: 20
        };
        
        const command = new QueryCommand(params);
        const result = await dynamodb.send(command);
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(result.Items || [])
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'Internal server error',
                error: error.message 
            })
        };
    }
}; 