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
        setRankings(sortedUsers);
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

  const getRankStyle = (index) => {
    switch(index) {
      case 0: return 'bg-yellow-50';  // 1位
      case 1: return 'bg-gray-50';    // 2位
      case 2: return 'bg-orange-50';  // 3位
      default: return 'bg-white';
    }
  };

  const getRankBadge = (index) => {
    const rank = index + 1;
    switch(index) {
      case 0:
        return <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">1位</span>;
      case 1:
        return <span className="bg-slate-300 text-white text-xs font-bold px-3 py-1 rounded-full">2位</span>;
      case 2:
        return <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">3位</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{rank}位</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-4">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="shadow-lg rounded-lg overflow-hidden mx-4 md:mx-10 bg-white">
      <table className="w-full table-fixed">
        <thead>
          <tr className="bg-gray-300">
            <th className="w-1/3 py-4 px-6 text-left text-gray-600 font-bold uppercase">順位</th>
            <th className="w-1/3 py-4 px-6 text-left text-gray-600 font-bold uppercase">ユーザー名</th>
            <th className="w-1/3 py-4 px-6 text-left text-gray-600 font-bold uppercase">累計送信額</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((user, index) => (
            <tr key={user.userId} className={getRankStyle(index)}>
              <td className="py-4 px-6 border-b border-gray-200">
                {getRankBadge(index)}
              </td>
              <td className="py-4 px-6 border-b border-gray-200">
                {user.name}
              </td>
              <td className="py-4 px-6 border-b border-gray-200">
                {user.total} コイン
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Ranking;

