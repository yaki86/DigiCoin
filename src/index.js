import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Amplify } from 'aws-amplify';

// デバッグ用の環境変数チェック
const envVars = {
  region: process.env.REACT_APP_REGION,
  userPoolId: process.env.REACT_APP_USER_POOL_ID,
  userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  apiEndpoint: process.env.REACT_APP_API_ENDPOINT
};

console.log('設定値:', envVars);

Object.entries(envVars).forEach(([key, value]) => {
  if (!value) {
    console.error(`環境変数が未設定です: ${key}`);
  }
});

// 基本設定
const config = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
      region: process.env.REACT_APP_REGION
    }
  },
  API: {
    REST: {
      default: {  // APIの名前を'default'に変更
        endpoint: process.env.REACT_APP_API_ENDPOINT,
        region: process.env.REACT_APP_REGION
      }
    }
  }
};

// 単一の configure 呼び出し
Amplify.configure(config);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);