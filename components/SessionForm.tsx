
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

// Helper to parse from "1.234,56" format
const parseFromInput = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
};

const SessionForm: React.FC<SessionFormProps> = ({ isOpen, onClose, onSave, sessionToEdit }) => {
  const [patientName, setPatientName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionFee, setSessionFee] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.WAITING);
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [error, setError] = useState('');

  const resetForm = useCallback(() => {
    setPatientName(sessionToEdit?.patientName || '');
    const date = sessionToEdit ? new Date(sessionToEdit.sessionDate) : new Date();
    // Format to 'YYYY-MM-DDTHH:mm' which is required by datetime-local input
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    setSessionDate(date.toISOString().slice(0, 16));

    const dueDate = sessionToEdit?.paymentDueDate ? new Date(sessionToEdit.paymentDueDate) : new Date(date);
    if (!sessionToEdit?.paymentDueDate) {
        dueDate.setDate(dueDate.getDate() + 7); // Default due date 7 days later
    }
    setPaymentDueDate(dueDate.toISOString().slice(0, 10)); // YYYY-MM-DD for date input

    setSessionFee(sessionToEdit?.sessionFee.toLocaleString('tr-TR') || '');
    setPaymentStatus(sessionToEdit?.paymentStatus || PaymentStatus.WAITING);
    setError('');
  }, [sessionToEdit]);

  useEffect(() => {
    if (isOpen) {
        resetForm();
    }
  }, [isOpen, sessionToEdit, resetForm]);
  
  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value === '') {
        setSessionFee('');
        return;
    }
    // Remove everything that is not a digit or a comma
    const cleanedValue = value.replace(/[^\d,]/g, '');
    const parts = cleanedValue.split(',');
    // Remove old thousands separators from integer part
    const integerPart = parts[0].replace(/\./g, '');
    const formattedInteger = new Intl.NumberFormat('tr-TR').format(Number(integerPart) || 0);
    let finalValue = formattedInteger;
    if (parts.length > 1) {
        finalValue += ',' + parts[1].slice(0, 2);
    }
    setSessionFee(finalValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !sessionDate || !sessionFee || !paymentDueDate) {
      setError('Tüm alanlar zorunludur.');
      return;
    }
    const sessionFeeNumber = parseFromInput(sessionFee);
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
      paymentDueDate: new Date(paymentDueDate).toISOString(),
      paymentDate: sessionToEdit?.paymentDate, // Preserve existing payment date
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
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="sessionFee" className="block text-sm font-medium text-gray-700">Seans Ücreti</label>
                <input
                type="text"
                inputMode="decimal"
                id="sessionFee"
                value={sessionFee}
                onChange={handleFeeChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
                required
                />
            </div>
            <div>
                <label htmlFor="paymentDueDate" className="block text-sm font-medium text-gray-700">Son Ödeme Tarihi</label>
                <input
                type="date"
                id="paymentDueDate"
                value={paymentDueDate}
                onChange={(e) => setPaymentDueDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
                required
                />
            </div>
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
