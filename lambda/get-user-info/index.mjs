import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

// DynamoDBクライアントの初期化
const client = new DynamoDB({ region: 'ap-northeast-1' });
const dynamodb = DynamoDBDocument.from(client);

const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
};

export const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        // クエリパラメータから送られてきたユーザーID
        const requestedUserId = event.queryStringParameters?.userId;

        if (!requestedUserId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'ユーザーIDが指定されていません' })
            };
        }

        // ユーザー情報を取得
        const userParams = {
            TableName: 'DigiCoin-Users',
            Key: {
                userId: requestedUserId
            }
        };
        
        const userResult = await dynamodb.get(userParams);
        const user = userResult.Item;
        
        if (!user) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'ユーザーが見つかりません' })
            };
        }

        // 全ユーザー情報を取得（name, userId, totalを含む）
        const allUsersParams = {
            TableName: 'DigiCoin-Users',
            ProjectionExpression: '#name, userId, #total',  // name, userId, totalを取得
            ExpressionAttributeNames: { '#name': 'name', '#total': 'total' } // totalをエイリアスで置き換え
        };
        
        const allUsersResult = await dynamodb.scan(allUsersParams);
        const allUsers = allUsersResult.Items.map(user => ({
            name: user.name,
            userId: user.userId,
            total: user.total // totalを含める
        }));
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                userInfo: user,
                allUsers: allUsers
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Internal server error', error: error.message })
        };
    }
}; 