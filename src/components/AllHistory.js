import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';

function AllHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = sessionStorage.getItem('userId');
  const allUsers = JSON.parse(sessionStorage.getItem('allUsers') || '[]');

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'yyyy/MM/dd HH:mm:ss');
    } catch (error) {
      console.error('日付のパースエラー:', error);
      return dateString;
    }
  };

  const getUserName = (id) => {
    const user = allUsers.find(user => user.userId === id);
    return user ? user.name : 'Unknown';
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userId) {
        setError('ユーザーIDが取得できませんでした');
        setLoading(false);
        return;
      }

      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('トークンが見つかりません');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`https://www.digisui-coin.com/api/transactions?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const sortedTransactions = (data.transactions || []).sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setTransactions(sortedTransactions);
        setError(null);
      } catch (error) {
        console.error('トランザクション取得エラー:', error);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userId]);

  if (loading) {
    return <div className="text-center py-4">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="shadow-lg rounded-lg overflow-hidden mx-4 md:mx-10">
      <table className="w-full table-fixed">
        <thead>
          <tr className="bg-slate-300">
            <th className="w-1/6 py-4 px-6 text-left text-gray-600 font-bold uppercase">日時</th>
            <th className="w-1/6 py-4 px-6 text-left text-gray-600 font-bold uppercase">金額</th>
            <th className="w-1/6 py-4 px-6 text-left text-gray-600 font-bold uppercase">種類</th>
            <th className="w-1/6 py-4 px-6 text-left text-gray-600 font-bold uppercase">送信者</th>
            <th className="w-1/6 py-4 px-6 text-left text-gray-600 font-bold uppercase">受信者</th>
            <th className="w-1/6 py-4 px-6 text-left text-gray-600 font-bold uppercase">取引ID</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {transactions.length > 0 ? (
            transactions.map((transaction, index) => (
              <tr key={index}>
                <td className="py-4 px-6 border-b border-gray-200">
                  {formatDate(transaction.timestamp)}
                </td>
                <td className="py-4 px-6 border-b border-gray-200">{transaction.amount} コイン</td>
                <td className="py-4 px-6 border-b border-gray-200">
                  <span className={`${
                    transaction.senderId === userId ? 'bg-red-500' : 'bg-green-500'
                  } text-white py-1 px-2 rounded-full text-xs`}>
                    {transaction.senderId === userId ? '送信' : '受信'}
                  </span>
                </td>
                <td className="py-4 px-6 border-b border-gray-200">
                  {getUserName(transaction.senderId)}
                </td>
                <td className="py-4 px-6 border-b border-gray-200">
                  {getUserName(transaction.recipientId)}
                </td>
                <td className="py-4 px-6 border-b border-gray-200 truncate">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${transaction.transactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {transaction.transactionId}
                  </a>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="py-4 px-6 text-center border-b border-gray-200">
                取引履歴がありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AllHistory;

