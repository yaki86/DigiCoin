import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '@aws-amplify/auth';
import styles from './SendPage.module.css';

export default function SendPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('サインアウトエラー:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // TODO: APIを呼び出して送金処理を実行
      console.log('送金処理:', { amount, recipient });
      
      // 仮の成功メッセージ
      setSuccessMessage(`${recipient}さんに${amount}コインを送金しました！`);
      setAmount('');
      setRecipient('');
    } catch (error) {
      console.error('送金エラー:', error);
      setError('送金処理中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>デジコイン送金</h1>
        <button onClick={handleSignOut} className={styles.signOutButton}>
          サインアウト
        </button>
      </header>
      
      <main className={styles.main}>
        {error && <p className={styles.error}>{error}</p>}
        {successMessage && <p className={styles.success}>{successMessage}</p>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="recipient" className={styles.label}>
              送金先ユーザー名:
            </label>
            <input
              type="text"
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              className={styles.input}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="amount" className={styles.label}>
              送金額 (コイン):
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="1"
              className={styles.input}
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? '送金中...' : '送金する'}
          </button>
        </form>
      </main>
    </div>
  );
} 