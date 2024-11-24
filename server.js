require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const path = require('path');
const cron = require('node-cron');
const DigiCoinABI = require(path.join(__dirname, 'artifacts/contracts/DigiCoin.sol/DigiCoin.json')).abi;

const app = express();
app.use(express.json());

// MongoDB接続
mongoose.connect(process.env.MONGODB_URI, {
  tls: true,
  tlsCertificateKeyFile: process.env.X509_CERT_PATH,
  authMechanism: 'MONGODB-X509',
  authSource: '$external'
}).then(() => {
  console.log('MongoDB接続成功');
}).catch((err) => {
  console.error('MongoDB接続エラー:', err);
});

// ユーザーモデル
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  affiliationCode: { type: String, required: true },
  sendableBalance: { type: Number, default: 5 },
  receivedBalance: { type: Number, default: 0 },
  userId: { type: String, required: true, unique: true }
});

const User = mongoose.model('User', userSchema);

// 取引モデル
const Transaction = mongoose.model('Transaction', new mongoose.Schema({
  senderId: { type: String, required: true },
  recipientId: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  transactionHash: { type: String, required: true }
}));

// Ethereum設定
const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const digiCoinContractAddress = process.env.DIGICOIN_CONTRACT_ADDRESS;

if (!digiCoinContractAddress) {
  throw new Error('DIGICOIN_CONTRACT_ADDRESS is not set in the environment variables');
}

const digiCoinContract = new ethers.Contract(digiCoinContractAddress, DigiCoinABI, wallet);

console.log('DigiCoinコントラクトアドレス:', digiCoinContract.target);

// ユーザーID生成関数
function generateUserId() {
  return 'U' + Math.random().toString(36).substr(2, 9);
}

// 認証ミドルウェア
const authenticateUser = async (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: '認証が必要です' });

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findOne({ username: decoded.username });
    if (!user) return res.status(404).json({ message: 'ユーザーが見つかりません' });
    req.user = user;
    next();
  } catch (error) {
    console.error('認証エラー:', error);
    res.status(401).json({ message: '無効なトークンです' });
  }
};

// 登録エンドポイント
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, affiliationCode } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'このユーザー名は既に使用されています' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUserId();
    const user = new User({
      username,
      password: hashedPassword,
      affiliationCode,
      sendableBalance: 5,
      receivedBalance: 0,
      userId
    });

    await user.save();

    res.status(201).json({ message: 'ユーザーが登録されました' });
  } catch (error) {
    console.error('登録エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました', error: error.message });
  }
});

// ログインエンドポイント
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'ユーザーが見つかりません' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'パスワードが正しくありません' });
    }
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'ログイン成功', username: user.username, token });
  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

// ユーザー情報取得エンドポイント
app.get('/api/user-info', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }
    res.json({
      username: user.username,
      userId: user.userId,
      affiliationCode: user.affiliationCode,
      sendableBalance: user.sendableBalance,
      receivedBalance: user.receivedBalance
    });
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    res.status(500).json({ message: 'ユーザー情報の取得に失敗しました', error: error.message });
  }
});

// DigiCoin残高取得エンドポイント
app.get('/api/balance', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }
    res.json({ sendableBalance: user.sendableBalance, receivedBalance: user.receivedBalance });
  } catch (error) {
    console.error('残高取得エラー:', error);
    res.status(500).json({ message: '残高の取得に失敗しました', error: error.message });
  }
});

// ユーザーリスト取得エンドポイント
app.get('/api/users', authenticateUser, async (req, res) => {
  try {
    const users = await User.find({}, 'username');
    res.json({ users: users.map(user => user.username) });
  } catch (error) {
    console.error('ユーザーリスト取得エラー:', error);
    res.status(500).json({ message: 'ユーザーリストの取得に失敗しました' });
  }
});

// DigiCoin送付エンドポイント
app.post('/api/send', authenticateUser, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { recipient, amount } = req.body;
    const sender = req.user;

    const senderUser = await User.findOne({ username: sender.username }).session(session);
    const recipientUser = await User.findOne({ username: recipient }).session(session);

    if (!senderUser || !recipientUser) {
      throw new Error('送信者または受信者が見つかりません');
    }

    const sendAmount = parseFloat(amount);
    if (isNaN(sendAmount) || sendAmount <= 0) {
      throw new Error('無効な送金額です');
    }

    if (senderUser.sendableBalance < sendAmount) {
      throw new Error('送付可能な残高が不足しています');
    }

    // データベース上の残高更新
    senderUser.sendableBalance -= sendAmount;
    recipientUser.receivedBalance += sendAmount;

    await senderUser.save({ session });
    await recipientUser.save({ session });

    // スマートコントラクトに送金履歴を記録
    const tx = await digiCoinContract.recordTransfer(
      senderUser.userId,
      recipientUser.userId,
      ethers.parseEther(sendAmount.toString())
    );
    const receipt = await tx.wait();

    console.log('トランザクション詳細:', {
      senderId: senderUser.userId,
      recipientId: recipientUser.userId,
      amount: sendAmount,
      transactionHash: receipt.hash
    });

    // 取引をデータベースに保存
    const transaction = new Transaction({
      senderId: senderUser.userId,
      recipientId: recipientUser.userId,
      amount: sendAmount,
      transactionHash: receipt.hash
    });
    await transaction.save({ session });

    console.log('トランザクション保存成功:', transaction);

    // トランザクションをコミット
    await session.commitTransaction();
    session.endSession();

    res.json({ message: '送付が完了しました', newSendableBalance: senderUser.sendableBalance });
  } catch (error) {
    // エラーが発生した場合、トランザクションをロールバック
    await session.abortTransaction();
    session.endSession();

    console.error('送付エラー:', error);
    if (error.stack) {
      console.error('送付エラーのスタックトレース:', error.stack);
    }
    if (error.errors) {
      console.error('バリデーションエラー:', error.errors);
    }
    if (error.name === 'ValidationError') {
      console.error('バリデーションエラーの詳細:', error.errors);
    }
    if (error instanceof Error) {
      res.status(500).json({ message: '送付に失敗しました', error: error.message });
    } else {
      res.status(500).json({ message: '送付に失敗しました', error: '不明なエラーが発生しました' });
    }
  }
});

