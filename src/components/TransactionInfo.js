import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './TransactionInfo.module.css';

export default function TransactionInfo() {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();

  useEffect(() => {
    fetchTransactionInfo();
  }, [id]);

  async function fetchTransactionInfo() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const response = await fetch(`/api/transaction/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '取引情報の取得に失敗しました');
      }

      const data = await response.json();
      setTransaction(data.transaction);
    } catch (err) {
      console.error('取引情報取得エラー:', err);
      setError('取引情報の取得に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!transaction) {
    return <div className={styles.notFound}>取引情報が見つかりません。</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>取引詳細</h2>
      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.label}>取引ID:</span>
          <span className={styles.value}>{transaction.id}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>送信者:</span>
          <span className={styles.value}>
            {transaction.sender} (ID: {transaction.senderId})
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>受信者:</span>
          <span className={styles.value}>
            {transaction.recipient} (ID: {transaction.recipientId})
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>金額:</span>
          <span className={styles.value}>{transaction.amount} DGC</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>日時:</span>
          <span className={styles.value}>{new Date(transaction.timestamp).toLocaleString()}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>取引ハッシュ:</span>
          <span className={styles.value}>
            <a
              href={`https://sepolia.etherscan.io/tx/${transaction.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.hashLink}
            >
              {transaction.transactionHash}
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

