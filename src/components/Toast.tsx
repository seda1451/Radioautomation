import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-[#1a1c23] border border-[#2c303e] text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center space-x-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <div className="text-xs font-semibold text-gray-200">{message}</div>
    </div>
  );
};
