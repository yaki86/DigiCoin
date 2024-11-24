import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './AllHistory.module.css';

export default function AllHistory() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '取引履歴の取得に失敗しました');
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      console.error('取引履歴取得エラー:', err);
      setError('取引履歴の取得に失敗しました: ' + err.message);
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>取引履歴</h2>
      {error && <p className={styles.error}>{error}</p>}
      {transactions.length > 0 ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>日時</th>
                <th>送信者</th>
                <th>受信者</th>
                <th>金額</th>
                <th>取引ハッシュ</th>
                <th>詳細</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.timestamp).toLocaleString()}</td>
                  <td>{tx.sender || '不明'}</td>
                  <td>{tx.recipient || '不明'}</td>
                  <td>{tx.amount} DGC</td>
                  <td>
                    <span className={styles.hash} title={tx.transactionHash}>
                      {tx.transactionHash.slice(0, 10)}...
                    </span>
                  </td>
                  <td>
                    <Link to={`/transaction/${tx.id}`} className={styles.detailLink}>
                      詳細を見る
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>取引履歴がありません。</p>
      )}
    </div>
  );
}

