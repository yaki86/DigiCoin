import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import './App.css';
import LoginForm from './components/LoginForm';
import SendCoin from './components/SendCoin';
import Ranking from './components/Ranking';
import AllHistory from './components/AllHistory';
import TransactionInfo from './components/TransactionInfo';
import PrivateRoute from './components/PrivateRoute';

function NavBar({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate(isLoggedIn ? '/send' : '/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(prevState => !prevState);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="/" onClick={handleLogoClick} className="nav-logo">DigiCoin</a>
        <div className="nav-right">
          <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            {isLoggedIn ? (
              <>
                <Link to="/send" onClick={() => setIsMenuOpen(false)}>コイン送付</Link>
                <Link to="/ranking" onClick={() => setIsMenuOpen(false)}>ランキング</Link>
                <Link to="/history" onClick={() => setIsMenuOpen(false)}>全履歴</Link>
                <button onClick={handleLogout} className="logout-button">ログアウト</button>
              </>
            ) : (
              <Link to="/" onClick={() => setIsMenuOpen(false)}>ログイン</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <Router>
      <div className="app">
        <NavBar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        <Routes>
          <Route path="/" element={<LoginForm setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/send" element={<PrivateRoute><SendCoin /></PrivateRoute>} />
          <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><AllHistory /></PrivateRoute>} />
          <Route path="/transaction/:id" element={<PrivateRoute><TransactionInfo /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
