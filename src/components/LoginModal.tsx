import React, { useState } from 'react';
import { LogIn, Key, Mail, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { auth, resolveUserRole } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { UserRoleId } from '../types';
import { APPROVERS } from '../utils/calculations';
import { triggerHaptic } from '../utils/formatters';

interface LoginModalProps {
  onQuickRoleSelect?: (role: UserRoleId, email: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onQuickRoleSelect }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(15);
    setIsLoading(true);
    setErrorMessage('');

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      // If Firebase Auth returns error, check if email matches registered role for simulation fallback
      const matchingAccount = demoAccounts.find(
        (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (matchingAccount && onQuickRoleSelect) {
        onQuickRoleSelect(matchingAccount.role, matchingAccount.email);
        return;
      }

      let msg = 'Login gagal. Periksa kembali email dan kata sandi Anda.';
      if (err.code === 'auth/user-not-found') msg = 'Akun pengguna tidak ditemukan.';
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')
        msg = 'Kata sandi atau email salah.';
      else if (err.code === 'auth/invalid-email') msg = 'Format email tidak valid.';
      else if (err.code === 'auth/too-many-requests')
        msg = 'Terlalu banyak percobaan. Silakan coba sesaat lagi.';
      else if (err.message) msg = err.message;

      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts: { role: UserRoleId; name: string; email: string; label: string }[] = [
    { role: 'prabowo', name: 'Nazar Prabowo', email: 'prabowonazar@gmail.com', label: 'Pengaju (Nazar)' },
    { role: 'ardian', name: 'Ardian', email: 'ardian@fascosanwira.com', label: 'Purchasing (Ardian)' },
    { role: 'gita', name: 'Gita Ismaya', email: 'gita@fascosanwira.com', label: 'Mengetahui (Gita)' },
    { role: 'fricella', name: 'Fricella Siehendra', email: 'fricella@fascosanwira.com', label: 'Menyetujui 1 (Fricella)' },
    { role: 'memorianti', name: 'Memorianti Kaban', email: 'memorianti@fascosanwira.com', label: 'Menyetujui 2 (Memorianti)' },
    { role: 'fricio', name: 'Fricio Sinkiani', email: 'fricio@fascosanwira.com', label: 'Menyetujui 3 (Fricio)' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#18204b] via-[#20295f] to-slate-900 flex flex-col justify-center items-center p-4 select-none safe-top safe-bottom">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
        {/* App Logo & Branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#20295f] p-2 mx-auto mb-3 shadow-lg flex items-center justify-center ring-4 ring-sky-100 dark:ring-slate-800">
            <img src="/fasco-logo.png" alt="Fasco Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            FASCO SANWIRA
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mobile App Pengajuan & Persetujuan Stok
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFirebaseLogin} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              Email Akun
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#20295f] hover:bg-[#18204b] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-950/20 active:scale-98 transition disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Memproses Masuk...' : 'Masuk Aplikasi'}</span>
          </button>
        </form>

        {/* Quick Demo Switcher Section (Hidden by default) */}
        {onQuickRoleSelect && showQuickAccess && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 animate-slide-up">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Akses Cepat Pengujian Peran (1-Tap):</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAccess(false)}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
              >
                Sembunyikan
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {demoAccounts.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    onQuickRoleSelect(d.role, d.email);
                  }}
                  className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition flex items-center justify-between group active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                        {d.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{d.label}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    Masuk
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subtle toggle link when hidden */}
        {onQuickRoleSelect && !showQuickAccess && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setShowQuickAccess(true)}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
            >
              Mode Uji Coba Cepat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
