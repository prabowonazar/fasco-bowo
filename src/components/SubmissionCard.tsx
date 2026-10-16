import React from 'react';
import { AlertTriangle, ChevronRight, Paperclip, Package, Boxes, Calendar } from 'lucide-react';
import { Submission } from '../types';
import { APPROVERS, computeSubmissionStatus, getShortage, getTotalCarton } from '../utils/calculations';
import { fmtDate, triggerHaptic } from '../utils/formatters';

interface SubmissionCardProps {
  submission: Submission;
  onClick: () => void;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, onClick }) => {
  const status = computeSubmissionStatus(submission);
  const items = submission.items || [];
  const hasShortage = items.some((it) => getShortage(it) < 0);
  const totalCartons = items.reduce((sum, it) => sum + (getTotalCarton(it) || 0), 0);

  const statusMap = {
    approved: {
      label: 'Disetujui',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500 shadow-emerald-500/50',
    },
    rejected: {
      label: 'Ditolak',
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500 shadow-rose-500/50',
    },
    pending: {
      label: 'Menunggu',
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500 shadow-amber-500/50 animate-pulse',
    },
  };

  const st = statusMap[status];

  return (
    <div
      onClick={() => { triggerHaptic(12); onClick(); }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-md transition active:scale-[0.99] cursor-pointer relative overflow-hidden"
    >
      {/* Shortage indicator top strip */}
      {hasShortage && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
      )}

      {/* Header: Branch & Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {submission.cabang || 'Semua Cabang'}
            </h3>
            {hasShortage && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full border border-amber-300/70">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>Stok Kritis</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>{fmtDate(submission.createdAt)}</span>
            <span>&bull;</span>
            <span className="truncate">{submission.createdBy?.split('@')[0]}</span>
          </p>
        </div>

        <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${st.bg} flex-shrink-0 shadow-xs`}>
          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
          <span>{st.label}</span>
        </div>
      </div>

      {/* Note preview if any */}
      {submission.catatan && (
        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-2 mb-3 italic">
          "{submission.catatan}"
        </p>
      )}

      {/* Key Metric Pills */}
      <div className="grid grid-cols-2 gap-2 my-2.5">
        <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium leading-none">Total Item</div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
              {items.length} Barang
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium leading-none">Total Karton</div>
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 mt-1">
              {totalCartons.toFixed(0)} Ctn
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Approver Light Indicators & Chevron */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400">Review:</span>
          <div className="flex items-center gap-1.5">
            {APPROVERS.map((a) => {
              const apState = submission.approvals?.[a.id]?.status || 'pending';
              const dotColor =
                apState === 'approved'
                  ? 'bg-emerald-500 ring-emerald-200'
                  : apState === 'rejected'
                  ? 'bg-rose-500 ring-rose-200'
                  : 'bg-amber-400 ring-amber-100';
              return (
                <div
                  key={a.id}
                  className={`w-3 h-3 rounded-full ${dotColor} ring-2 dark:ring-slate-800`}
                  title={`${a.name}: ${apState}`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#20295f] dark:text-sky-400 font-semibold">
          {submission.attachments && submission.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 mr-1">
              <Paperclip className="w-3 h-3" />
              <span>{submission.attachments.length}</span>
            </span>
          )}
          <span>Lihat</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
