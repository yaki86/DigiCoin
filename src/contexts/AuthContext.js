import React, { createContext, useContext, useState } from 'react';

// AuthContextの作成
const AuthContext = createContext();

// AuthProviderコンポーネントの作成
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// AuthContextを使用するためのカスタムフック
export const useAuth = () => {
  return useContext(AuthContext);
}; 