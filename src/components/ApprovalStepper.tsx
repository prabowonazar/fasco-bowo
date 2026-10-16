import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Paperclip, 
  Upload, 
  MessageSquare, 
  Lock, 
  CheckCircle2, 
  XCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApproverId, Submission, UserRoleId, Attachment } from '../types';
import { APPROVERS } from '../utils/calculations';
import { fmtDateTime, fmtBytes, triggerHaptic } from '../utils/formatters';

interface ApprovalStepperProps {
  submission: Submission;
  currentRole: UserRoleId | null;
  onDecide: (approverId: ApproverId, decision: 'approved' | 'rejected', note: string) => Promise<void>;
  onSaveNote: (approverId: ApproverId, note: string) => Promise<void>;
  onUploadAttachment: (approverId: ApproverId, attachment: Attachment) => Promise<void>;
}

export const ApprovalStepper: React.FC<ApprovalStepperProps> = ({
  submission,
  currentRole,
  onDecide,
  onSaveNote,
  onUploadAttachment,
}) => {
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    APPROVERS.forEach((a) => {
      map[a.id] = submission.approvals?.[a.id]?.note || '';
    });
    return map;
  });

  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const approvals = submission.approvals || {};
  const approvedCount = APPROVERS.filter((a) => approvals[a.id]?.status === 'approved').length;

  const handleNoteChange = (id: string, text: string) => {
    setNotes((prev) => ({ ...prev, [id]: text }));
  };

  const handleDecision = async (approverId: ApproverId, decision: 'approved' | 'rejected') => {
    triggerHaptic(25);
    setIsSubmitting(approverId + '-' + decision);
    try {
      await onDecide(approverId, decision, notes[approverId] || '');
      if (decision === 'approved') {
        // Check if this was the last approval
        const othersApproved = APPROVERS.filter((a) => a.id !== approverId).every(
          (a) => approvals[a.id]?.status === 'approved'
        );
        if (othersApproved) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleSaveNoteAction = async (approverId: ApproverId) => {
    triggerHaptic(12);
    setIsSubmitting(approverId + '-note');
    try {
      await onSaveNote(approverId, notes[approverId] || '');
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleFileUpload = async (approverId: ApproverId, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 500 * 1024) {
      alert(`File ${file.name} melebihi batas 500 KB.`);
      return;
    }

    setUploadStatus(`Mengunggah ${file.name}...`);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const att: Attachment = {
        id: Date.now().toString(36),
        name: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        dataUrl,
      };
      await onUploadAttachment(approverId, att);
      setUploadStatus('Lampiran berhasil disimpan.');
      setTimeout(() => setUploadStatus(''), 2000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
      {/* Header with Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Progres Persetujuan Bertingkat
          </h3>
          <span className="text-xs font-bold font-mono text-[#20295f] dark:text-sky-400">
            {approvedCount} dari {APPROVERS.length} Disetujui
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${(approvedCount / APPROVERS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Stepper Rows */}
      <div className="space-y-3">
        {APPROVERS.map((approver, index) => {
          const ap = approvals[approver.id] || { status: 'pending' };
          const isCurrentReviewer = currentRole === approver.id;

          // Check sequential prerequisite
          const prevApprover = index > 0 ? APPROVERS[index - 1] : null;
          const prevStatus = prevApprover ? approvals[prevApprover.id]?.status || 'pending' : 'approved';
          const canAct = isCurrentReviewer && ap.status === 'pending' && prevStatus === 'approved';
          const isWaitingPrev = ap.status === 'pending' && prevStatus !== 'approved';

          // Status Badge / Light
          const statusConfig = {
            approved: {
              label: 'Disetujui',
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
              bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700',
            },
            rejected: {
              label: 'Ditolak',
              icon: <XCircle className="w-4 h-4 text-rose-500" />,
              bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700',
            },
            pending: {
              label: 'Menunggu',
              icon: <Clock className="w-4 h-4 text-amber-500 animate-pulse" />,
              bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-700',
            },
          };

          const st = statusConfig[ap.status];

          return (
            <div
              key={approver.id}
              className={`p-3.5 rounded-xl border transition ${
                canAct
                  ? 'border-sky-400 dark:border-sky-500 bg-sky-50/20 dark:bg-sky-950/10 ring-2 ring-sky-300/30'
                  : ap.status === 'approved'
                  ? 'border-emerald-200 dark:border-emerald-900/40 bg-slate-50/50 dark:bg-slate-800/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Row Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {approver.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {approver.role} {isCurrentReviewer && <span className="text-sky-600 dark:text-sky-400 font-bold">(Anda)</span>}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.bg}`}>
                  {st.icon}
                  <span>{st.label}</span>
                </div>
              </div>

              {/* Waiting Notice */}
              {isWaitingPrev && isCurrentReviewer && (
                <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2 rounded-lg border border-amber-200 dark:border-amber-900/50 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {prevStatus === 'rejected'
                      ? `Pengajuan ditolak oleh ${prevApprover?.name}`
                      : `Menunggu persetujuan ${prevApprover?.name} terlebih dahulu`}
                  </span>
                </div>
              )}

              {/* Existing Note or Date */}
              {ap.status !== 'pending' && (
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  {ap.note && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg italic text-[11px] mb-1">
                      "{ap.note}"
                    </div>
                  )}
                  {ap.at && (
                    <div className="text-[10px] text-slate-400">
                      Diputuskan pada: {fmtDateTime(ap.at)}
                    </div>
                  )}
                </div>
              )}

              {/* Approver Attachments List */}
              {ap.attachments && ap.attachments.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Lampiran Dokumen:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ap.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200"
                      >
                        <FileText className="w-3 h-3 text-sky-500" />
                        <span className="max-w-[120px] truncate">{att.name}</span>
                        <span className="text-slate-400">({fmtBytes(att.sizeBytes)})</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Controls for Current Reviewer */}
              {isCurrentReviewer && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={notes[approver.id] || ''}
                      onChange={(e) => handleNoteChange(approver.id, e.target.value)}
                      placeholder="Tulis catatan persetujuan / arahan..."
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveNoteAction(approver.id)}
                      disabled={isSubmitting !== null}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold whitespace-nowrap active:scale-95"
                    >
                      Simpan
                    </button>
                  </div>

                  {/* Decision Buttons (Approve / Reject) */}
                  {canAct && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDecision(approver.id, 'approved')}
                        disabled={isSubmitting !== null}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui Pengajuan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecision(approver.id, 'rejected')}
                        disabled={isSubmitting !== null}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}

                  {/* Upload supporting document for approval */}
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <label className="cursor-pointer inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-400">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Lampirkan file persetujuan</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/*,.csv,.xlsx,.docx"
                        onChange={(e) => handleFileUpload(approver.id, e)}
                      />
                    </label>
                    {uploadStatus && <span className="text-sky-600 font-medium">{uploadStatus}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
