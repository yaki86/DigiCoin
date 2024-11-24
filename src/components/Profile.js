import React, { useState, useEffect } from 'react';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('プロフィールの取得に失敗しました');
        }

        const data = await response.json();
        setProfile(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchProfile();
  }, []);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!profile) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="container">
      <div className="profile-container">
        <h1>プロフィール</h1>
        <p><strong>ユーザー名:</strong> {profile.username}</p>
        <p><strong>残高:</strong> {profile.balance} DigiCoin</p>
      </div>
    </div>
  );
};

export default Profile;