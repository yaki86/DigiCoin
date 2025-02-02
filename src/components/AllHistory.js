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
      return format(parseISO(dateString), 'MM/dd HH:mm');
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl font-bold my-4">取引履歴</h2>
      
      <div className="space-y-4">
        {transactions.map((transaction, index) => (
          <div key={index} className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                {formatDate(transaction.timestamp)}
              </span>
              <span className={`${
                transaction.senderId === userId ? 'bg-red-500' : 'bg-green-500'
              } text-white text-xs px-2 py-1 rounded-full`}>
                {transaction.senderId === userId ? '送信' : '受信'}
              </span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold">
                {transaction.amount} DGC
              </span>
              <span className={`${
                transaction.senderId === userId ? 'text-red-500' : 'text-green-500'
              }`}>
                {transaction.senderId === userId 
                  ? `→ ${getUserName(transaction.recipientId)}` 
                  : `← ${getUserName(transaction.senderId)}`
                }
              </span>
            </div>

            <div className="text-xs text-gray-500 truncate">
              <a
                href={`https://sepolia.etherscan.io/tx/${transaction.transactionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                {transaction.transactionId}
              </a>
            </div>
          </div>
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          取引履歴がありません
        </div>
      )}
    </div>
  );
}

export default AllHistory;

