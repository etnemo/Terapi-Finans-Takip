import React, { useState } from 'react';
import { PlusIcon, DownloadIcon, UploadIcon, CloseIcon } from './icons';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'json' | 'csv', dateRange: { start: string; end: string }) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  if (!isOpen) return null;

  const handleExportClick = () => {
    onExport(format, dateRange);
    onClose();
  };
  
  const handleClearDates = () => {
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 m-4 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Verileri Dışarı Aktar</h2>
        
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dosya Formatı</label>
                <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input type="radio" name="format" value="json" checked={format === 'json'} onChange={() => setFormat('json')} className="focus:ring-primary h-4 w-4 text-primary border-gray-300" />
                        <span className="ml-2 text-gray-700">JSON</span>
                    </label>
                    <label className="flex items-center">
                        <input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} className="focus:ring-primary h-4 w-4 text-primary border-gray-300" />
                        <span className="ml-2 text-gray-700">CSV</span>
                    </label>
                </div>
            </div>

            <div>
                 <label className="block text-sm font-medium text-gray-700">Tarih Aralığı (İsteğe Bağlı)</label>
                 <p className="text-xs text-gray-500 mb-2">Sadece belirtilen tarih aralığındaki seansları aktar. Boş bırakırsanız tümü aktarılır.</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start-date-export" className="block text-xs font-medium text-gray-600">Başlangıç Tarihi</label>
                        <input type="date" id="start-date-export" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} 
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date-export" className="block text-xs font-medium text-gray-600">Bitiş Tarihi</label>
                        <input type="date" id="end-date-export" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} 
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                 </div>
                 <div className="mt-2 text-right">
                    <button onClick={handleClearDates} className="text-sm text-primary hover:underline">Tarihleri Temizle</button>
                 </div>
            </div>
        </div>

        <div className="flex justify-end pt-6 space-x-2 mt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleExportClick}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Dışarı Aktar
          </button>
        </div>
      </div>
    </div>
  );
};

interface HeaderProps {
  onAddSession: () => void;
  onBulkAdd: () => void;
  onExport: (format: 'json' | 'csv', dateRange: { start: string; end: string }) => void;
  onImport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddSession, onBulkAdd, onExport, onImport }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  return (
    <>
      <header className="bg-white shadow-sm mb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-primary">
            TheraMoney
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={onImport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label="Import data"
            >
              <UploadIcon className="w-5 h-5 mr-2 -ml-1" />
              İçeri Aktar
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label="Export data"
            >
              <DownloadIcon className="w-5 h-5 mr-2 -ml-1" />
              Dışarı Aktar
            </button>
            <button
              onClick={onBulkAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
              Toplu Seans Ekle
            </button>
            <button
              onClick={onAddSession}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
              Yeni Seans Ekle
            </button>
          </div>
        </div>
      </header>
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={onExport}
      />
    </>
  );
};

export default Header;