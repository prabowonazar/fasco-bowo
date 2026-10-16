import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import { Submission } from '../types';
import { APPROVERS, COLUMNS, getComputedValue } from '../utils/calculations';
import { fmtDate, fmtBytes, fmtNumber, triggerHaptic } from '../utils/formatters';

interface PrintDocumentProps {
  submission: Submission;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintDocument: React.FC<PrintDocumentProps> = ({
  submission,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    triggerHaptic(15);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs p-2 sm:p-6 flex items-center justify-center animate-fade-in">
      <div className="bg-white text-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-300 print:border-none print:shadow-none print:rounded-none flex flex-col max-h-[96vh]">
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-3 bg-[#20295f] text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-xs sm:text-sm">
              Dokumen Cetak Pengajuan Stok - {submission.cabang}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={() => { triggerHaptic(); onClose(); }}
              className="p-1.5 text-white/80 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#20295f] pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#20295f] tracking-tight">
                PT FASCO SANWIRA
              </h1>
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                <p><strong>FORMULIR PENGAJUAN STOK</strong></p>
                <p>Cabang: <span className="font-semibold text-slate-900">{submission.cabang}</span></p>
                <p>Diajukan: {fmtDate(submission.createdAt)} &bull; Oleh: {submission.createdBy}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-xs uppercase tracking-wider">
                DISETUJUI RESMI
              </span>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                ID: {submission.id}
              </p>
            </div>
          </div>

          {/* Notes */}
          {submission.catatan && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <strong className="text-slate-800">Catatan Pengaju:</strong> {submission.catatan}
            </div>
          )}

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px] whitespace-nowrap border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="p-1.5 border-r border-slate-300 text-center">No</th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={`p-1.5 border-r border-slate-300 ${
                        col.type === 'number' || col.type === 'computed' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {submission.items?.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="p-1.5 border-r border-slate-300 text-center font-bold">{idx + 1}</td>
                    {COLUMNS.map((col) => {
                      const isNum = col.type === 'number' || col.type === 'computed';
                      const val = col.type === 'computed' ? getComputedValue(col.key, it) : it[col.key];
                      return (
                        <td
                          key={col.key}
                          className={`p-1.5 border-r border-slate-300 ${isNum ? 'text-right' : 'text-left font-sans'}`}
                        >
                          {isNum ? fmtNumber(val) : (val || '—')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Approvals Table */}
          <div className="pt-2">
            <h3 className="font-bold text-xs text-slate-800 mb-2 uppercase tracking-wide">
              Catatan Persetujuan
            </h3>
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300">Pejabat Pengesah</th>
                  <th className="p-2 border-r border-slate-300">Peran</th>
                  <th className="p-2 border-r border-slate-300">Status</th>
                  <th className="p-2 border-r border-slate-300">Catatan / Arahan</th>
                  <th className="p-2">Tanggal Pengesahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {APPROVERS.map((a) => {
                  const ap = submission.approvals?.[a.id] || { status: 'pending' };
                  return (
                    <tr key={a.id}>
                      <td className="p-2 border-r border-slate-300 font-bold">{a.name}</td>
                      <td className="p-2 border-r border-slate-300 text-slate-500">{a.role}</td>
                      <td className="p-2 border-r border-slate-300 font-semibold text-emerald-700">
                        {ap.status === 'approved' ? 'DISETUJUI' : ap.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU'}
                      </td>
                      <td className="p-2 border-r border-slate-300 italic">{ap.note || '—'}</td>
                      <td className="p-2">{fmtDate(ap.at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signatures 4-box layout */}
          <div className="grid grid-cols-4 gap-4 pt-4">
            {APPROVERS.map((a) => (
              <div key={a.id} className="border border-slate-300 p-2 text-center rounded">
                <div className="text-[10px] text-slate-500">{a.role}</div>
                <div className="h-14 border-b border-slate-300 border-dashed flex items-center justify-center font-serif italic text-emerald-800 text-xs">
                  Digitally Approved
                </div>
                <div className="font-bold text-xs mt-1">{a.name}</div>
              </div>
            ))}
          </div>

          <div className="text-right text-[10px] text-slate-400 pt-3">
            Dokumen ini dihasilkan secara otomatis melalui Sistem Mobile Pengajuan Stok Fasco Sanwira.
          </div>
        </div>
      </div>
    </div>
  );
};
