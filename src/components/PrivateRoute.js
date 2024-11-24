import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // トークンがない場合、ログインページにリダイレクト
    return <Navigate to="/" replace />;
  }

  // トークンがある場合、子コンポーネントを表示
  return children;
};

export default PrivateRoute;

