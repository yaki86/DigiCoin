import React, { useEffect, useState } from 'react';
import styles from './AllHistory.module.css';

function AllHistory() {
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('sent');
  const userId = localStorage.getItem('userId'); // localStorageからuserIdを取得

  useEffect(() => {
    if (!userId) {
      console.error('ユーザーIDが取得できませんでした');
      return;
    }

    const fetchTransactions = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('トークンが見つかりません');
        return;
      }

      try {
        const response = await fetch(`https://d26ws69lscjxgo.cloudfront.net/api/transactions?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('トランザクションデータ:', data);
        setTransactions(data.transactions);
      } catch (error) {
        console.error('トランザクション取得エラー:', error);
      }
    };

    fetchTransactions();
  }, [userId]);

  const renderTransactionHistory = () => {
    return transactions
      .filter(transaction => 
        (activeTab === 'sent' && transaction.senderId === userId) ||
        (activeTab === 'received' && transaction.recipientId === userId)
      )
      .map((transaction, index) => (
        <div key={index} className={styles.tableContainer}>
          <span className={styles.table}>{transaction.timestamp}</span>
          <span className={styles.table}>{transaction.amount} コイン</span>
          <span className={styles.table}>{transaction.type}</span>
        </div>
      ));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>取引履歴</h2>
      <div className={styles.tabs}>
        <button className={activeTab === 'sent' ? styles.activeTab : ''} onClick={() => setActiveTab('sent')}>送信履歴</button>
        <button className={activeTab === 'received' ? styles.activeTab : ''} onClick={() => setActiveTab('received')}>受信履歴</button>
      </div>
      <div className={styles.tableContainer}>
        {transactions.length > 0 ? renderTransactionHistory() : <div className={styles.empty}>取引履歴がありません</div>}
      </div>
    </div>
  );
}

export default AllHistory;

