import { AlertTriangle } from 'lucide-react';
import { Modal } from './modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
          }`}
        >
          <AlertTriangle
            className={`h-6 w-6 ${
              variant === 'danger' ? 'text-red-600' : 'text-yellow-600'
            }`}
          />
        </div>
        <p className="mt-4 text-sm text-gray-500">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
