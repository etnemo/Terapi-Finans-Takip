
import React, { useState, useEffect } from 'react';
import { Session, PaymentStatus } from '../types';
import { CloseIcon } from './icons';

interface MonthlySummaryProps {
  sessions: Session[];
}

interface MonthlyData {
  totalCommission: number;
  paidCommission: number;
  sessionsCount: number;
  totalIncome: number;
  outstandingBalance: number;
}

const PaymentStatusTR: Record<PaymentStatus, string> = {
  [PaymentStatus.PAID]: 'Ödendi',
  [PaymentStatus.WAITING]: 'Beklemede',
  [PaymentStatus.CANCELLED]: 'İptal Edildi',
};

const statusColorMap: Record<PaymentStatus, string> = {
  [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
  [PaymentStatus.WAITING]: 'bg-yellow-100 text-yellow-800',
  [PaymentStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);


const MonthlySummary: React.FC<MonthlySummaryProps> = ({ sessions }) => {
  const monthlyData = sessions.reduce((acc, session) => {
    const month = new Date(session.sessionDate).toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { totalCommission: 0, paidCommission: 0, sessionsCount: 0, totalIncome: 0, outstandingBalance: 0 };
    }
    if (session.paymentStatus !== PaymentStatus.CANCELLED) {
      acc[month].totalCommission += session.commission;
      acc[month].totalIncome += session.sessionFee;
      if (session.paymentStatus === PaymentStatus.PAID) {
        acc[month].paidCommission += session.commission;
      }
      if (session.paymentStatus === PaymentStatus.WAITING) {
        acc[month].outstandingBalance += session.sessionFee;
      }
    }
    acc[month].sessionsCount++;
    return acc;
  }, {} as Record<string, MonthlyData>);
  
  const { overallTotalIncome, overallOutstandingBalance } = sessions.reduce((totals, session) => {
    if (session.paymentStatus !== PaymentStatus.CANCELLED) {
      totals.overallTotalIncome += session.sessionFee;
    }
    if (session.paymentStatus === PaymentStatus.WAITING) {
      totals.overallOutstandingBalance += session.sessionFee;
    }
    return totals;
  }, { overallTotalIncome: 0, overallOutstandingBalance: 0 });

  const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
    const dateA = new Date(+a.split(' ')[1], new Date(Date.parse(a.split(' ')[0] +" 1, 2012")).getMonth());
    const dateB = new Date(+b.split(' ')[1], new Date(Date.parse(b.split(' ')[0] +" 1, 2012")).getMonth());
    return dateB.getTime() - dateA.getTime();
  });

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    if (sortedMonths.length > 0) {
      if (!selectedMonth || !sortedMonths.includes(selectedMonth)) {
        setSelectedMonth(sortedMonths[0]);
      }
    } else {
      setSelectedMonth(null);
    }
  }, [sortedMonths, selectedMonth]);

  if (sortedMonths.length === 0) {
    return null;
  }

  const handleOpenModal = () => {
    if (selectedMonth) {
      setIsDetailsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false);
  };

  const currentMonthData = selectedMonth ? monthlyData[selectedMonth] : null;

  const sessionsForSelectedMonth = selectedMonth ? sessions.filter(session => {
    const sessionMonth = new Date(session.sessionDate).toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
    return sessionMonth === selectedMonth;
  }).sort((a,b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()) : [];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Aylık Özet</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="month-select" className="block text-sm font-medium text-gray-700">
              Ay Seçin
            </label>
            <select
              id="month-select"
              name="month-select"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {sortedMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className="sm:ml-4 flex-shrink-0 mt-4 sm:mt-0">
             <button
                onClick={handleOpenModal}
                disabled={!selectedMonth}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Ay Detaylarını Görüntüle
              </button>
          </div>
        </div>
        {currentMonthData && (
          <>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Toplam Seans</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{currentMonthData.sessionsCount}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-indigo-700">Toplam Gelir</p>
                <p className="mt-1 text-3xl font-semibold text-indigo-600">{formatCurrency(currentMonthData.totalIncome)}</p>
              </div>
               <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-red-700">Ödenmemiş Bakiye</p>
                <p className="mt-1 text-3xl font-semibold text-red-600">{formatCurrency(currentMonthData.outstandingBalance)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-700">Ödenen Komisyon</p>
                <p className="mt-1 text-3xl font-semibold text-green-600">{formatCurrency(currentMonthData.paidCommission)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-700">Toplam Alacak</p>
                <p className="mt-1 text-3xl font-semibold text-blue-600">{formatCurrency(currentMonthData.totalCommission)}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Genel Özet</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                    <div className="bg-gray-100 p-6 rounded-lg">
                        <p className="text-lg font-medium text-gray-600">Toplam Gelir (Tüm Zamanlar)</p>
                        <p className="mt-2 text-4xl font-bold text-primary-600">{formatCurrency(overallTotalIncome)}</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-lg">
                        <p className="text-lg font-medium text-red-700">Toplam Ödenmemiş Bakiye</p>
                        <p className="mt-2 text-4xl font-bold text-red-600">{formatCurrency(overallOutstandingBalance)}</p>
                    </div>
                </div>
            </div>
          </>
        )}
      </div>

      {isDetailsModalOpen && selectedMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 w-full max-w-5xl relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{selectedMonth} Seans Detayları</h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="overflow-y-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                      <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danışan</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih & Saat</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ücret</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son Ödeme Tarihi</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ödeme Tarihi</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {sessionsForSelectedMonth.map(session => (
                          <tr key={session.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.patientName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Intl.DateTimeFormat('tr-TR', {
                                      year: 'numeric', month: '2-digit', day: '2-digit',
                                      hour: '2-digit', minute: '2-digit', hour12: false,
                                  }).format(new Date(session.sessionDate)).replace(/\./g, '/').replace(',', '')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(session.sessionFee)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[session.paymentStatus]}`}>
                                      {PaymentStatusTR[session.paymentStatus]}
                                  </span>
                              </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {session.paymentDueDate ? new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(session.paymentDueDate)) : '-'}
                              </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {session.paymentDate ? new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(session.paymentDate)) : '-'}
                              </td>
                          </tr>
                      ))}
                      {sessionsForSelectedMonth.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-gray-500">Bu ay için seans bulunamadı.</td>
                          </tr>
                      )}
                  </tbody>
              </table>
            </div>
             <div className="flex justify-end pt-4 mt-auto border-t">
                <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                Kapat
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlySummary;
