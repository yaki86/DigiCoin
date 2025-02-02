import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { ethers } from 'ethers';

const dynamodb = DynamoDBDocument.from(new DynamoDB({ region: 'ap-northeast-1' }));
const secretsManagerClient = new SecretsManagerClient({ region: 'ap-northeast-1' });
const ssmClient = new SSMClient();

async function getSecret(secretName) {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsManagerClient.send(command);
    return response.SecretString;
}

async function getParameter(parameterName) {
    const command = new GetParameterCommand({ Name: parameterName });
    const response = await ssmClient.send(command);
    return response.Parameter.Value;
}

async function getPrivateKey() {
    const command = new GetSecretValueCommand({ SecretId: 'PRIVATE_KEY' });
    const response = await secretsManagerClient.send(command);
    return '0x' + response.SecretString;
}

// 先頭にCORSヘッダーを定義
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
};

export const handler = async (event) => {
    // OPTIONSリクエストの処理を追加
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'OK' })
        };
    }

    try {
        const { senderId, recipientId, amount } = JSON.parse(event.body);
        console.log('リクエストデータ:', { senderId, recipientId, amount });

        if (!senderId || !recipientId || !amount) {
            throw new Error('必要なパラメータが不足しています');
        }

        // ユーザー情報の取得と残高チェック
        const [senderResult, recipientResult] = await Promise.all([
            dynamodb.get({ TableName: 'DigiCoin-Users', Key: { userId: senderId } }),
            dynamodb.get({ TableName: 'DigiCoin-Users', Key: { userId: recipientId } })
        ]);

        const sender = senderResult.Item;
        const recipient = recipientResult.Item;

        if (!sender || !recipient) {
            throw new Error('送信者または受信者が見つかりません');
        }

        if (sender.balance < amount) {
            throw new Error('送付可能な残高が不足しています');
        }

        // ブロックチェーンへの記録
        const abiString = await getSecret('DIGICOIN_ABI');
        const DigiCoinABI = JSON.parse(abiString);
        const [ethereumRpcUrl, digiCoinContractAddress] = await Promise.all([
            getParameter('/path/to/ETHEREUM_RPC_URL'),
            getParameter('/path/to/DIGICOIN_CONTRACT_ADDRESS')
        ]);

        const provider = new ethers.providers.JsonRpcProvider(ethereumRpcUrl);
        const wallet = new ethers.Wallet(await getPrivateKey(), provider);
        const digiCoinContract = new ethers.Contract(digiCoinContractAddress, DigiCoinABI, wallet);

        // 送金パラメータのログ（既存のコード）
        console.log('送金パラメータ（変換前）:', {
            senderId,
            recipientId,
            amount,
            senderIdType: typeof senderId,
            recipientIdType: typeof recipientId
        });

        // 文字列を直接使用
        const from = `senderId: ${senderId}`;
        const to = `recipientId: ${recipientId}`;
        const sendAmount = `sendAmount: ${amount.toString()}`;

        // トランザクションを送信
        try {
            const tx = await digiCoinContract.recordTransfer(
                from,
                to,
                sendAmount,
                { gasLimit: 100000 }
            );
            console.log('トランザクション送信:', tx);
            const receipt = await tx.wait();
            console.log('トランザクション完了:', receipt);
            console.log('イベントログ:', receipt.events);

            // Use `tx` and `receipt` here
            const transactionDetails = {
                transactionId: receipt.transactionHash,
                senderId,
                recipientId,
                amount,
                timestamp: new Date().toISOString()
            };

            // Save transaction details to the database
            await dynamodb.put({
                TableName: 'DigiCoin-Transactions',
                Item: transactionDetails
            });

            console.log('トランザクション保存成功:', transactionDetails);

            // ブロックチェーンの処理が成功した後にDynamoDBを更新
            const updatedSender = { ...sender, balance: sender.balance - amount, total: sender.total + Number(amount) };
            const updatedRecipient = { ...recipient, balance: recipient.balance + Number(amount) };

            await Promise.all([
                dynamodb.put({ TableName: 'DigiCoin-Users', Item: updatedSender }),
                dynamodb.put({ TableName: 'DigiCoin-Users', Item: updatedRecipient }),
            ]);

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    message: '送付が完了しました',
                    transactionHash: receipt.transactionHash,
                    newSenderBalance: updatedSender.balance
                })
            };
        } catch (error) {
            console.error('トランザクションエラー詳細:', {
                error: error.message,
                reason: error.reason,
                code: error.code,
                data: error.data
            });
            throw error;
        }
    } catch (error) {
        console.error('送付エラー:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: '送付に失敗しました', error: error.message })
        };
    }
};

