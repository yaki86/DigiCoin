import React, { useState, useEffect } from 'react';
import styles from './SendCoin.module.css';

export default function SendCoin() {
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [affiliationCode, setAffiliationCode] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sendableBalance, setSendableBalance] = useState(0);
  const [receivedBalance, setReceivedBalance] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchUserInfo().catch(console.error);
    fetchUsers().catch(console.error);
    fetchTransactions().catch(console.error);
  }, []);

  async function fetchUserInfo() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('認証トークンがありません');
      }
      const response = await fetch('/api/user-info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ユーザー情報の取得に失敗しました');
      }
      const data = await response.json();
      setUsername(data.username);
      setUserId(data.userId);
      setAffiliationCode(data.affiliationCode);
      setSendableBalance(data.sendableBalance);
      setReceivedBalance(data.receivedBalance);
    } catch (err) {
      console.error('ユーザー情報取得エラー:', err);
      setError('ユーザー情報の取得に失敗しました: ' + err.message);
    }
  }

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('ユーザーリストの取得に失敗しました');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error('ユーザーリスト取得エラー:', err);
      setError('ユーザーリストの取得に失敗しました。');
    }
  }

  async function fetchTransactions() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user-transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('取引履歴の取得に失敗しました');
      }
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      console.error('取引履歴取得エラー:', err);
      setError('取引履歴の取得に失敗しました。');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!recipient || !amount) {
      setError('受取人と枚数を入力してください。');
      return;
    }

    if (parseFloat(amount) > sendableBalance) {
      setError('送付可能な残高が不足しています。');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipient, amount })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '送付に失敗しました');
      }

      const data = await response.json();
      setSuccess('送付が完了しました！');
      setSendableBalance(data.newSendableBalance);
      setRecipient('');
      setAmount('');
      fetchTransactions(); // 取引履歴を更新
    } catch (err) {
      console.error('送付エラー:', err);
      setError(err.message || '送付に失敗しました。残高が十分かご確認ください。');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.userInfo}>
          <h2 className={styles.title}>ユーザー情報</h2>
          <p className={styles.userInfoItem}>
            <span className={styles.label}>ユーザー名:</span>
            {username} <span className={styles.userId}>(ID: {userId})</span>
          </p>
          <p className={styles.userInfoItem}>
            <span className={styles.label}>所属コード:</span>
            {affiliationCode}
          </p>
        </div>
        <div className={styles.balanceInfo}>
          <div className={styles.balance}>
            <h3>送付可能残高</h3>
            <p className={styles.balanceAmount}>{sendableBalance}<span className={styles.currency}>DGC</span></p>
          </div>
          <div className={styles.balance}>
            <h3>受取済残高</h3>
            <p className={styles.balanceAmount}>{receivedBalance}<span className={styles.currency}>DGC</span></p>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title}>DigiCoin送付</h2>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="recipient" className={styles.label}>受取人:</label>
            <select
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">選択してください</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="amount" className={styles.label}>枚数:</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              max={sendableBalance}
              step="1"
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.button}>送付</button>
        </form>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title}>取引履歴</h2>
        {transactions.length > 0 ? (
          <table className={styles.transactionTable}>
            <thead>
              <tr>
                <th>日時</th>
                <th>種類</th>
                <th>相手</th>
                <th>金額</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className={tx.type === '送信' ? styles.sendTransaction : styles.receiveTransaction}>
                  <td>{new Date(tx.timestamp).toLocaleString()}</td>
                  <td>{tx.type}</td>
                  <td>{tx.type === '送信' ? tx.recipient : tx.sender}</td>
                  <td>{tx.amount} DGC</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.noTransactions}>取引履歴がありません。</p>
        )}
      </div>
    </div>
  );
}

