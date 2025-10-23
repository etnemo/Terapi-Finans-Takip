import React from 'react';
import { PlusIcon, DownloadIcon, UploadIcon } from './icons';

interface HeaderProps {
  onAddSession: () => void;
  onExport: () => void;
  onImport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddSession, onExport, onImport }) => {
  return (
    <header className="bg-white shadow-sm mb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-primary">
          Terapi Günlüğü
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
            onClick={onExport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            aria-label="Export data"
          >
            <DownloadIcon className="w-5 h-5 mr-2 -ml-1" />
            Dışarı Aktar
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
  );
};

export default Header;