export type ApproverId = 'gita' | 'fricella' | 'memorianti' | 'fricio';
export type UserRoleId = ApproverId | 'prabowo' | 'ardian';

export interface ApproverConfig {
  id: ApproverId;
  name: string;
  role: 'Mengetahui' | 'Menyetujui';
}

export interface Attachment {
  id: string;
  name: string;
  contentType: string;
  sizeBytes: number;
  dataUrl: string;
}

export interface StockItem {
  id: string;
  namaPemasok: string;
  kategori: string;
  kodeBarang: string;
  namaBarang: string;
  namaMerek: string;
  kts: number | string;
  avg2022: number | string;
  avg2023: number | string;
  avg2024: number | string;
  avg2025: number | string;
  monthlyProjection2026: number | string;
  appliedAverage2026: number | string;
  safetyPercent: number | string;
  leadTimeMonth: number | string;
  coveragePeriodMonth: number | string;
  estReorderSchedule: string;
  orderMultiple: number | string;
  opsi2Carton: number | string;
  opsi3Carton: number | string;
  // Computed fields (can also be calculated on the fly)
  minQtyStock?: number;
  targetStock?: number;
  estOrderMaxQty?: number;
  orderRounding?: number;
  totalCarton?: number;
  shortage?: number;
}

export interface ApprovalStepState {
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  at?: number;
  noteAt?: number;
  attachments?: Attachment[];
}

export interface Submission {
  id: string;
  cabang: string;
  catatan?: string;
  catatanUpdatedAt?: number;
  catatanUpdatedBy?: string;
  optionsUpdatedAt?: number;
  optionsUpdatedBy?: string;
  createdAt: number;
  createdBy: string;
  items: StockItem[];
  attachments?: Attachment[];
  approvals: Record<ApproverId, ApprovalStepState>;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface ColumnDef {
  key: keyof StockItem;
  label: string;
  type: 'text' | 'number' | 'computed';
  wide?: boolean;
  group?: 'info' | 'sales' | 'inventory' | 'order';
}
