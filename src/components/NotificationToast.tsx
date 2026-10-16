import React from 'react';
import { Bell, CheckCircle2, XCircle, X, ChevronRight } from 'lucide-react';
import { InAppToast } from '../services/notifications';
import { triggerHaptic } from '../utils/formatters';

interface NotificationToastProps {
  toast: InAppToast | null;
  onDismiss: () => void;
  onOpenSubmission?: (submissionId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toast,
  onDismiss,
  onOpenSubmission,
}) => {
  if (!toast) return null;

  const isApproved = toast.type === 'approved';
  const isRejected = toast.type === 'rejected';

  const handleClick = () => {
    triggerHaptic(12);
    if (toast.submissionId && onOpenSubmission) {
      onOpenSubmission(toast.submissionId);
    }
    onDismiss();
  };

  return (
    <div className="fixed top-3 left-3 right-3 z-50 max-w-md mx-auto animate-slide-down">
      <div 
        onClick={handleClick}
        className="bg-slate-900/95 dark:bg-slate-800/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-start justify-between gap-3 cursor-pointer active:scale-98 transition"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md ${
            isApproved 
              ? 'bg-emerald-500 text-white' 
              : isRejected 
              ? 'bg-rose-500 text-white' 
              : 'bg-sky-500 text-white'
          }`}>
            {isApproved ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isRejected ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                Pemberitahuan Status
              </span>
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-white leading-tight mt-0.5 truncate">
              {toast.title}
            </h4>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {toast.body}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic(8);
              onDismiss();
            }}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
