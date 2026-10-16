import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  Printer, 
  Filter, 
  LayoutList, 
  Table as TableIcon, 
  Paperclip, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  Edit3, 
  Check, 
  X,
  RefreshCw,
  LogOut,
  Smartphone,
  Shield,
  Layers,
  Save,
  Boxes,
  Bell,
  BellRing,
  Send
} from 'lucide-react';
import { auth, resolveUserRole, subscribeToSubmissions, createSubmission, updateSubmissionData, deleteSubmissionById, getUserRoleLabel } from './services/firebase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { 
  Submission, 
  StockItem, 
  UserRoleId, 
  ApproverId, 
  Attachment,
  SubmissionStatus 
} from './types';
import { 
  APPROVERS, 
  BRANCHES, 
  computeSubmissionStatus, 
  createEmptyItem, 
  getShortage, 
  getTotalCarton, 
  SAMPLE_ITEMS 
} from './utils/calculations';
import { fmtDate, fmtDateTime, fmtBytes, triggerHaptic } from './utils/formatters';
import { usePWAInstall } from './hooks/usePWAInstall';
import { 
  sendSubmissionNotification, 
  requestNotificationPermission, 
  getNotificationPermission, 
  InAppToast 
} from './services/notifications';

// Components
import { MobileHeader } from './components/MobileHeader';
import { BottomNavBar, TabKey } from './components/BottomNavBar';
import { SubmissionCard } from './components/SubmissionCard';
import { ItemCard } from './components/ItemCard';
import { ItemSheetEditor } from './components/ItemSheetEditor';
import { SpreadsheetView } from './components/SpreadsheetView';
import { ApprovalStepper } from './components/ApprovalStepper';
import { PWAInstallModal } from './components/PWAInstallModal';
import { InstallAppBanner } from './components/InstallAppBanner';
import { OfflineBanner } from './components/OfflineBanner';
import { LoginModal } from './components/LoginModal';
import { PrintDocument } from './components/PrintDocument';
import { NotificationToast } from './components/NotificationToast';

