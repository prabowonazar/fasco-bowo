import React, { useState } from 'react';
import { 
  Download, 
  Share2, 
  PlusSquare, 
  X, 
  CheckCircle2, 
  Smartphone, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHaptic } from '../utils/formatters';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isIOS, isInstalled, install } = usePWAInstall();
  const [activeSubTab, setActiveSubTab] = useState<'direct' | 'apk'>('direct');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // The active app URL (dynamic from browser)
  const appUrl = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : 'https://ais-dev-6skb2dbgiczyaypwbbqeuz-539178739468.asia-southeast1.run.app';
  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(appUrl)}`;

  const handleInstallClick = async () => {
    triggerHaptic(20);
    const success = await install();
    if (success) {
      onClose();
    }
  };

  const handleCopyUrl = () => {
    triggerHaptic(12);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#20295f] p-1.5 flex items-center justify-center shadow-md">
              <img src="/fasco-logo.png" alt="Fasco Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                Instal Aplikasi Fasco
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tersedia opsi PWA Langsung & File .APK
              </p>
            </div>
          </div>
          <button
            onClick={() => { triggerHaptic(); onClose(); }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Direct Install vs APK Converter */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl my-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { triggerHaptic(8); setActiveSubTab('direct'); }}
            className={`flex-1 py-1.5 rounded-lg text-center transition ${
              activeSubTab === 'direct'
                ? 'bg-white dark:bg-slate-900 text-[#20295f] dark:text-sky-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Instal Langsung (1-Klik)
          </button>
          <button
            type="button"
            onClick={() => { triggerHaptic(8); setActiveSubTab('apk'); }}
            className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1 ${
              activeSubTab === 'apk'
                ? 'bg-white dark:bg-slate-900 text-[#20295f] dark:text-sky-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span>Unduh File .APK</span>
            <span className="text-[9px] bg-sky-500 text-white px-1.5 py-0.2 rounded-full font-bold">Baru</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-0.5 space-y-3">
          {activeSubTab === 'direct' ? (
            /* TAB 1: INSTAL LANGSUNG (PWA) */
            <>
              {isInstalled ? (
                <div className="py-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Aplikasi sudah terpasang di perangkat Anda!
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Buka langsung dari layar utama perangkat Anda untuk pengalaman terbaik.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Muncul sebagai aplikasi mandiri di Layar Utama HP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Layar penuh tanpa bilah URL / address bar peramban</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Otomatis ter-update tanpa perlu install ulang APK manual</span>
                    </div>
                  </div>

                  {isIOS ? (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Cara pasang di iPhone / iPad (Safari):
                      </p>
                      <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                          1
                        </div>
                        <div>
                          Tekan tombol <span className="font-semibold inline-flex items-center gap-1 mx-0.5 text-blue-600"><Share2 className="w-3.5 h-3.5 inline" /> Bagikan</span> di bilah bawah Safari.
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                          2
                        </div>
                        <div>
                          Pilih <span className="font-semibold inline-flex items-center gap-1 mx-0.5 text-slate-800 dark:text-slate-100"><PlusSquare className="w-3.5 h-3.5 inline" /> Tambah ke Layar Utama</span>.
                        </div>
                      </div>
                    </div>
                  ) : isInstallable ? (
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-3 px-4 bg-[#20295f] hover:bg-[#18204b] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20 active:scale-98 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Instal ke Layar Utama HP</span>
                    </button>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 text-center">
                      <Smartphone className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                      Buka menu peramban Chrome (titik tiga kanan atas) lalu pilih <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* TAB 2: CARA MENDAPATKAN FILE .APK */
            <div className="space-y-3 text-xs">
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span>Bisa langsung dibuatkan .APK resmi!</span>
                </div>
                <p className="text-[11px] text-blue-800/90 dark:text-blue-300 leading-relaxed">
                  Karena web ini sudah memenuhi 100% standar PWA Google, Anda dapat mengunduh file <strong>.APK Android</strong> dalam 1 menit via <strong>PWABuilder</strong> (Layanan open-source resmi Microsoft & Google).
                </p>
              </div>

              {/* Step-by-step box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 block">
                  3 Langkah Cepat Download .APK:
                </span>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#20295f] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Buka PWABuilder:</span>
                    <p className="text-[11px] text-slate-500">
                      Klik tombol biru di bawah. URL aplikasi Fasco sudah otomatis terisi.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#20295f] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Pilih "Package for Stores" &rarr; "Android":</span>
                    <p className="text-[11px] text-slate-500">
                      Pilih format APK untuk pengujian / distribusi internal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#20295f] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Unduh & Pasang .APK:</span>
                    <p className="text-[11px] text-slate-500">
                      Kirim file .apk ke HP staf / tim dan buka untuk menginstal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button: Open PWABuilder */}
              <a
                href={pwaBuilderUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-98 transition text-center"
              >
                <span>Buka PWABuilder untuk Unduh .APK</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Copy URL Button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Link URL Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Link URL Aplikasi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => { triggerHaptic(); onClose(); }}
          className="w-full mt-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-center"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
