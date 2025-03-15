import React, { useState } from 'react';
import { signIn, signUp, fetchAuthSession } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const cloudFrontUrl = 'https://www.digisui-coin.com';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        if (!displayName) {
          setError('表示名を入力してください');
          setIsLoading(false);
          return;
        }
        console.log('サインアップ処理開始');
        const signUpResponse = await signUp({
          username,
          password,
        });
        console.log('サインアップレスポンス:', signUpResponse);

        if (signUpResponse.isSignUpComplete) {
          console.log('サインアップ成功、サインイン処理開始');
          await new Promise(resolve => setTimeout(resolve, 1000));

          const signInResponse = await signIn({ 
            username, 
            password,
          });
          console.log('サインインレスポンス:', signInResponse);

          if (signInResponse.isSignedIn) {
            console.log('サインイン成功、セッション情報保存開始');
            const shortUserId = signUpResponse.userId.split('-')[0];
            sessionStorage.setItem('userId', shortUserId);
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('username', username);
            
            // セッション情報からトークンを取得
            const session = await fetchAuthSession();
            const token = session.tokens.idToken.toString();
            sessionStorage.setItem('token', token);
            
            console.log('トークン取得:', token ? '成功' : '失敗');

            // DynamoDBへのユーザー登録
            try {
              console.log('DynamoDBへのユーザー登録開始');
              const registResponse = await fetch(`${cloudFrontUrl}/api/user`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userId: shortUserId,
                  username: displayName
                })
              });

              if (!registResponse.ok) {
                throw new Error('ユーザー登録に失敗しました');
              }

              console.log('DynamoDBへのユーザー登録成功');

              // ユーザー情報の取得
              console.log('ユーザー情報取得開始');
              const userResponse = await fetch(`${cloudFrontUrl}/api/user?userId=${shortUserId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (userResponse.ok) {
                const result = await userResponse.json();
                if (Array.isArray(result.allUsers)) {
                  sessionStorage.setItem('allUsers', JSON.stringify(result.allUsers));
                  console.log('allUsers保存完了');
                }
              }

              console.log('SendCoinページへ遷移開始');
              window.location.href = '/';
            } catch (apiError) {
              console.error('API呼び出しエラー:', apiError);
              setError('ユーザー登録に失敗しました。もう一度お試しください。');
              setIsLoading(false);
            }
          }
        }
      } else {
        // 既存のサインイン処理
        const signInResponse = await signIn({ 
          username, 
          password,
        });

        if (signInResponse.isSignedIn) {
          const session = await fetchAuthSession();
          const shortUserId = session.userSub.split('-')[0];
          sessionStorage.setItem('userId', shortUserId);
          sessionStorage.setItem('username', username);
          
          const token = sessionStorage.getItem('token');
          
          try {
            const response = await fetch(`${cloudFrontUrl}/user?userId=${shortUserId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const result = await response.json();
              if (Array.isArray(result.allUsers)) {
                sessionStorage.setItem('allUsers', JSON.stringify(result.allUsers));
              }
            }
          } catch (fetchError) {
            console.error('ユーザー情報取得エラー:', fetchError);
          }

          window.location.href = '/';
        }
      }
    } catch (error) {
      console.error('認証エラー:', error);
      
      if (error.name === 'UserAlreadyAuthenticatedException') {
        window.location.href = '/';
        return;
      }
      
      if (isSignUp) {
        if (error.name === 'UsernameExistsException') {
          setError('このユーザー名は既に使用されています');
        } else {
          setError('ユーザー登録に失敗しました');
        }
      } else {
        setError('ユーザー名またはパスワードが正しくありません');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <div className="max-w-md mx-auto my-10">
          <div className="text-center">
            <h1 className="my-3 text-3xl font-semibold text-gray-700">
              {isSignUp ? 'アカウント作成' : 'ログイン'}
            </h1>
            <p className="text-gray-500">
              {isSignUp ? '必要事項を入力してアカウントを作成してください' : 'ログインIDとパスワードを入力してください'}
            </p>
          </div>
          
          <div className="m-7">
            <form onSubmit={onSubmit}>
              <div className="mb-4">
                <label className="block mb-2 text-sm text-gray-600">ログインID</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 text-gray-700 bg-white border rounded-lg focus:border-blue-400 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                  required
                  autoComplete="username"
                />
              </div>

              {isSignUp && (
                <div className="mb-4">
                  <label className="block mb-2 text-sm text-gray-600">表示名</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 text-gray-700 bg-white border rounded-lg focus:border-blue-400 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                    required
                    autoComplete="off"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    ※他のユーザーに表示される名前です
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="block mb-2 text-sm text-gray-600">パスワード</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-2 text-gray-700 bg-white border rounded-lg 
                      focus:border-blue-400 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40
                      ${error && isSignUp ? 'border-red-500' : ''}`}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 text-center text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full px-3 py-4 text-white bg-blue-500 rounded-md 
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'} 
                    focus:bg-blue-600 focus:outline-none`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isSignUp ? '登録中...' : 'ログイン中...'}
                    </div>
                  ) : (
                    isSignUp ? 'アカウント作成' : 'ログイン'
                  )}
                </button>
              </div>

              <p className="text-sm text-center text-gray-400">
                {isSignUp ? 'すでにアカウントをお持ちですか？ ' : 'アカウントをお持ちでないですか？ '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setUsername('');
                    setPassword('');
                    setDisplayName('');
                  }}
                  disabled={isLoading}
                  className={`text-blue-400 focus:outline-none hover:underline 
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSignUp ? 'ログイン' : 'アカウント作成'}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;

