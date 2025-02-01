import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamodb = DynamoDBDocument.from(new DynamoDB({ region: 'ap-northeast-1' }));

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json'
};

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'OK' })
        };
    }

    try {
        const userId = event.queryStringParameters?.userId;

        // senderIdまたはrecipientIdがuserIdに一致するトランザクションを取得
        const transactions = await dynamodb.scan({
            TableName: 'DigiCoin-Transactions',
            FilterExpression: 'senderId = :userId OR recipientId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        });

        // スキャン結果をそのまま返す
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                transactions: transactions.Items
            })
        };
    } catch (error) {
        console.error('取引履歴取得エラー:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: '取引履歴の取得に失敗しました',
                error: error.message
            })
        };
    }
}; 