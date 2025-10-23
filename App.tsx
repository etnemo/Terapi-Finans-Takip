import React, { useState, useRef } from 'react';
import { Session, PaymentStatus } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import SessionList from './components/SessionList';
import SessionForm from './components/SessionForm';
import MonthlySummary from './components/MonthlySummary';

const App: React.FC = () => {
  const [sessions, setSessions] = useLocalStorage<Session[]>('sessions', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSessionClick = () => {
    setSessionToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleEditSession = (session: Session) => {
    setSessionToEdit(session);
    setIsModalOpen(true);
  };

  const handleDeleteSession = (sessionId: string) => {
    if(window.confirm('Bu seansı silmek istediğinizden emin misiniz?')) {
        setSessions(sessions.filter(s => s.id !== sessionId));
    }
  };

  const handleSaveSession = (session: Session) => {
    const index = sessions.findIndex(s => s.id === session.id);
    if (index > -1) {
      const updatedSessions = [...sessions];
      updatedSessions[index] = session;
      setSessions(updatedSessions);
    } else {
      setSessions([...sessions, session]);
    }
  };

  const handleUpdateSession = (sessionId: string, updatedData: Partial<Session>) => {
    setSessions(currentSessions =>
      currentSessions.map(s => (s.id === sessionId ? { ...s, ...updatedData } : s))
    );
  };

  const handleExport = () => {
    if (sessions.length === 0) {
      alert("Dışa aktarılacak veri bulunmamaktadır.");
      return;
    }
    const dataStr = JSON.stringify(sessions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const exportFileDefaultName = `terapigunlugu_yedek_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.download = exportFileDefaultName;
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };
  
  const isValidSession = (obj: any): obj is Session => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'id' in obj && typeof obj.id === 'string' &&
        'patientName' in obj && typeof obj.patientName === 'string' &&
        'sessionDate' in obj && typeof obj.sessionDate === 'string' && !isNaN(new Date(obj.sessionDate).getTime()) &&
        'sessionFee' in obj && typeof obj.sessionFee === 'number' &&
        'commission' in obj && typeof obj.commission === 'number' &&
        'paymentStatus' in obj && Object.values(PaymentStatus).includes(obj.paymentStatus)
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') {
                  throw new Error('File content is not readable text.');
              }
              const importedSessions = JSON.parse(text);

              if (!Array.isArray(importedSessions) || (importedSessions.length > 0 && !importedSessions.every(isValidSession))) {
                  alert('Geçersiz dosya formatı. Lütfen geçerli bir seans JSON dosyası içe aktarın.');
                  return;
              }
              
              const confirmMessage = `${importedSessions.length} seans içeren dosyayı içe aktarmak istediğinize emin misiniz? Bu işlem mevcut ${sessions.length} seansın üzerine yazılacaktır.`;

              if (window.confirm(confirmMessage)) {
                  setSessions(importedSessions);
                  alert('Veriler başarıyla içe aktarıldı!');
              }
          } catch (error) {
              console.error("Error parsing imported file:", error);
              alert('Veriler içe aktarılamadı. Dosya bozuk veya yanlış formatta olabilir.');
          } finally {
              if (fileInputRef.current) {
                  fileInputRef.current.value = '';
              }
          }
      };
      reader.readAsText(file);
  };


  return (
    <>
      <Header onAddSession={handleAddSessionClick} onExport={handleExport} onImport={handleImportClick} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <MonthlySummary sessions={sessions} />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tüm Seanslar</h2>
        <SessionList sessions={sessions} onEdit={handleEditSession} onDelete={handleDeleteSession} onUpdate={handleUpdateSession} />
      </main>
      <SessionForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSession}
        sessionToEdit={sessionToEdit}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="application/json"
      />
    </>
  );
};

export default App;