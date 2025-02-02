import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';

function Navbar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      navigate('/login');
    } catch (error) {
      console.error('サインアウトエラー:', error);
    }
  };

  return (
    <nav className="bg-blue-400 shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-gray-50 text-lg font-semibold">
              DigiCoin
            </span>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleSignOut}
              className="bg-blue-500 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              サインアウト
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;