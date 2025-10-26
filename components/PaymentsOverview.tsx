
import React from 'react';
import { Session, PaymentStatus } from '../types';
import { EditIcon } from './icons';

interface PaymentsOverviewProps {
  sessions: Session[];
  onEdit: (session: Session) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

const PaymentsOverview: React.FC<PaymentsOverviewProps> = ({ sessions, onEdit }) => {
  const waitingSessions = sessions.filter(s => s.paymentStatus === PaymentStatus.WAITING);
  
  const outstandingBalance = waitingSessions.reduce((sum, s) => sum + s.sessionFee, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = waitingSessions
    .filter(s => s.paymentDueDate && new Date(s.paymentDueDate) < today)
    .sort((a,b) => new Date(a.paymentDueDate!).getTime() - new Date(b.paymentDueDate!).getTime());

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);
  
  const upcoming = waitingSessions
    .filter(s => s.paymentDueDate && new Date(s.paymentDueDate) >= today && new Date(s.paymentDueDate) <= sevenDaysFromNow)
    .sort((a,b) => new Date(a.paymentDueDate!).getTime() - new Date(b.paymentDueDate!).getTime());

  if (sessions.length === 0) {
      return null;
  }
  
  // FIX: Explicitly type SessionRow as a React.FC to correctly handle the `key` prop in JSX.
  const SessionRow: React.FC<{session: Session}> = ({session}) => (
    <tr className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
        <td className="px-4 py-3 text-sm text-gray-800">{session.patientName}</td>
        <td className="px-4 py-3 text-sm text-gray-500">{new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(session.sessionDate))}</td>
        <td className="px-4 py-3 text-sm text-gray-500 font-medium">{session.paymentDueDate ? new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(session.paymentDueDate)) : '-'}</td>
        <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{formatCurrency(session.sessionFee)}</td>
        <td className="px-4 py-3 text-right">
            <button onClick={() => onEdit(session)} className="text-primary hover:text-primary-700">
                <EditIcon className="w-5 h-5" />
            </button>
        </td>
    </tr>
  );

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Ödeme Takibi</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
            <p className="font-bold">Toplam Ödenmemiş Bakiye</p>
            <p className="text-3xl">{formatCurrency(outstandingBalance)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Vadesi Geçmiş Ödemeler ({overdue.length})</h3>
                <div className="border rounded-lg overflow-hidden">
                    {overdue.length > 0 ? (
                       <table className="min-w-full">
                           <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                               <tr>
                                   <th className="px-4 py-2 text-left">Danışan</th>
                                   <th className="px-4 py-2 text-left">Seans Tarihi</th>
                                   <th className="px-4 py-2 text-left">Son Ödeme</th>
                                   <th className="px-4 py-2 text-left">Tutar</th>
                                   <th className="px-4 py-2 text-right"></th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200">
                               {overdue.map(s => <SessionRow key={s.id} session={s} />)}
                           </tbody>
                       </table>
                    ) : (
                        <p className="text-center text-gray-500 p-6">Vadesi geçmiş ödeme bulunmamaktadır.</p>
                    )}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Yaklaşan Ödemeler ({upcoming.length})</h3>
                 <div className="border rounded-lg overflow-hidden">
                    {upcoming.length > 0 ? (
                       <table className="min-w-full">
                           <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                               <tr>
                                   <th className="px-4 py-2 text-left">Danışan</th>
                                   <th className="px-4 py-2 text-left">Seans Tarihi</th>
                                   <th className="px-4 py-2 text-left">Son Ödeme</th>
                                   <th className="px-4 py-2 text-left">Tutar</th>
                                   <th className="px-4 py-2 text-right"></th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200">
                               {upcoming.map(s => <SessionRow key={s.id} session={s} />)}
                           </tbody>
                       </table>
                    ) : (
                        <p className="text-center text-gray-500 p-6">Yaklaşan ödeme bulunmamaktadır.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsOverview;
