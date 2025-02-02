import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';
import { get, post } from '@aws-amplify/api';
import styles from './SendCoin.module.css';

const cloudFrontUrl = 'https://www.digisui-coin.com';

export default function SendCoin() {
  const navigate = useNavigate();
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalSent, setTotalSent] = useState(0);
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [userList, setUserList] = useState([]);
  const [userNames, setUserNames] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ユーザー情報の取得
  const fetchCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUserInfo(user);
    } catch (error) {
      console.error('ユーザー情報の取得エラー:', error);
    }
  };

  // ユーザー情報と全ユーザー名の取得
  const fetchUserData = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();
      const shortUserId = session.userSub.split('-')[0];
      sessionStorage.setItem('userId', shortUserId); 
      sessionStorage.setItem('token',token);

      const response = await fetch(`${cloudFrontUrl}/api/user?userId=${shortUserId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }

      const result = await response.json();
      const { userInfo, allUsers } = result;

      if (userInfo) {
        setCurrentUserInfo({
          userId: userInfo.userId,
          username: userInfo.name
        });
        setCurrentBalance(userInfo.balance);
        setTotalSent(userInfo.total);
      }

      if (Array.isArray(allUsers)) {
        // allUsersにtotalが含まれていることを確認
        console.log('取得した全ユーザーデータ:', allUsers); // デバッグ用
        setUserList(allUsers);
        setUserNames(allUsers.map(user => user.name));
        sessionStorage.setItem('allUsers', JSON.stringify(allUsers)); // allUsersをlocalStorageに保存
      }

    } catch (error) {
      console.error('エラーの詳細:', error);
      setError('ユーザー情報の取得に失敗しました');
    }
  };
  // コンポーネントのマウント時にデータを取得
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchUserData();
      } catch (error) {
        console.error('データ読み込みエラー:', error);
      }
    };
    
    loadData();
  }, []);

  const handleRecipientChange = async (event) => {
    const username = event.target.value;
    console.log('選択されたユーザー名:', username);

    setRecipientUsername(username);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      // nameパラメータではなく、ユーザー一覧から選択したユーザーのIDを使用
      const selectedUser = userList.find(user => user.name === username);
      if (selectedUser) {
        console.log('設定するrecipientId:', selectedUser.userId, 'for username:', username);
        setRecipientId(selectedUser.userId);
      } else {
        console.error('選択されたユーザーが見つかりません:', username);
        setError('選択されたユーザーが見つかりません');
        setRecipientId('');
      }
    } catch (error) {
      console.error('ユーザーID取得エラー:', error);
      setRecipientId('');
    }
  };

  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    setMessage('');

    if (!recipientId) {
      setError('送金先のユーザーを選択してください');
      setIsLoading(false);
      return;
    }

    // 自分自身への送金をチェック
    if (currentUserInfo.userId === recipientId) {
      setError('自分自身への送金はできません');
      setIsLoading(false);
      return;
    }

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const requestBody = {
        senderId: currentUserInfo.userId,
        recipientId: recipientId,
        amount: Number(amount)
      };

      console.log('送信データ:', requestBody);

      const response = await fetch(`${cloudFrontUrl}/api/send`, {  // クエリパラメータを削除
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        console.error('API call failed:', errorDetails);
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('送金成功:', result);
      setSuccess(`${recipientUsername}さんにコインを送金しました！`);
      setRecipientUsername('');
      setAmount('');
      await fetchUserData();

    } catch (error) {
      console.error('送金エラー:', error);
      setError('送金処理中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut({ global: true });
      localStorage.clear();
      navigate('/', { replace: true });
      window.location.reload();
    } catch (error) {
      console.error('サインアウトエラー:', error);
      setError('サインアウト中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSignOut = () => {
    if (window.confirm('本当にサインアウトしますか？')) {
      handleSignOut();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.userInfo}>
          <h2 className={styles.headerTitle}>ログイン情報</h2>
          <p className={styles.userDetail}>
            <span className={styles.userLabel}>ユーザーID:</span>
            <span className={styles.userId}>{currentUserInfo?.userId}</span>
          </p>
          <p className={styles.userDetail}>
            <span className={styles.userLabel}>ユーザー名:</span>
            <span className={styles.username}>{currentUserInfo?.username}</span>
          </p>
        </div>
        <div className={styles.balanceInfo}>
          <div className={styles.balance}>
            <h3>現在の残高</h3>
            <p className={styles.balanceAmount}>
              {currentBalance}
              <span className={styles.currency}>DGC</span>
            </p>
          </div>
          <div className={styles.balance}>
            <h3>合計送付枚数</h3>
            <p className={styles.balanceAmount}>
              {totalSent}
              <span className={styles.currency}>DGC</span>
            </p>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.headerTitle}>DigiCoin送付</h2>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="recipient" className={styles.label}>
              送金先ユーザー名:
            </label>
            <select
              id="recipient"
              value={recipientUsername}
              onChange={handleRecipientChange}
              required
              className={styles.input}
              disabled={isLoading}
            >
              <option value="">選択してください</option>
              {userNames.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="amount" className={styles.label}>
              送金額:
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="金額を入力"
              required
              className={styles.input}
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? '送金中...' : '送金する'}
          </button>
        </form>
      </div>
    </div>
  );
}

