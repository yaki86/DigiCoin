import React, { useEffect, useState } from 'react';

function Ranking() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = sessionStorage.getItem('userId');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!userId) {
        setError('ユーザーIDが取得できませんでした');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allUsers = JSON.parse(sessionStorage.getItem('allUsers') || '[]');
        
        if (!allUsers.length) {
          setError('ユーザー情報が見つかりません');
          return;
        }

        const sortedUsers = allUsers.sort((a, b) => b.total - a.total);
        const top10Users = sortedUsers.slice(0, 10);
        setRankings(top10Users);
        setError(null);
      } catch (error) {
        console.error('ユーザー取得エラー:', error);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userId]);

  const getRankBadge = (index) => {
    const badges = {
      0: 'bg-yellow-500',
      1: 'bg-gray-400',
      2: 'bg-orange-500'
    };

    const rank = index + 1;
    const badgeColor = badges[index] || 'bg-blue-400';

    return (
      <span className={`${badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
        {rank}位
      </span>
    );
  };

  const getRankBackground = (index) => {
    const backgrounds = {
      0: 'bg-yellow-50',
      1: 'bg-gray-100',
      2: 'bg-orange-50'
    };
    return backgrounds[index] || 'bg-white';
  };

  const getRankTextColor = (index) => {
    const colors = {
      0: 'text-yellow-600',
      1: 'text-gray-600',
      2: 'text-orange-600'
    };
    return colors[index] || 'text-gray-900';
  };

  const getTopRankStyles = (index) => {
    if (index > 2) return '';
    return 'transform hover:scale-105 transition-transform duration-200 border-2 border-opacity-50 ' + 
           (index === 0 ? 'border-yellow-400 shadow-lg' :
            index === 1 ? 'border-gray-400 shadow-md' :
            'border-orange-400 shadow-md');
  };

  if (loading) {
    return <div className="text-center py-4">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl font-bold my-4">累計送信ランキング</h2>
      
      <div className="space-y-3">
        {rankings.map((user, index) => (
          <div 
            key={user.userId} 
            className={`${getRankBackground(index)} shadow rounded-lg p-4 ${
              user.userId === userId ? 'ring-2 ring-blue-500' : ''
            } ${getTopRankStyles(index)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getRankBadge(index)}
                <div>
                  <div className="font-medium">
                    {user.name}
                    {user.userId === userId && (
                      <span className="ml-2 text-xs text-blue-600">(あなた)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user.userId}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${getRankTextColor(index)}`}>
                  {user.total.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  DGC
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rankings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          ランキングデータがありません
        </div>
      )}
    </div>
  );
}

export default Ranking;

