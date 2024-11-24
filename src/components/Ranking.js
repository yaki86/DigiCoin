import React, { useState, useEffect } from 'react';
import styles from './Ranking.module.css';

export default function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRanking();
  }, []);

  async function fetchRanking() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const response = await fetch('/api/ranking', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ランキングの取得に失敗しました');
      }

      const data = await response.json();
      setRanking(data.ranking);
    } catch (err) {
      console.error('ランキング取得エラー:', err);
      setError('ランキングの取得に失敗しました: ' + err.message);
    }
  }

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return '👑';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${index + 1}`;
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>受取残高ランキング</h2>
      {error && <p className={styles.error}>{error}</p>}
      {ranking.length > 0 ? (
        <ul className={styles.list}>
          {ranking.map((user, index) => (
            <li key={user._id} className={`${styles.item} ${styles[`rank${index + 1}`]}`}>
              <div className={styles.rank}>
                <span className={styles.icon}>{getRankIcon(index)}</span>
                <span className={styles.rankNumber}>{index + 1}</span>
              </div>
              <div className={styles.info}>
                <h3 className={styles.username}>{user.username}</h3>
                <p className={styles.balance}>{user.receivedBalance} DGC</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>ランキングデータがありません。</p>
      )}
    </div>
  );
}

