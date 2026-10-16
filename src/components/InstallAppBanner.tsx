import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHaptic } from '../utils/formatters';

interface InstallAppBannerProps {
  onOpenModal: () => void;
}

export const InstallAppBanner: React.FC<InstallAppBannerProps> = ({ onOpenModal }) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  // If already running standalone on phone or dismissed, hide banner
  if (isInstalled || isDismissed) return null;

  const handleInstallNow = async () => {
    triggerHaptic(15);
    if (isInstallable) {
      await install();
    } else {
      onOpenModal();
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#20295f] to-[#2d93e8] text-white p-3.5 rounded-2xl shadow-lg border border-sky-300/30 flex items-center justify-between gap-3 animate-slide-down">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-white shadow-inner">
          <Smartphone className="w-5 h-5 text-sky-200" />
        </div>
        <div className="min-w-0">
          <h4 className="font-extrabold text-xs text-white leading-tight flex items-center gap-1.5">
            <span>Pasang di HP Anda</span>
            <span className="text-[9px] bg-emerald-400 text-slate-900 px-1.5 py-0.2 rounded-full font-bold">
              Praktis
            </span>
          </h4>
          <p className="text-[11px] text-sky-100/90 truncate mt-0.5">
            Bisa dibuka langsung dari Layar Utama HP tanpa browser bar
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={handleInstallNow}
          className="px-3 py-1.5 bg-white text-[#20295f] hover:bg-sky-50 rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang</span>
        </button>

        <button
          type="button"
          onClick={() => { triggerHaptic(8); setIsDismissed(true); }}
          className="p-1 text-white/70 hover:text-white rounded-lg"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
