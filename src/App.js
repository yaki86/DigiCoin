import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import { getCurrentUser } from '@aws-amplify/auth';
import LoginForm from './components/LoginForm';
import SendCoin from './components/SendCoin';
import AllHistory from './components/AllHistory';
import Ranking from './components/Ranking';
import HamburgerMenu from './components/HamburgerMenu';
import './App.css';

const router = {
  future: {
    v7_relativeSplatPath: true
  }
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      await getCurrentUser();
      setIsLoggedIn(true);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter future={router.future}>
      <div className="App">
        <HamburgerMenu />

        <Routes>
          <Route 
            path="/" 
            element={
              isLoggedIn ? 
                <Navigate to="/send" replace /> : 
                <LoginForm setIsLoggedIn={setIsLoggedIn} />
            } 
          />
          <Route 
            path="/send" 
            element={
              isLoggedIn ? 
                <SendCoin /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/history" 
            element={
              isLoggedIn ? 
                <AllHistory /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/ranking" 
            element={
              isLoggedIn ? 
                <Ranking /> : 
                <Navigate to="/" replace />
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
