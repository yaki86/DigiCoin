import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';
import LoginForm from './components/LoginForm';
import SendCoin from './components/SendCoin';
import AllHistory from './components/AllHistory';
import Ranking from './components/Ranking';
import Navbar from './components/Navbar';

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      await getCurrentUser();
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  };

  const PrivateRoute = ({ children }) => {
    if (!authChecked) {
      return null; // 認証チェック中は何も表示しない
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>
      </>
    );
  };

  if (!authChecked) {
    return null; // 初期認証チェック中は何も表示しない
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />} 
          />
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <SendCoin />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <PrivateRoute>
                <AllHistory />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/ranking" 
            element={
              <PrivateRoute>
                <Ranking />
              </PrivateRoute>
            } 
          />
          {/* 未定義のパスの場合はホームにリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
