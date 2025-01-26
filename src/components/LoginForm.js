import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp, signOut } from '@aws-amplify/auth';
import styles from './LoginForm.module.css';

export default function LoginForm({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const clearSession = async () => {
      try {
        await signOut();
        setIsLoggedIn(false);
      } catch (error) {
        console.error('サインアウトエラー:', error);
      }
    };
    clearSession();
  }, [setIsLoggedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const { isSignedIn } = await signIn({ username, password });
        if (isSignedIn) {
          setIsLoggedIn(true);
          navigate('/send');
        }
      } else {
        await signUp({
          username,
          password,
          options: {
            userAttributes: {
              email: username
            }
          }
        });
        setError('登録が完了しました。ログインしてください。');
        setIsLogin(true);
      }
    } catch (error) {
      console.error('認証エラー:', error);
      setError(getErrorMessage(error));
    }
  };

  const getErrorMessage = (error) => {
    switch (error.name) {
      case 'NotAuthorizedException':
        return 'ユーザー名またはパスワードが正しくありません。';
      case 'UserNotFoundException':
        return 'ユーザーが見つかりません。';
      case 'UserNotConfirmedException':
        return 'ユーザーの確認が完了していません。';
      default:
        return '認証中にエラーが発生しました。もう一度お試しください。';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>
          {isLogin ? 'ログイン' : '新規登録'}
        </h2>
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
              autoComplete={isLogin ? "username" : "new-username"}
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
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            {isLogin ? 'ログイン' : '登録'}
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className={styles.toggleButton}
          >
            {isLogin ? '新規登録はこちら' : 'ログインはこちら'}
          </button>
        </form>
      </div>
    </div>
  );
}

