import React, { useState, useRef, useMemo } from 'react';
import { Session, PaymentStatus } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import SessionList from './components/SessionList';
import SessionForm from './components/SessionForm';
import MonthlySummary from './components/MonthlySummary';
import ConfirmationModal from './components/ConfirmationModal';
import Toast from './components/Toast';
import Analytics from './components/Analytics';
import PaymentsOverview from './components/PaymentsOverview';
import BulkSessionForm, { BulkSessionData } from './components/BulkSessionForm';

const App: React.FC = () => {
  const [sessions, setSessions] = useLocalStorage<Session[]>('sessions', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for new features
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');


  const handleAddSessionClick = () => {
    setSessionToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleEditSession = (session: Session) => {
    setSessionToEdit(session);
    setIsModalOpen(true);
  };
  
  const handleDeleteRequest = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setIsDeleteModalOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (sessionToDelete) {
        setSessions(sessions.filter(s => s.id !== sessionToDelete));
        setSessionToDelete(null);
    }
    setIsDeleteModalOpen(false);
  };

  const handleSaveSession = (session: Session) => {
    const index = sessions.findIndex(s => s.id === session.id);
    const isNew = index === -1;
    const oldSession = isNew ? null : sessions[index];
    
    let sessionWithPaymentDate = { ...session };

    // Set payment date if status is now 'Paid' and wasn't before, or if it's a new 'Paid' session
    if (session.paymentStatus === PaymentStatus.PAID && (!oldSession || oldSession.paymentStatus !== PaymentStatus.PAID)) {
      sessionWithPaymentDate.paymentDate = new Date().toISOString();
    } else if (session.paymentStatus !== PaymentStatus.PAID) {
      sessionWithPaymentDate.paymentDate = undefined;
    }

    if (!isNew) {
      const updatedSessions = [...sessions];
      updatedSessions[index] = sessionWithPaymentDate;
      setSessions(updatedSessions);
      setToastMessage('Seans başarıyla güncellendi!');
    } else {
      setSessions([...sessions, sessionWithPaymentDate]);
      setToastMessage('Seans başarıyla kaydedildi!');
    }
  };
  
  const handleBulkAddClick = () => {
    setIsBulkModalOpen(true);
  };

  const handleSaveBulkSessions = (newSessions: BulkSessionData[]) => {
    const sessionsToSave = newSessions.map(s => {
        const sessionDate = new Date(s.sessionDate);
        const paymentDueDate = new Date(sessionDate);
        paymentDueDate.setDate(paymentDueDate.getDate() + 7);

        return {
            id: crypto.randomUUID(),
            patientName: s.patientName,
            sessionDate: sessionDate.toISOString(),
            sessionFee: s.sessionFee,
            commission: (s.sessionFee / 1.1) / 2,
            paymentStatus: s.paymentStatus,
            paymentDueDate: paymentDueDate.toISOString(),
            paymentDate: s.paymentStatus === PaymentStatus.PAID ? new Date().toISOString() : undefined,
        } as Session;
    });

    setSessions(current => [...current, ...sessionsToSave]);
    setToastMessage(`${sessionsToSave.length} seans başarıyla eklendi!`);
  };

  const handleUpdateSession = (sessionId: string, updatedData: Partial<Session>) => {
    setSessions(currentSessions =>
      currentSessions.map(s => {
        if (s.id === sessionId) {
          const originalSession = { ...s };
          const updatedSession = { ...s, ...updatedData };
          
          // If payment status is changed to 'Paid'
          if (updatedData.paymentStatus === PaymentStatus.PAID && originalSession.paymentStatus !== PaymentStatus.PAID) {
            updatedSession.paymentDate = new Date().toISOString();
          } else if (updatedData.paymentStatus && updatedData.paymentStatus !== PaymentStatus.PAID) {
            updatedSession.paymentDate = undefined;
          }

          return updatedSession;
        }
        return s;
      })
    );
     setToastMessage('Seans durumu güncellendi!');
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

  const filteredAndSortedSessions = useMemo(() => {
    const endDateObj = dateFilter.end ? new Date(dateFilter.end) : null;
    if (endDateObj) {
      endDateObj.setUTCHours(23, 59, 59, 999);
    }
    const startDateObj = dateFilter.start ? new Date(dateFilter.start) : null;
    
    return sessions.filter(session => {
        const nameMatch = session.patientName.toLowerCase().includes(searchQuery.toLowerCase());
        const statusMatch = statusFilter === 'all' || session.paymentStatus === statusFilter;

        const sessionDate = new Date(session.sessionDate);

        const dateMatch = (!startDateObj || sessionDate >= startDateObj) && (!endDateObj || sessionDate <= endDateObj);

        return nameMatch && statusMatch && dateMatch;
    }).sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }, [sessions, searchQuery, statusFilter, dateFilter]);

  const isFiltering = searchQuery !== '' || statusFilter !== 'all' || dateFilter.start !== '' || dateFilter.end !== '';

  return (
    <>
      <Header onAddSession={handleAddSessionClick} onBulkAdd={handleBulkAddClick} onExport={handleExport} onImport={handleImportClick} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <MonthlySummary sessions={sessions} />
        <Analytics sessions={sessions} />
        <PaymentsOverview sessions={sessions} onEdit={handleEditSession} />
        <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Tüm Seanslar</h2>
        <SessionList 
          sessions={filteredAndSortedSessions} 
          onEdit={handleEditSession} 
          onDelete={handleDeleteRequest} 
          onUpdate={handleUpdateSession}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          isFiltering={isFiltering}
        />
      </main>
      <SessionForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSession}
        sessionToEdit={sessionToEdit}
      />
      <BulkSessionForm
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSave={handleSaveBulkSessions}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Seansı Sil"
        message="Bu seansı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
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