// ランキング取得エンドポイント
app.get('/api/ranking', authenticateUser, async (req, res) => {
  try {
    const topUsers = await User.find({})
      .sort({ receivedBalance: -1 }) // 受取残高の降順でソート
      .limit(5) // 上位5名を取得
      .select('username receivedBalance'); // ユーザー名と受取残高のみを選択

    if (topUsers.length === 0) {
      return res.status(404).json({ message: 'ランキングデータがありません' });
    }

    res.json({ ranking: topUsers });
  } catch (error) {
    console.error('ランキング取得エラー:', error);
    res.status(500).json({ message: 'ランキングの取得に失敗しました', error: error.message });
  }
});

// 取引履歴取得エンドポイント
app.get('/api/transactions', authenticateUser, async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .sort({ timestamp: -1 }) // 最新の取引から順に取得
      .limit(20) // 最新の20件を取得
      .populate('senderId', 'username')
      .populate('recipientId', 'username');

    const formattedTransactions = await Promise.all(transactions.map(async (tx) => {
      const sender = await User.findOne({ userId: tx.senderId }, 'username');
      const recipient = await User.findOne({ userId: tx.recipientId }, 'username');
      return {
        id: tx._id,
        sender: sender ? sender.username : '不明',
        recipient: recipient ? recipient.username : '不明',
        amount: tx.amount,
        timestamp: tx.timestamp,
        transactionHash: tx.transactionHash
      };
    }));

    res.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error('取引履歴取得エラー:', error);
    res.status(500).json({ message: '取引履歴の取得に失敗しました', error: error.message });
  }
});

// 毎月1日の0:00に全ユーザーのDigiCoinをリセット
cron.schedule('0 0 1 * *', async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await User.updateMany({}, { sendableBalance: 5, receivedBalance: 0 }, { session });
    await session.commitTransaction();
    console.log('月初のDigiCoinリセットが完了しました');
  } catch (error) {
    await session.abortTransaction();
    console.error('月初のDigiCoinリセットエラー:', error);
  } finally {
    session.endSession();
  }
});

// サーバーの起動
const port = process.env.PORT || 5000;
app.listen(port, async () => {
  console.log(`サーバーがポート${port}で起動しました`);
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error('サーバーエラー:', err.stack);
  res.status(500).json({ message: 'サーバーエラーが発生しました', error: err.message });
});

// トランザクション詳細を取得するエンドポイント
app.get('/api/transaction/:id', authenticateUser, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: '取引が見つかりません' });
    }

    const sender = await User.findOne({ userId: transaction.senderId });
    const recipient = await User.findOne({ userId: transaction.recipientId });

    res.json({
      transaction: {
        id: transaction._id,
        sender: sender ? sender.username : '不明',
        senderId: transaction.senderId,
        recipient: recipient ? recipient.username : '不明',
        recipientId: transaction.recipientId,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        transactionHash: transaction.transactionHash
      }
    });
  } catch (error) {
    console.error('取引詳細取得エラー:', error);
    res.status(500).json({ message: '取引詳細の取得に失敗しました', error: error.message });
  }
});

// ユーザーの送受信履歴を取得するエンドポイント
app.get('/api/user-transactions', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactions = await Transaction.find({
      $or: [{ senderId: userId }, { recipientId: userId }]
    })
    .sort({ timestamp: -1 })
    .limit(10);

    const formattedTransactions = await Promise.all(transactions.map(async (tx) => {
      const sender = await User.findOne({ userId: tx.senderId }, 'username');
      const recipient = await User.findOne({ userId: tx.recipientId }, 'username');
      return {
        id: tx._id,
        sender: sender ? sender.username : '不明',
        recipient: recipient ? recipient.username : '不明',
        amount: tx.amount,
        timestamp: tx.timestamp,
        type: tx.senderId === userId ? '送信' : '受信'
      };
    }));

    res.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error('ユーザー取引履歴取得エラー:', error);
    res.status(500).json({ message: 'ユーザー取引履歴の取得に失敗しました', error: error.message });
  }
});

