import React from 'react';
import { LayoutGrid, ClipboardCheck, PlusCircle, User } from 'lucide-react';
import { triggerHaptic } from '../utils/formatters';

export type TabKey = 'beranda' | 'persetujuan' | 'buat' | 'profil';

interface BottomNavBarProps {
  currentTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  pendingApprovalsCount: number;
  canCreate: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onTabChange,
  pendingApprovalsCount,
  canCreate,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto px-2 py-1 flex items-center justify-around select-none">
        {/* Tab 1: Beranda */}
        <button
          onClick={() => { triggerHaptic(10); onTabChange('beranda'); }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition active:scale-95 ${
            currentTab === 'beranda'
              ? 'text-[#20295f] dark:text-sky-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <div className="relative">
            <LayoutGrid className="w-5 h-5" />
            {currentTab === 'beranda' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#20295f] dark:bg-sky-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1">Beranda</span>
        </button>

        {/* Tab 2: Persetujuan */}
        <button
          onClick={() => { triggerHaptic(10); onTabChange('persetujuan'); }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition active:scale-95 relative ${
            currentTab === 'persetujuan'
              ? 'text-[#20295f] dark:text-sky-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <div className="relative">
            <ClipboardCheck className="w-5 h-5" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
            {currentTab === 'persetujuan' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#20295f] dark:bg-sky-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1">Review</span>
        </button>

        {/* Tab 3: Buat Baru (Pengajuan) */}
        {canCreate ? (
          <button
            onClick={() => { triggerHaptic(15); onTabChange('buat'); }}
            className="flex flex-col items-center justify-center -mt-4 px-2 active:scale-95 transition"
            aria-label="Buat Pengajuan Baru"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#20295f] to-[#2d93e8] text-white flex items-center justify-center shadow-lg shadow-blue-900/30 ring-4 ring-white dark:ring-slate-900">
              <PlusCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold text-slate-700 dark:text-slate-200">
              Pengajuan
            </span>
          </button>
        ) : null}

        {/* Tab 4: Profil */}
        <button
          onClick={() => { triggerHaptic(10); onTabChange('profil'); }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition active:scale-95 ${
            currentTab === 'profil'
              ? 'text-[#20295f] dark:text-sky-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <div className="relative">
            <User className="w-5 h-5" />
            {currentTab === 'profil' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#20295f] dark:bg-sky-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1">Akun</span>
        </button>
      </div>
    </nav>
  );
};
