import React from 'react';
import { Search, Download, Building2, Bell, BellOff, BellRing } from 'lucide-react';
import { UserRoleId } from '../types';
import { getUserRoleLabel } from '../services/firebase';
import { BRANCHES } from '../utils/calculations';
import { triggerHaptic } from '../utils/formatters';

interface MobileHeaderProps {
  currentRole: UserRoleId | null;
  currentUserEmail: string | null;
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showSearch: boolean;
  onToggleSearch: () => void;
  onOpenInstallModal: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  notificationPermission: NotificationPermission;
  onToggleNotification: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentRole,
  currentUserEmail,
  selectedBranch,
  onSelectBranch,
  searchQuery,
  onSearchChange,
  showSearch,
  onToggleSearch,
  onOpenInstallModal,
  isInstallable,
  isInstalled,
  notificationPermission,
  onToggleNotification,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#20295f] text-white shadow-md select-none border-b border-[#2d3980]">
      {/* Top Bar with Brand & Actions */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden">
            <img src="/fasco-logo.png" alt="Fasco Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 leading-none">
              <span>FASCO SANWIRA</span>
              <span className="text-[10px] font-semibold bg-sky-500/30 text-sky-200 px-1.5 py-0.5 rounded-full border border-sky-400/30">
                MOBILE
              </span>
            </h1>
            <p className="text-[11px] text-sky-200/80 truncate mt-0.5">
              {currentRole ? getUserRoleLabel(currentRole) : (currentUserEmail || 'Pengajuan Stok')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Notification Permission Bell */}
          <button
            type="button"
            onClick={() => { triggerHaptic(); onToggleNotification(); }}
            className={`p-2 rounded-lg transition active:scale-95 relative ${
              notificationPermission === 'granted'
                ? 'text-sky-200 hover:bg-white/10'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title={
              notificationPermission === 'granted'
                ? 'Notifikasi Service Worker Aktif'
                : 'Klik untuk mengaktifkan notifikasi pembaruan status'
            }
          >
            {notificationPermission === 'granted' ? (
              <>
                <BellRing className="w-4 h-4 text-emerald-300" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#20295f]" />
              </>
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </button>

          {!isInstalled && isInstallable && (
            <button
              onClick={() => { triggerHaptic(); onOpenInstallModal(); }}
              className="flex items-center gap-1 text-[11px] font-semibold bg-sky-500 hover:bg-sky-400 text-white px-2.5 py-1.5 rounded-lg shadow-xs transition active:scale-95"
              title="Pasang Aplikasi"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Instal</span>
            </button>
          )}

          <button
            onClick={() => { triggerHaptic(); onToggleSearch(); }}
            className={`p-2 rounded-lg text-sky-100 hover:bg-white/10 transition active:scale-95 ${showSearch ? 'bg-white/15 text-white' : ''}`}
            aria-label="Cari"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Branch selector & Search box */}
      <div className="px-3 pb-2.5 pt-0 flex flex-col gap-2">
        {showSearch && (
          <div className="relative animate-slide-down">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nomor pengajuan, nama barang, atau pemasok..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-900 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner"
              autoFocus
            />
          </div>
        )}

        {/* Branch horizontal scroll selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <Building2 className="w-3.5 h-3.5 text-sky-300 flex-shrink-0 ml-1" />
          {BRANCHES.map((b) => {
            const isSelected = selectedBranch === b;
            return (
              <button
                key={b}
                onClick={() => { triggerHaptic(8); onSelectBranch(b); }}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition active:scale-95 ${
                  isSelected
                    ? 'bg-sky-400 text-[#18204b] font-bold shadow-xs'
                    : 'bg-white/10 text-sky-100 hover:bg-white/15'
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
