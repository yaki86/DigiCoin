import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';

function AllHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );

  const ReceiveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 9-3 3m0 0 3 3m-3-3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );

  // ページネーション用の計算
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  // ページ変更ハンドラー
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getTransactionBackground = (transaction) => {
    return transaction.senderId === userId 
      ? 'bg-orange-50'  // 送信の場合は薄いオレンジ
      : 'bg-green-50';  // 受信の場合は薄い緑
  };

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
        {currentTransactions.map((transaction, index) => (
          <div key={index} className={`${getTransactionBackground(transaction)} shadow rounded-lg p-4`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                {formatDate(transaction.timestamp)}
              </span>
              <span className={`${
                transaction.senderId === userId ? 'text-orange-500' : 'text-green-500'
              } flex items-center gap-1`}>
                <span className="text-sm">
                  {transaction.senderId === userId ? '送信' : '受信'}
                </span>
                {transaction.senderId === userId ? <SendIcon /> : <ReceiveIcon />}
              </span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold">
                {transaction.amount} DGC
              </span>
              <span className={`${
                transaction.senderId === userId ? 'text-orange-500' : 'text-green-500'
              } flex items-center gap-2`}>
                {getUserName(transaction.senderId === userId ? transaction.recipientId : transaction.senderId)}
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

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          取引履歴がありません
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                前へ
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                次へ
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{startIndex + 1}</span>
                  から
                  <span className="font-medium">{Math.min(endIndex, transactions.length)}</span>
                  件を表示 / 全
                  <span className="font-medium">{transactions.length}</span>
                  件
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">前へ</span>
                    <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === i + 1
                          ? 'z-10 bg-indigo-600 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                          : 'text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">次へ</span>
                    <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllHistory;

