import React, { useEffect, useState } from 'react';
import styles from './Ranking.module.css';

function Ranking() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('allUsers')) || [];
    console.log('取得したユーザーデータ:', allUsers);

    const sortedUsers = allUsers
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    console.log('ソートされたユーザーデータ:', sortedUsers);
    setRanking(sortedUsers);
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>ランキング</h2>
      <div className={styles.tableContainer}>
        {ranking.map((user, index) => (
          <div key={user.userId} className={styles.tableRow}>
            <span className={styles.tableCell}>{index + 1}位</span>
            <span className={styles.tableCell}>{user.name}</span>
            <span className={styles.tableCell}>{user.total} コイン</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ranking;

