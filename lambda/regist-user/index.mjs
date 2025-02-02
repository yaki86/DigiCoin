import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamodb = DynamoDBDocument.from(new DynamoDB());

export const handler = async (event) => {
  try {
    // リクエストボディの解析
    const body = JSON.parse(event.body);
    const { userId, username } = body;

    if (!userId || !username) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'userId と username は必須です' })
      };
    }

    // 新規ユーザーの登録
    const params = {
      TableName: 'DigiCoin-Users',
      Item: {
        userId: userId,
        name: username,
        balance: 10,  // 初期コイン
        total: 0      // 累計送信額の初期値
      },
      // 同じuserIdが存在しない場合のみ登録
      ConditionExpression: 'attribute_not_exists(userId)'
    };

    await dynamodb.put(params);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'ユーザー登録が完了しました',
        user: {
          userId: userId,
          name: username,
          balance: 10,
          total: 0
        }
      })
    };

  } catch (error) {
    console.error('Error:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'このユーザーIDは既に登録されています' })
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'ユーザー登録に失敗しました' })
    };
  }
};
