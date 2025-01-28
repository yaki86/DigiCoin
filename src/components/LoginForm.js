import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp, signOut, fetchAuthSession} from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import styles from './LoginForm.module.css';

// 手動での設定
Amplify.configure({
  Auth: {
    Cognito: {
    region: 'ap-northeast-1', // Cognitoのリージョン
    userPoolId: 'ap-northeast-1_ATf3lqfW1', // ユーザープールID
    userPoolClientId: '39p229mfp8p85cokfubk6p6c3r', // ユーザープールクライアントID
    }
  }
});

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
        const { isSignedIn, nextStep } = await signIn({ username, password });
        if (isSignedIn) {
          const session = await fetchAuthSession({ forceRefresh: false });
          console.log('セッション情報:', session); // デバッグ用
          const token = session.tokens.idToken;
          const userId = session.userSub.split('-')[0];

          // localStorageにユーザー情報を保存
          localStorage.setItem('userId', userId);
          localStorage.setItem('token', token);

          setIsLoggedIn(true);
          navigate('/send');
        } else {
          // 必要に応じて次のステップを処理
          handleNextSignInStep(nextStep);
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

  const handleNextSignInStep = (nextStep) => {
    // 次のサインインステップを処理するロジックをここに追加
    console.log('次のサインインステップ:', nextStep);
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

