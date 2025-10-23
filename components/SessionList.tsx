import React, { useState, useEffect, useRef } from 'react';
import { Session, PaymentStatus } from '../types';
import { EditIcon, TrashIcon } from './icons';

interface SessionListProps {
  sessions: Session[];
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  onUpdate: (sessionId: string, updatedData: Partial<Session>) => void;
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

const SessionRow: React.FC<{
    session: Session, 
    onEdit: (session: Session) => void, 
    onDelete: (sessionId: string) => void,
    onUpdate: (sessionId: string, updatedData: Partial<Session>) => void
}> = ({session, onEdit, onDelete, onUpdate}) => {
    const [editingField, setEditingField] = useState<keyof Session | null>(null);
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

    useEffect(() => {
        if (editingField && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingField]);
    
    const handleUpdate = (field: keyof Session, value: any) => {
        let valueToSave = value;
        if (field === 'sessionDate') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                setEditingField(null); // Invalid date, cancel edit
                return;
            }
            valueToSave = date.toISOString();
        }
        
        if (session[field] !== valueToSave) {
            onUpdate(session.id, { [field]: valueToSave });
        }
        setEditingField(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, field: keyof Session) => {
        if (e.key === 'Enter') {
            handleUpdate(field, e.currentTarget.value);
        }
        if (e.key === 'Escape') {
            setEditingField(null);
        }
    };

    const formattedDate = new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date(session.sessionDate)).replace(/\./g, '/').replace(',', '');

    const localDate = new Date(session.sessionDate);
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
    const dateForInput = localDate.toISOString().slice(0, 16);

    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" onClick={() => !editingField && setEditingField('patientName')}>
                {editingField === 'patientName' ? (
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type="text"
                        defaultValue={session.patientName}
                        onBlur={(e) => handleUpdate('patientName', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'patientName')}
                        className="w-full px-2 py-1 border border-primary-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                ) : session.patientName}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={() => !editingField && setEditingField('sessionDate')}>
                 {editingField === 'sessionDate' ? (
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type="datetime-local"
                        defaultValue={dateForInput}
                        onBlur={(e) => handleUpdate('sessionDate', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'sessionDate')}
                        className="w-full px-2 py-1 border border-primary-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                 ) : formattedDate}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₺{session.commission.toFixed(2)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={() => !editingField && setEditingField('paymentStatus')}>
                {editingField === 'paymentStatus' ? (
                    <select
                        ref={inputRef as React.RefObject<HTMLSelectElement>}
                        defaultValue={session.paymentStatus}
                        onBlur={(e) => handleUpdate('paymentStatus', e.target.value as PaymentStatus)}
                        onChange={(e) => handleUpdate('paymentStatus', e.target.value as PaymentStatus)}
                        onKeyDown={(e) => { if (e.key === 'Escape') setEditingField(null); }}
                        className="w-full px-2 py-1 border border-primary-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        {Object.values(PaymentStatus).map(status => (
                            <option key={status} value={status}>{PaymentStatusTR[status]}</option>
                        ))}
                    </select>
                ) : (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[session.paymentStatus]}`}>
                        {PaymentStatusTR[session.paymentStatus]}
                    </span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                <button onClick={() => onEdit(session)} className="text-primary hover:text-primary-700">
                    <EditIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(session.id)} className="text-red-600 hover:text-red-800">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </td>
        </tr>
    );
};


const SessionList: React.FC<SessionListProps> = ({ sessions, onEdit, onDelete, onUpdate }) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-medium text-gray-700">Henüz kaydedilmiş seans yok.</h3>
        <p className="mt-2 text-gray-500">Başlamak için "Yeni Seans Ekle" butonuna tıklayın.</p>
      </div>
    );
  }

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danışan</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih & Saat</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Komisyon</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">İşlemler</span>
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {sortedSessions.map(session => (
                    <SessionRow key={session.id} session={session} onEdit={onEdit} onDelete={onDelete} onUpdate={onUpdate} />
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default SessionList;