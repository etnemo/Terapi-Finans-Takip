
import React, { useEffect } from 'react';
import { CheckCircleIcon } from './icons';

interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-dismiss after 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div 
        className="fixed bottom-5 right-5 bg-primary text-white py-3 px-5 rounded-lg shadow-lg flex items-center z-50"
        role="alert"
        aria-live="assertive"
    >
      <CheckCircleIcon className="w-6 h-6 mr-3" />
      <span>{message}</span>
    </div>
  );
};

export default Toast;
