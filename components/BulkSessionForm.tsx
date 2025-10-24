import React, { useState } from 'react';
import { Session, PaymentStatus } from '../types';
import { CloseIcon, PlusIcon, TrashIcon } from './icons';

const PaymentStatusTR: Record<PaymentStatus, string> = {
  [PaymentStatus.PAID]: 'Ödendi',
  [PaymentStatus.WAITING]: 'Beklemede',
  [PaymentStatus.CANCELLED]: 'İptal Edildi',
};

type NewSessionRow = {
    patientName: string;
    sessionDate: string;
    sessionFee: string;
    paymentStatus: PaymentStatus;
    key: string; // for React list rendering
};

export interface BulkSessionData {
    patientName: string;
    sessionDate: string; // The value from datetime-local input
    sessionFee: number;
    paymentStatus: PaymentStatus;
}

interface BulkSessionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (sessions: BulkSessionData[]) => void;
}

const BulkSessionForm: React.FC<BulkSessionFormProps> = ({ isOpen, onClose, onSave }) => {
    const createNewRow = (): NewSessionRow => {
        const date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return {
            patientName: '',
            sessionDate: date.toISOString().slice(0, 16),
            sessionFee: '',
            paymentStatus: PaymentStatus.WAITING,
            key: crypto.randomUUID(),
        };
    };

    const [rows, setRows] = useState<NewSessionRow[]>([createNewRow()]);
    const [errors, setErrors] = useState<Record<number, Partial<Record<keyof NewSessionRow, string>>>>({});

    const addRow = () => {
        setRows([...rows, createNewRow()]);
    };

    const removeRow = (index: number) => {
        if (rows.length > 1) {
            setRows(rows.filter((_, i) => i !== index));
            setErrors(currentErrors => {
                const newErrors = {...currentErrors};
                delete newErrors[index];
                return newErrors;
            });
        }
    };

    const handleRowChange = (index: number, field: keyof NewSessionRow, value: string) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
        // Clear error for this field
        if (errors[index]?.[field]) {
            setErrors(current => ({
                ...current,
                [index]: { ...current[index], [field]: undefined }
            }));
        }
    };

    const validate = () => {
        const newErrors: Record<number, Partial<Record<keyof NewSessionRow, string>>> = {};
        let isValid = true;
        rows.forEach((row, index) => {
            newErrors[index] = {};
            if (!row.patientName.trim()) {
                newErrors[index].patientName = 'Gerekli';
                isValid = false;
            }
            if (!row.sessionDate) {
                newErrors[index].sessionDate = 'Gerekli';
                isValid = false;
            }
            const fee = parseFloat(row.sessionFee);
            if (!row.sessionFee || isNaN(fee) || fee < 0) {
                newErrors[index].sessionFee = 'Geçersiz';
                isValid = false;
            }
        });
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = () => {
        if (!validate()) {
            return;
        }
        
        const sessionsToSave: BulkSessionData[] = rows.map(row => ({
            patientName: row.patientName,
            sessionDate: row.sessionDate,
            sessionFee: parseFloat(row.sessionFee),
            paymentStatus: row.paymentStatus,
        }));
        onSave(sessionsToSave);
        onClose();
        // Reset form for next time
        setRows([createNewRow()]);
        setErrors({});
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 w-full max-w-4xl relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Toplu Seans Ekle</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="overflow-y-auto mt-4 flex-grow">
                    <div className="space-y-4">
                        {rows.map((row, index) => (
                            <div key={row.key} className="grid grid-cols-12 gap-x-4 gap-y-2 items-center p-3 rounded-md border">
                                <div className="col-span-12 sm:col-span-4">
                                    <label className="text-sm font-medium text-gray-700">Danışan Adı</label>
                                    <input type="text" value={row.patientName} onChange={e => handleRowChange(index, 'patientName', e.target.value)}
                                        className={`mt-1 w-full input ${errors[index]?.patientName ? 'border-red-500' : 'border-gray-300'}`} />
                                </div>
                                <div className="col-span-12 sm:col-span-3">
                                    <label className="text-sm font-medium text-gray-700">Tarih & Saat</label>
                                    <input type="datetime-local" value={row.sessionDate} onChange={e => handleRowChange(index, 'sessionDate', e.target.value)}
                                        className={`mt-1 w-full input ${errors[index]?.sessionDate ? 'border-red-500' : 'border-gray-300'}`} />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Ücret (₺)</label>
                                    <input type="number" value={row.sessionFee} onChange={e => handleRowChange(index, 'sessionFee', e.target.value)}
                                        className={`mt-1 w-full input ${errors[index]?.sessionFee ? 'border-red-500' : 'border-gray-300'}`} min="0" />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Durum</label>
                                    <select value={row.paymentStatus} onChange={e => handleRowChange(index, 'paymentStatus', e.target.value)}
                                        className="mt-1 w-full input border-gray-300">
                                        {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{PaymentStatusTR[s]}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-12 sm:col-span-1 flex items-end justify-end">
                                    <button onClick={() => removeRow(index)} disabled={rows.length <= 1}
                                        className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed p-2">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                     <button onClick={addRow} className="mt-4 inline-flex items-center px-3 py-2 border border-dashed border-gray-400 text-sm font-medium rounded-md text-gray-700 bg-transparent hover:bg-gray-50">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Yeni Satır Ekle
                    </button>
                </div>
                <div className="flex justify-end pt-4 mt-auto border-t space-x-2">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        İptal
                    </button>
                    <button type="button" onClick={handleSubmit}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700">
                        Tümünü Kaydet
                    </button>
                </div>
                 <style>{`
                    .input {
                        display: block;
                        width: 100%;
                        padding: 0.5rem 0.75rem;
                        font-size: 0.875rem;
                        line-height: 1.25rem;
                        border-width: 1px;
                        border-radius: 0.375rem;
                        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    }
                    .input:focus {
                        outline: 2px solid transparent;
                        outline-offset: 2px;
                        --tw-ring-color: #14b8a6;
                        border-color: #14b8a6;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default BulkSessionForm;