export default function App() {
  // Authentication & Role
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRoleId | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Submissions State
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<TabKey>('beranda');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('Semua Cabang');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'shortage'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // View Options for Items (Mobile Card vs 25-Column Table)
  const [itemViewMode, setItemViewMode] = useState<'cards' | 'table'>('cards');

  // Modals & Sheets
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isItemSheetOpen, setIsItemSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // New Submission Draft State
  const [draftBranch, setDraftBranch] = useState<string>(BRANCHES[1]); // Default 'Pusat'
  const [draftNote, setDraftNote] = useState<string>('');
  const [draftItems, setDraftItems] = useState<StockItem[]>([createEmptyItem()]);
  const [draftAttachments, setDraftAttachments] = useState<Attachment[]>([]);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Editing Note on Detail View (for Pengaju)
  const [isEditingDetailNote, setIsEditingDetailNote] = useState(false);
  const [detailNoteVal, setDetailNoteVal] = useState('');

  // Notification State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => getNotificationPermission());
  const [currentToast, setCurrentToast] = useState<InAppToast | null>(null);
  const prevSubmissionsRef = useRef<Submission[] | null>(null);
  const [showRoleTester, setShowRoleTester] = useState(false);

  // PWA Install State
  const { isInstallable, isInstalled } = usePWAInstall();

  // Listen to Service Worker messages (e.g. user clicked notification)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NAVIGATE_SUBMISSION' && event.data.submissionId) {
          setSelectedSubmissionId(event.data.submissionId);
          setActiveTab('beranda');
        }
      };
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  // Auto-dismiss in-app toast after 5 seconds
  useEffect(() => {
    if (currentToast) {
      const timer = setTimeout(() => {
        setCurrentToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentToast]);

  // Request or check notification permission
  const handleToggleNotification = async () => {
    triggerHaptic(15);
    const granted = await requestNotificationPermission();
    const updated = getNotificationPermission();
    setNotificationPermission(updated);
    if (granted) {
      setCurrentToast({
        id: Date.now().toString(),
        title: 'Notifikasi Aktif',
        body: 'Anda akan menerima notifikasi perangkat setiap status pengajuan berubah.',
        type: 'info',
        timestamp: Date.now(),
      });
      // Send welcoming notification via Service Worker
      sendSubmissionNotification(
        'Fasco Mobile: Notifikasi Aktif',
        'Sistem notifikasi Service Worker telah terhubung. Anda akan menerima update persetujuan pengajuan stok.'
      );
    }
  };

  // Test Notification Trigger
  const handleTestNotification = async () => {
    triggerHaptic(20);
    const title = 'Persetujuan Stok Diperbarui (Pusat)';
    const body = 'Gita Ismaya (Mengetahui) telah menyetujui pengajuan stok cabang Pusat.';
    
    // Send via service worker
    await sendSubmissionNotification(title, body, submissions[0]?.id || 'sub-001');

    // Also display in-app toast
    setCurrentToast({
      id: Date.now().toString(),
      title,
      body,
      submissionId: submissions[0]?.id || 'sub-001',
      type: 'approved',
      timestamp: Date.now(),
    });
  };

  // Listen to Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserEmail(user.email);
        const resolved = resolveUserRole(user);
        setCurrentRole(resolved || 'prabowo'); // fallback to pengaju if unspecified
      } else {
        // Check if there is a session simulation stored
        const storedRole = localStorage.getItem('fasco_sim_role') as UserRoleId | null;
        const storedEmail = localStorage.getItem('fasco_sim_email');
        if (storedRole && storedEmail) {
          setCurrentRole(storedRole);
          setCurrentUserEmail(storedEmail);
        } else {
          setCurrentUserEmail(null);
          setCurrentRole(null);
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsub();
  }, []);

  // Listen to Firestore Submissions & Detect Status Changes for Notifications
  useEffect(() => {
    if (!currentRole && !currentUserEmail) return;

    setIsLoadingData(true);
    const unsub = subscribeToSubmissions(
      (list) => {
        // Compare with previous state to notify the submitter / user of changes
        if (prevSubmissionsRef.current && prevSubmissionsRef.current.length > 0) {
          list.forEach((newSub) => {
            const oldSub = prevSubmissionsRef.current?.find((s) => s.id === newSub.id);
            if (oldSub) {
              // Check each approver's status
              APPROVERS.forEach((approver) => {
                const oldStatus = oldSub.approvals?.[approver.id]?.status || 'pending';
                const newStatus = newSub.approvals?.[approver.id]?.status || 'pending';

                if (oldStatus === 'pending' && newStatus === 'approved') {
                  const title = `Persetujuan: ${newSub.cabang}`;
                  const body = `${approver.name} (${approver.role}) telah menyetujui pengajuan stok cabang ${newSub.cabang}.`;
                  
                  sendSubmissionNotification(title, body, newSub.id);
                  setCurrentToast({
                    id: Date.now().toString() + Math.random(),
                    title,
                    body,
                    submissionId: newSub.id,
                    type: 'approved',
                    timestamp: Date.now(),
                  });
                } else if (oldStatus === 'pending' && newStatus === 'rejected') {
                  const title = `Pengajuan Ditolak: ${newSub.cabang}`;
                  const body = `${approver.name} (${approver.role}) menolak pengajuan stok cabang ${newSub.cabang}. Catatan: "${newSub.approvals?.[approver.id]?.note || '—'}"`;
                  
                  sendSubmissionNotification(title, body, newSub.id);
                  setCurrentToast({
                    id: Date.now().toString() + Math.random(),
                    title,
                    body,
                    submissionId: newSub.id,
                    type: 'rejected',
                    timestamp: Date.now(),
                  });
                }
              });

              // Check if 100% all approved
              const wasAllApproved = computeSubmissionStatus(oldSub) === 'approved';
              const isNowAllApproved = computeSubmissionStatus(newSub) === 'approved';
              if (!wasAllApproved && isNowAllApproved) {
                const title = `🎉 Pengajuan Disetujui Lengkap (${newSub.cabang})`;
                const body = `Seluruh 4 pejabat persetujuan telah menyetujui pengajuan stok cabang ${newSub.cabang}. Dokumen siap dicetak!`;
                
                sendSubmissionNotification(title, body, newSub.id);
                setCurrentToast({
                  id: Date.now().toString() + Math.random(),
                  title,
                  body,
                  submissionId: newSub.id,
                  type: 'approved',
                  timestamp: Date.now(),
                });
              }
            }
          });
        }

        prevSubmissionsRef.current = list;
        setSubmissions(list);
        setIsLoadingData(false);
      },
      (err) => {
        console.warn('Subscription error:', err);
        setIsLoadingData(false);
      }
    );

    return () => unsub();
  }, [currentRole, currentUserEmail]);

  // Quick Demo Role Switcher
  const handleQuickRoleSelect = (role: UserRoleId, email: string) => {
    triggerHaptic(15);
    localStorage.setItem('fasco_sim_role', role);
    localStorage.setItem('fasco_sim_email', email);
    setCurrentRole(role);
    setCurrentUserEmail(email);
  };

  const handleLogout = async () => {
    triggerHaptic(15);
    localStorage.removeItem('fasco_sim_role');
    localStorage.removeItem('fasco_sim_email');
    try {
      await fbSignOut(auth);
    } catch {
      // Ignore
    }
    setCurrentRole(null);
    setCurrentUserEmail(null);
    setSelectedSubmissionId(null);
  };

  // Selected Submission
  const activeSubmission = useMemo(() => {
    if (!selectedSubmissionId) return null;
    return submissions.find((s) => s.id === selectedSubmissionId) || null;
  }, [selectedSubmissionId, submissions]);

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Branch filter
      if (selectedBranch !== 'Semua Cabang' && sub.cabang !== selectedBranch) {
        return false;
      }

      // Status filter
      const st = computeSubmissionStatus(sub);
      if (statusFilter === 'pending' && st !== 'pending') return false;
      if (statusFilter === 'approved' && st !== 'approved') return false;
      if (statusFilter === 'rejected' && st !== 'rejected') return false;
      if (statusFilter === 'shortage') {
        const hasShort = (sub.items || []).some((it) => getShortage(it) < 0);
        if (!hasShort) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inId = sub.id.toLowerCase().includes(q);
        const inBranch = (sub.cabang || '').toLowerCase().includes(q);
        const inNote = (sub.catatan || '').toLowerCase().includes(q);
        const inItems = (sub.items || []).some(
          (it) =>
            (it.namaBarang || '').toLowerCase().includes(q) ||
            (it.kodeBarang || '').toLowerCase().includes(q) ||
            (it.namaPemasok || '').toLowerCase().includes(q)
        );
        if (!inId && !inBranch && !inNote && !inItems) return false;
      }

      return true;
    });
  }, [submissions, selectedBranch, statusFilter, searchQuery]);

  // Submissions Waiting for Current User (Tab 'Persetujuan')
  const pendingForCurrentUser = useMemo(() => {
    if (!currentRole) return [];
    if (currentRole === 'prabowo' || currentRole === 'ardian') {
      // For Purchasing/Pengaju, show active submissions currently in approval pipeline
      return submissions.filter((sub) => computeSubmissionStatus(sub) === 'pending');
    }
    return submissions.filter((sub) => {
      const ap = sub.approvals?.[currentRole as ApproverId];
      if (!ap || ap.status !== 'pending') return false;

      // Check if previous approver has already approved
      const idx = APPROVERS.findIndex((a) => a.id === currentRole);
      if (idx > 0) {
        const prev = APPROVERS[idx - 1];
        if (sub.approvals?.[prev.id]?.status !== 'approved') return false;
      }
      return true;
    });
  }, [submissions, currentRole]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((s) => computeSubmissionStatus(s) === 'pending').length;
    const approved = submissions.filter((s) => computeSubmissionStatus(s) === 'approved').length;
    const shortageCount = submissions.filter((s) =>
      (s.items || []).some((it) => getShortage(it) < 0)
    ).length;

    return { total, pending, approved, shortageCount };
  }, [submissions]);

  // Handle Approver Decisions
  const handleDecide = async (approverId: ApproverId, decision: 'approved' | 'rejected', note: string) => {
    if (!activeSubmission) return;
    const updatePath = {
      [`approvals.${approverId}.status`]: decision,
      [`approvals.${approverId}.note`]: note || '',
      [`approvals.${approverId}.at`]: Date.now(),
    };

    // Update in memory & firestore
    await updateSubmissionData(activeSubmission.id, updatePath);

    // Update local state copy
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSubmission.id) return s;
        return {
          ...s,
          approvals: {
            ...s.approvals,
            [approverId]: {
              ...s.approvals[approverId],
              status: decision,
              note: note || '',
              at: Date.now(),
            },
          },
        };
      })
    );
  };

  const handleSaveNote = async (approverId: ApproverId, note: string) => {
    if (!activeSubmission) return;
    const updatePath = {
      [`approvals.${approverId}.note`]: note || '',
      [`approvals.${approverId}.noteAt`]: Date.now(),
    };
    await updateSubmissionData(activeSubmission.id, updatePath);
  };

  const handleUploadApprovalAttachment = async (approverId: ApproverId, attachment: Attachment) => {
    if (!activeSubmission) return;
    const currentAtts = activeSubmission.approvals?.[approverId]?.attachments || [];
    const updatePath = {
      [`approvals.${approverId}.attachments`]: [...currentAtts, attachment],
    };
    await updateSubmissionData(activeSubmission.id, updatePath);
  };

  // Handle Pengaju Detail Note Save
  const handleSaveDetailNote = async () => {
    if (!activeSubmission) return;
    triggerHaptic(15);
    await updateSubmissionData(activeSubmission.id, {
      catatan: detailNoteVal,
      catatanUpdatedAt: Date.now(),
      catatanUpdatedBy: currentUserEmail || 'Pengaju',
    });
    setIsEditingDetailNote(false);
  };

  // Handle Approvers Opsi 2 & 3 Update
  const handleOptionsUpdate = async (itemId: string, opsi2: number | string, opsi3: number | string) => {
    if (!activeSubmission) return;
    const updatedItems = (activeSubmission.items || []).map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          opsi2Carton: opsi2,
          opsi3Carton: opsi3,
        };
      }
      return it;
    });

    await updateSubmissionData(activeSubmission.id, {
      items: updatedItems,
      optionsUpdatedAt: Date.now(),
      optionsUpdatedBy: currentUserEmail || 'Approver',
    });
  };

  // Handle Delete Submission
  const handleDeleteSubmission = async () => {
    if (!activeSubmission) return;
    const confirmed = confirm('Hapus pengajuan stok ini? Tindakan ini tidak dapat dibatalkan.');
    if (!confirmed) return;
    triggerHaptic(20);
    await deleteSubmissionById(activeSubmission.id);
    setSelectedSubmissionId(null);
  };

  // New Submission Form Actions
  const handleOpenItemEditor = (item?: StockItem, index?: number) => {
    triggerHaptic(10);
    setEditingItem(item || null);
    setEditingItemIndex(index !== undefined ? index : null);
    setIsItemSheetOpen(true);
  };

  const handleSaveItemFromEditor = (savedItem: StockItem) => {
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      // Update existing item in draft
      setDraftItems((prev) => {
        const copy = [...prev];
        copy[editingItemIndex] = savedItem;
        return copy;
      });
    } else {
      // Add new item to draft
      setDraftItems((prev) => [...prev, savedItem]);
    }
    setIsItemSheetOpen(false);
    setEditingItem(null);
    setEditingItemIndex(null);
  };

  const handleDeleteDraftItem = (id: string) => {
    triggerHaptic(12);
    setDraftItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddSampleDraftItems = () => {
    triggerHaptic(15);
    setDraftItems(SAMPLE_ITEMS);
  };

  const handleUploadDraftAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 700 * 1024) {
      alert(`File ${file.name} melebihi batas 700 KB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const att: Attachment = {
        id: Date.now().toString(36),
        name: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        dataUrl,
      };
      setDraftAttachments((prev) => [...prev, att]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmitNewSubmission = async () => {
    const validItems = draftItems.filter((it) => it.namaBarang.trim() !== '');
    if (validItems.length === 0) {
      alert('Tambahkan minimal 1 barang dengan Nama Barang yang valid.');
      return;
    }

    triggerHaptic(25);
    setIsSubmittingNew(true);

    const initialApprovals: any = {};
    APPROVERS.forEach((a) => {
      initialApprovals[a.id] = { status: 'pending' };
    });

    const newSubData: Omit<Submission, 'id'> = {
      cabang: draftBranch,
      catatan: draftNote,
      createdAt: Date.now(),
      createdBy: currentUserEmail || (currentRole === 'ardian' ? 'ardian@fascosanwira.com' : 'prabowonazar@gmail.com'),
      items: validItems,
      attachments: draftAttachments,
      approvals: initialApprovals,
    };

    try {
      const newId = await createSubmission(newSubData);
      // Reset draft
      setDraftBranch(BRANCHES[1]);
      setDraftNote('');
      setDraftItems([createEmptyItem()]);
      setDraftAttachments([]);
      setActiveTab('beranda');
      setSelectedSubmissionId(newId);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // If not authenticated, show Mobile Login Modal
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#20295f] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white p-2 shadow-lg animate-pulse flex items-center justify-center">
            <img src="/fasco-logo.png" alt="Fasco Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-semibold text-sky-200">Memuat Fasco Mobile...</span>
        </div>
      </div>
    );
  }

  if (!currentRole && !currentUserEmail) {
    return <LoginModal onQuickRoleSelect={handleQuickRoleSelect} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-24 safe-top select-none">
      <OfflineBanner />
      <NotificationToast
        toast={currentToast}
        onDismiss={() => setCurrentToast(null)}
        onOpenSubmission={(id) => {
          setSelectedSubmissionId(id);
          setActiveTab('beranda');
        }}
      />

      {/* Top Header */}
      {!selectedSubmissionId && (
        <MobileHeader
          currentRole={currentRole}
          currentUserEmail={currentUserEmail}
          selectedBranch={selectedBranch}
          onSelectBranch={setSelectedBranch}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={showSearch}
          onToggleSearch={() => setShowSearch(!showSearch)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          notificationPermission={notificationPermission}
          onToggleNotification={handleToggleNotification}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-3.5 space-y-4">
        {/* VIEW 1: SUBMISSION DETAIL */}
        {activeSubmission ? (
          <div className="space-y-4 animate-slide-up">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => { triggerHaptic(); setSelectedSubmissionId(null); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs active:scale-95 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>

              <div className="flex items-center gap-2">
                {computeSubmissionStatus(activeSubmission) === 'approved' && (
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(); setIsPrintModalOpen(true); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs active:scale-95 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submission Info Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pengajuan Stok
                  </span>
                  <h2 className="text-lg font-black text-[#20295f] dark:text-white leading-tight">
                    {activeSubmission.cabang}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Diajukan {fmtDate(activeSubmission.createdAt)} oleh <span className="font-semibold text-slate-700 dark:text-slate-300">{activeSubmission.createdBy}</span>
                  </p>
                </div>

                <div className="text-right">
                  {(() => {
                    const st = computeSubmissionStatus(activeSubmission);
                    const color =
                      st === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : st === 'rejected'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300';
                    return (
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
                        {st === 'approved' ? 'Disetujui' : st === 'rejected' ? 'Ditolak' : 'Menunggu Review'}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Note / Edit Note for Pengaju */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                {isEditingDetailNote ? (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Edit Catatan Pengajuan:
                    </label>
                    <textarea
                      value={detailNoteVal}
                      onChange={(e) => setDetailNoteVal(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingDetailNote(false)}
                        className="px-2.5 py-1 text-slate-500 text-xs"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveDetailNote}
                        className="px-3 py-1 bg-[#20295f] text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                        Catatan Pengajuan:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 italic">
                        {activeSubmission.catatan || 'Tidak ada catatan.'}
                      </p>
                    </div>
                    {(currentRole === 'prabowo' || currentRole === 'ardian') && (
                      <button
                        onClick={() => {
                          setDetailNoteVal(activeSubmission.catatan || '');
                          setIsEditingDetailNote(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Edit Catatan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              {activeSubmission.attachments && activeSubmission.attachments.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    Dokumen Lampiran Pengajuan:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSubmission.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-500" />
                        <span className="max-w-[140px] truncate">{att.name}</span>
                        <span className="text-slate-400 font-mono text-[10px]">({fmtBytes(att.sizeBytes)})</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Items Header & View Switcher */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-[#20295f] dark:text-sky-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Daftar Barang ({activeSubmission.items?.length || 0})
                </h3>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { triggerHaptic(8); setItemViewMode('cards'); }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                    itemViewMode === 'cards'
                      ? 'bg-[#20295f] text-white font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={() => { triggerHaptic(8); setItemViewMode('table'); }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                    itemViewMode === 'table'
                      ? 'bg-[#20295f] text-white font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
              </div>
            </div>

            {/* Items Display: Either Mobile Cards or Full 25-column Table */}
            {itemViewMode === 'cards' ? (
              <div className="space-y-2.5">
                {activeSubmission.items?.map((it, idx) => (
                  <ItemCard
                    key={it.id || idx}
                    item={it}
                    index={idx}
                    canEditOptions={['fricella', 'memorianti', 'fricio'].includes(currentRole || '')}
                    onOptionsUpdate={handleOptionsUpdate}
                  />
                ))}
              </div>
            ) : (
              <SpreadsheetView
                items={activeSubmission.items || []}
                canEditOptions={['fricella', 'memorianti', 'fricio'].includes(currentRole || '')}
                onOptionsChange={(itemId, field, val) => {
                  handleOptionsUpdate(
                    itemId,
                    field === 'opsi2Carton' ? val : activeSubmission.items.find(x => x.id === itemId)?.opsi2Carton || '',
                    field === 'opsi3Carton' ? val : activeSubmission.items.find(x => x.id === itemId)?.opsi3Carton || ''
                  );
                }}
              />
            )}

            {/* Multi-tier Approval Stepper Section */}
            <ApprovalStepper
              submission={activeSubmission}
              currentRole={currentRole}
              onDecide={handleDecide}
              onSaveNote={handleSaveNote}
              onUploadAttachment={handleUploadApprovalAttachment}
            />

            {/* Delete Submission Action for Pengaju */}
            {(currentRole === 'prabowo' || currentRole === 'ardian') && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleDeleteSubmission}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Pengajuan Ini</span>
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'beranda' ? (
          /* VIEW 2: TAB BERANDA (FEED & METRICS) */
          <div className="space-y-4">
            {/* Install Banner */}
            <InstallAppBanner onOpenModal={() => setIsInstallModalOpen(true)} />

            {/* Quick Metrics Carousel */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <button
                type="button"
                onClick={() => { triggerHaptic(8); setStatusFilter('all'); }}
                className={`p-2.5 rounded-2xl border transition active:scale-95 ${
                  statusFilter === 'all'
                    ? 'bg-[#20295f] text-white border-[#20295f] shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[10px] font-medium leading-none opacity-80">Total</div>
                <div className="text-base font-black font-mono mt-1">{metrics.total}</div>
              </button>

              <button
                type="button"
                onClick={() => { triggerHaptic(8); setStatusFilter('pending'); }}
                className={`p-2.5 rounded-2xl border transition active:scale-95 ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[10px] font-medium leading-none opacity-80">Menunggu</div>
                <div className="text-base font-black font-mono mt-1 text-amber-500 group-hover:text-white">
                  {statusFilter === 'pending' ? metrics.pending : <span className="text-amber-500">{metrics.pending}</span>}
                </div>
              </button>

              <button
                type="button"
                onClick={() => { triggerHaptic(8); setStatusFilter('approved'); }}
                className={`p-2.5 rounded-2xl border transition active:scale-95 ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[10px] font-medium leading-none opacity-80">Disetujui</div>
                <div className="text-base font-black font-mono mt-1 text-emerald-600">
                  {statusFilter === 'approved' ? metrics.approved : <span className="text-emerald-500">{metrics.approved}</span>}
                </div>
              </button>

              <button
                type="button"
                onClick={() => { triggerHaptic(8); setStatusFilter('shortage'); }}
                className={`p-2.5 rounded-2xl border transition active:scale-95 ${
                  statusFilter === 'shortage'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[10px] font-medium leading-none opacity-80">Kritis</div>
                <div className="text-base font-black font-mono mt-1 text-rose-500">
                  {statusFilter === 'shortage' ? metrics.shortageCount : <span className="text-rose-500">{metrics.shortageCount}</span>}
                </div>
              </button>
            </div>

            {/* Submissions List Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Daftar Pengajuan ({filteredSubmissions.length})
              </h2>

              {statusFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            {/* List Body */}
            {isLoadingData ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-sky-500" />
                <p className="text-xs font-medium">Sinkronisasi data pengajuan...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Filter className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Tidak ada pengajuan ditemukan
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {searchQuery ? `Tidak ada hasil untuk kata kunci "${searchQuery}".` : 'Belum ada pengajuan stok yang sesuai filter ini.'}
                  </p>
                </div>
                {(currentRole === 'prabowo' || currentRole === 'ardian') && (
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(); setActiveTab('buat'); }}
                    className="px-4 py-2 bg-[#20295f] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Pengajuan Sekarang</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubmissions.map((sub) => (
                  <SubmissionCard
                    key={sub.id}
                    submission={sub}
                    onClick={() => setSelectedSubmissionId(sub.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'persetujuan' ? (
          /* VIEW 3: TAB PERSETUJUAN (WAITING FOR CURRENT USER) */
          <div className="space-y-4 animate-slide-up">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
                <span>
                  {currentRole === 'prabowo' || currentRole === 'ardian'
                    ? 'Monitoring Persetujuan Pengadaan'
                    : 'Kotak Masuk Review Anda'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {currentRole === 'prabowo' || currentRole === 'ardian' ? (
                  <>
                    Sebagai <strong>{getUserRoleLabel(currentRole)}</strong>, berikut pengajuan stok yang sedang dalam proses review berjenjang (Gita &rarr; Fricella &rarr; Memorianti &rarr; Fricio).
                  </>
                ) : (
                  <>
                    Pengajuan yang memerlukan otorisasi sebagai <strong className="text-slate-800 dark:text-slate-200">{getUserRoleLabel(currentRole)}</strong>.
                  </>
                )}
              </p>
            </div>

            {pendingForCurrentUser.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {currentRole === 'prabowo' || currentRole === 'ardian'
                      ? 'Tidak Ada Pengajuan Menunggu'
                      : 'Semua Tugas Review Selesai'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {currentRole === 'prabowo' || currentRole === 'ardian'
                      ? 'Seluruh pengajuan stok telah selesai diproses oleh pejabat pengesah.'
                      : 'Tidak ada pengajuan yang menunggu keputusan Anda saat ini.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingForCurrentUser.map((sub) => (
                  <SubmissionCard
                    key={sub.id}
                    submission={sub}
                    onClick={() => setSelectedSubmissionId(sub.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'buat' ? (
          /* VIEW 4: TAB BUAT PENGAJUAN BARU */
          <div className="space-y-4 animate-slide-up">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h2 className="font-extrabold text-base text-[#20295f] dark:text-white">
                Buat Pengajuan Stok Baru
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Isi parameter cabang, catatan, dan daftar barang yang diajukan
              </p>
            </div>

            {/* Branch & Note Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pilih Cabang Gudang
                </label>
                <select
                  value={draftBranch}
                  onChange={(e) => setDraftBranch(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan Pengajuan (Opsional)
                </label>
                <input
                  type="text"
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="Contoh: Restock bulanan Q4 2026 atau kebutuhan proyek khusus"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>

            {/* Items Card Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Daftar Barang ({draftItems.length})
                </h3>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAddSampleDraftItems}
                    className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Contoh Data Fasco</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenItemEditor()}
                    className="px-2.5 py-1 bg-[#20295f] hover:bg-[#18204b] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              {draftItems.map((item, idx) => (
                <ItemCard
                  key={item.id || idx}
                  item={item}
                  index={idx}
                  canEditFull={true}
                  onEdit={(it) => handleOpenItemEditor(it, idx)}
                  onDelete={draftItems.length > 1 ? handleDeleteDraftItem : undefined}
                />
              ))}
            </div>

            {/* Attachments Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    Dokumen Pendukung (Opsional)
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    PDF penawaran, foto fisik barang, atau spreadsheet Excel
                  </p>
                </div>

                <label className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf,image/*,.csv,.xlsx,.docx"
                    onChange={handleUploadDraftAttachment}
                  />
                </label>
              </div>

              {draftAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {draftAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-500" />
                      <span className="max-w-[120px] truncate font-medium">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setDraftAttachments((prev) => prev.filter((x) => x.id !== att.id))}
                        className="text-rose-500 hover:text-rose-700 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmitNewSubmission}
                disabled={isSubmittingNew}
                className="w-full py-3.5 bg-gradient-to-r from-[#20295f] to-[#2d93e8] hover:from-[#18204b] hover:to-[#227ec9] text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-950/20 active:scale-98 transition disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmittingNew ? 'Mengirim Pengajuan...' : 'Kirim untuk Persetujuan'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 5: TAB PROFIL & PENGATURAN */
          <div className="space-y-4 animate-slide-up">
            {/* User Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#20295f] p-1.5 shadow-md flex items-center justify-center flex-shrink-0">
                <img src="/fasco-logo.png" alt="Fasco Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="inline-block px-2 py-0.5 bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1">
                  Akun Aktif
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {getUserRoleLabel(currentRole)}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                  {currentUserEmail}
                </p>
              </div>
            </div>

            {/* PWA & APK Mobile App Card */}
            <div className="bg-gradient-to-tr from-[#20295f] to-[#2d93e8] text-white rounded-3xl p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-sky-200" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Instal / Unduh File .APK</h4>
                  <p className="text-xs text-sky-100/80">Pasang di HP atau download file .apk Android</p>
                </div>
              </div>
              <p className="text-xs text-sky-100/90 leading-relaxed">
                Tersedia 2 opsi: <strong>Instal Langsung 1-Klik</strong> (PWA tanpa browser bar) atau <strong>Unduh File .APK</strong> resmi via PWABuilder untuk dibagikan ke tim.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { triggerHaptic(); setIsInstallModalOpen(true); }}
                  className="py-2.5 px-3 bg-white text-[#20295f] rounded-xl text-xs font-bold hover:bg-sky-50 transition active:scale-95 shadow-md text-center"
                >
                  Instal Langsung
                </button>
                <button
                  type="button"
                  onClick={() => { triggerHaptic(); setIsInstallModalOpen(true); }}
                  className="py-2.5 px-3 bg-sky-500/30 hover:bg-sky-500/40 border border-sky-300/40 text-white rounded-xl text-xs font-bold transition active:scale-95 text-center flex items-center justify-center gap-1"
                >
                  <span>Unduh .APK</span>
                </button>
              </div>
            </div>

            {/* Service Worker Notification Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      Notifikasi Service Worker
                    </h4>
                    <p className="text-[11px] text-slate-500">Update status pengajuan & persetujuan</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : notificationPermission === 'denied'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}>
                  {notificationPermission === 'granted'
                    ? 'Aktif'
                    : notificationPermission === 'denied'
                    ? 'Diblokir'
                    : 'Belum Aktif'}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Pengaju / Purchasing (<strong>Nazar & Ardian</strong>) akan menerima notifikasi otomatis saat pejabat (<strong>Gita</strong>, <strong>Fricella</strong>, <strong>Memorianti</strong>, atau <strong>Fricio</strong>) menyetujui atau menolak pengajuan stok.
              </p>

              <div className="flex items-center gap-2 pt-1">
                {notificationPermission !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleToggleNotification}
                    className="flex-1 py-2.5 px-4 bg-[#20295f] hover:bg-[#18204b] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Aktifkan Notifikasi</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Tes Notifikasi</span>
                  </button>
                )}
              </div>
            </div>

            {/* Switch Role Quick Tester */}
            {/* Switch Role Quick Tester (Hidden by default / Collapsible) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
              <button
                type="button"
                onClick={() => setShowRoleTester((prev) => !prev)}
                className="w-full flex items-center justify-between text-left focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Uji Coba Alur Peran (Role Switcher)
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                  {showRoleTester ? 'Sembunyikan' : 'Buka'}
                </span>
              </button>

              {showRoleTester && (
                <div className="space-y-3 animate-slide-up pt-1">
                  <p className="text-xs text-slate-500">
                    Beralih akun untuk menguji alur pengajuan Purchasing & persetujuan berjenjang:
                  </p>

                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { role: 'prabowo', name: 'Nazar Prabowo', label: 'Pengaju (Nazar)' },
                      { role: 'ardian', name: 'Ardian', label: 'Purchasing (Ardian)' },
                      { role: 'gita', name: 'Gita Ismaya', label: 'Mengetahui (Gita)' },
                      { role: 'fricella', name: 'Fricella Siehendra', label: 'Menyetujui 1 (Fricella)' },
                      { role: 'memorianti', name: 'Memorianti Kaban', label: 'Menyetujui 2 (Memorianti)' },
                      { role: 'fricio', name: 'Fricio Sinkiani', label: 'Menyetujui 3 (Fricio)' },
                    ].map((acc) => {
                      const isActive = currentRole === acc.role;
                      return (
                        <button
                          key={acc.role}
                          type="button"
                          onClick={() => handleQuickRoleSelect(acc.role as UserRoleId, `${acc.role}@fascosanwira.com`)}
                          className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between active:scale-98 ${
                            isActive
                              ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-bold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs">
                            <div>{acc.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{acc.label}</div>
                          </div>
                          {isActive && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Logout Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Mobile Navigation Bar */}
      <BottomNavBar
        currentTab={activeTab}
        onTabChange={(tab) => {
          setSelectedSubmissionId(null);
          setActiveTab(tab);
        }}
        pendingApprovalsCount={pendingForCurrentUser.length}
        canCreate={currentRole === 'prabowo' || currentRole === 'ardian'}
      />

      {/* Item Sheet Editor Modal */}
      <ItemSheetEditor
        isOpen={isItemSheetOpen}
        initialItem={editingItem}
        onClose={() => {
          setIsItemSheetOpen(false);
          setEditingItem(null);
          setEditingItemIndex(null);
        }}
        onSave={handleSaveItemFromEditor}
      />

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Print Document Modal */}
      {activeSubmission && (
        <PrintDocument
          submission={activeSubmission}
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
}
