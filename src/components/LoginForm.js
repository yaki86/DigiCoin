import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginForm.module.css';

export default function LoginForm({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [affiliationCode, setAffiliationCode] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const url = isLogin ? '/api/login' : '/api/register';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isLogin ? { username, password } : { username, password, affiliationCode }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        data = await response.text();
        console.error('Expected JSON response but got:', data);
        throw new Error('サーバーからの応答が不正です');
      }

      if (!response.ok) {
        throw new Error(data.message || 'エラーが発生しました');
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true);  // ここでログイン状態を更新
        navigate('/send');
      } else {
        setIsLogin(true);
        setError('登録が完了しました。ログインしてください。');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'リクエストの処理中にエラーが発生しました');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>{isLogin ? 'ログイン' : '新規登録'}</h1>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>ユーザー名:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>パスワード:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          {!isLogin && (
            <div className={styles.formGroup}>
              <label htmlFor="affiliationCode" className={styles.label}>所属コード:</label>
              <input
                type="text"
                id="affiliationCode"
                value={affiliationCode}
                onChange={(e) => setAffiliationCode(e.target.value)}
                required
                className={styles.input}
              />
            </div>
          )}
          <button type="submit" className={styles.submitButton}>
            {isLogin ? 'ログイン' : '登録'}
          </button>
        </form>
        <button
          className={styles.toggleButton}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? '新規登録はこちら' : 'ログインはこちら'}
        </button>
      </div>
    </div>
  );
}

