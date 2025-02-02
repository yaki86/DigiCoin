import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SendCoin from './components/SendCoin';
import AllHistory from './components/AllHistory';
import Ranking from './components/Ranking';
import LoginForm from './components/LoginForm';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/" element={
          <Layout>
            <SendCoin />
          </Layout>
        } />
        <Route path="/history" element={
          <Layout>
            <AllHistory />
          </Layout>
        } />
        <Route path="/ranking" element={
          <Layout>
            <Ranking />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
