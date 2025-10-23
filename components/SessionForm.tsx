import React, { useState, useEffect, useCallback } from 'react';
import { Session, PaymentStatus } from '../types';
import { CloseIcon } from './icons';

interface SessionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Session) => void;
  sessionToEdit: Session | null;
}

const PaymentStatusTR: Record<PaymentStatus, string> = {
  [PaymentStatus.PAID]: 'Ödendi',
  [PaymentStatus.WAITING]: 'Beklemede',
  [PaymentStatus.CANCELLED]: 'İptal Edildi',
};

const SessionForm: React.FC<SessionFormProps> = ({ isOpen, onClose, onSave, sessionToEdit }) => {
  const [patientName, setPatientName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionFee, setSessionFee] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.WAITING);
  const [error, setError] = useState('');

  const resetForm = useCallback(() => {
    setPatientName(sessionToEdit?.patientName || '');
    const date = sessionToEdit ? new Date(sessionToEdit.sessionDate) : new Date();
    // Format to 'YYYY-MM-DDTHH:mm' which is required by datetime-local input
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    setSessionDate(date.toISOString().slice(0, 16));
    setSessionFee(sessionToEdit?.sessionFee.toString() || '');
    setPaymentStatus(sessionToEdit?.paymentStatus || PaymentStatus.WAITING);
    setError('');
  }, [sessionToEdit]);

  useEffect(() => {
    if (isOpen) {
        resetForm();
    }
  }, [isOpen, sessionToEdit, resetForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !sessionDate || !sessionFee) {
      setError('Tüm alanlar zorunludur.');
      return;
    }
    const sessionFeeNumber = parseFloat(sessionFee);
    if (isNaN(sessionFeeNumber) || sessionFeeNumber < 0) {
      setError('Lütfen geçerli bir seans ücreti girin.');
      return;
    }

    const calculatedCommission = (sessionFeeNumber / 1.1) / 2;
    
    const newSession: Session = {
      id: sessionToEdit?.id || crypto.randomUUID(),
      patientName,
      sessionDate: new Date(sessionDate).toISOString(),
      sessionFee: sessionFeeNumber,
      commission: calculatedCommission,
      paymentStatus,
    };
    onSave(newSession);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 m-4 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{sessionToEdit ? 'Seansı Düzenle' : 'Yeni Seans Ekle'}</h2>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">Danışan Adı</label>
            <input
              type="text"
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="sessionDate" className="block text-sm font-medium text-gray-700">Seans Tarihi & Saati</label>
            <input
              type="datetime-local"
              id="sessionDate"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="sessionFee" className="block text-sm font-medium text-gray-700">Seans Ücreti (₺)</label>
            <input
              type="number"
              id="sessionFee"
              value={sessionFee}
              onChange={(e) => setSessionFee(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">Ödeme Durumu</label>
            <select
              id="paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
            >
              {Object.values(PaymentStatus).map(status => (
                <option key={status} value={status}>{PaymentStatusTR[status]}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Seansı Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionForm;