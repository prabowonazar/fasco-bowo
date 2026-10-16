import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  Unsubscribe,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { Submission, UserRoleId } from '../types';
import { SAMPLE_ITEMS } from '../utils/calculations';

export const firebaseConfig = {
  apiKey: "AIzaSyBr1nc6cFgidMogZt9baWHIanwzqnbb6RA",
  authDomain: "fasco-pegajuan.firebaseapp.com",
  projectId: "fasco-pegajuan",
  storageBucket: "fasco-pegajuan.firebasestorage.app",
  messagingSenderId: "589670448126",
  appId: "1:589670448126:web:2a4872813aa37f1af09eaf",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Role mapping from email or identifier
export function resolveUserRole(user: { email?: string | null; displayName?: string | null } | null): UserRoleId | null {
  if (!user) return null;
  const email = (user.email || '').toLowerCase().trim();
  const name = (user.displayName || '').toLowerCase().trim();
  const identity = `${email} ${name}`;

  if (identity.includes('gita')) return 'gita';
  if (identity.includes('fricella')) return 'fricella';
  if (identity.includes('memorianti')) return 'memorianti';
  if (identity.includes('fricio')) return 'fricio';
  if (identity.includes('ardian') || identity.includes('purchasing')) return 'ardian';
  if (identity.includes('prabowo') || identity.includes('nazar')) return 'prabowo';

  return null;
}

export function getUserRoleLabel(role: UserRoleId | null): string {
  if (!role) return 'Belum terdaftar';
  switch (role) {
    case 'ardian':
      return 'Ardian (Purchasing)';
    case 'prabowo':
      return 'Nazar Prabowo (Pengaju)';
    case 'gita':
      return 'Gita Ismaya (Mengetahui)';
    case 'fricella':
      return 'Fricella Siehendra (Menyetujui)';
    case 'memorianti':
      return 'Memorianti Kaban (Menyetujui)';
    case 'fricio':
      return 'Fricio Sinkiani (Menyetujui)';
  }
}

// Local mock storage key for resilient mobile experience when offline or testing
const LOCAL_STORAGE_KEY = 'fasco_submissions_cache_v1';

export function getInitialSeedSubmissions(): Submission[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // Ignore cache parse error
    }
  }

  const initialSubmissions: Submission[] = [
    {
      id: 'sub-001',
      cabang: 'Semua Cabang',
      catatan: 'Pengajuan restock reguler Q4 2026 untuk cabang Pusat, Meruya, dan Surabaya.',
      createdAt: Date.now() - 86400000 * 2, // 2 days ago
      createdBy: 'prabowonazar@gmail.com',
      items: SAMPLE_ITEMS,
      approvals: {
        gita: { status: 'approved', note: 'Sudah dicek kelengkapan histori penjualan dan proyeksi.', at: Date.now() - 86400000 },
        fricella: { status: 'approved', note: 'Disetujui sesuai kuota anggaran pengadaan.', at: Date.now() - 43200000 },
        memorianti: { status: 'pending', note: '' },
        fricio: { status: 'pending', note: '' },
      },
    },
    {
      id: 'sub-002',
      cabang: 'Meruya',
      catatan: 'Permintaan mendesak Chiller & Under-Counter untuk proyek Hotel Grand Meruya.',
      createdAt: Date.now() - 86400000 * 5,
      createdBy: 'prabowonazar@gmail.com',
      items: [SAMPLE_ITEMS[1]],
      approvals: {
        gita: { status: 'approved', note: 'Kebutuhan mendesak valid.', at: Date.now() - 86400000 * 4 },
        fricella: { status: 'approved', note: 'Approved.', at: Date.now() - 86400000 * 3 },
        memorianti: { status: 'approved', note: 'Stok gudang Meruya memang kritis.', at: Date.now() - 86400000 * 2 },
        fricio: { status: 'approved', note: 'Final approval diberikan. Segera proses PO ke pabrik.', at: Date.now() - 86400000 },
      },
    },
  ];

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialSubmissions));
  return initialSubmissions;
}

export function saveSubmissionsToCache(subs: Submission[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(subs));
  } catch {
    // Ignore storage quota
  }
}

// Firestore Realtime Subscription with Local Fallback
export function subscribeToSubmissions(
  onData: (submissions: Submission[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, 'submissions');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Submission[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
            } as Submission;
          });
          saveSubmissionsToCache(list);
          onData(list);
        } else {
          // If Firestore is empty, provide seed data & sync
          const seeds = getInitialSeedSubmissions();
          onData(seeds);
        }
      },
      (error) => {
        console.warn('Firestore snapshot error, falling back to cached/seed data:', error);
        onError(error);
        const seeds = getInitialSeedSubmissions();
        onData(seeds);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    onError(err);
    const seeds = getInitialSeedSubmissions();
    onData(seeds);
    return () => {};
  }
}

export async function createSubmission(
  submissionData: Omit<Submission, 'id'>
): Promise<string> {
  try {
    const colRef = collection(db, 'submissions');
    const docRef = await addDoc(colRef, submissionData);
    return docRef.id;
  } catch (err) {
    console.warn('Firestore addDoc failed, updating local fallback:', err);
    const id = 'local-' + Date.now().toString(36);
    const seeds = getInitialSeedSubmissions();
    const newSub: Submission = { id, ...submissionData };
    seeds.unshift(newSub);
    saveSubmissionsToCache(seeds);
    return id;
  }
}

export async function updateSubmissionData(
  id: string,
  updates: Record<string, any>
): Promise<void> {
  try {
    const docRef = doc(db, 'submissions', id);
    await updateDoc(docRef, updates);
  } catch (err) {
    console.warn('Firestore updateDoc failed, updating local cache:', err);
    const cached = getInitialSeedSubmissions();
    const index = cached.findIndex((s) => s.id === id);
    if (index !== -1) {
      cached[index] = { ...cached[index], ...updates };
      saveSubmissionsToCache(cached);
    }
  }
}

export async function deleteSubmissionById(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'submissions', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteDoc failed, updating local cache:', err);
    const cached = getInitialSeedSubmissions().filter((s) => s.id !== id);
    saveSubmissionsToCache(cached);
  }
}
