import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  loading?: boolean;
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  requireInput?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  showInput = false,
  inputLabel = 'Reason / Note',
  inputPlaceholder = 'Enter reason...',
  requireInput = false,
}) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNote('');
    }
  }, [isOpen]);

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-primary-600" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger': return 'bg-red-50';
      case 'warning': return 'bg-amber-50';
      case 'success': return 'bg-emerald-50';
      default: return 'bg-primary-50';
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white';
      default:
        return 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white';
    }
  };

  const isConfirmDisabled = loading || (showInput && requireInput && !note.trim());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note)}
            disabled={isConfirmDisabled}
            className={`px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonClasses()}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div className="space-y-1 pt-0.5">
            <h4 className="text-base font-bold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
          </div>
        </div>

        {showInput && (
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {inputLabel} {requireInput && <span className="text-red-500">*</span>}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

