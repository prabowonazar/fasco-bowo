import { ApproverConfig, ColumnDef, StockItem, Submission, SubmissionStatus } from '../types';

export const APPROVERS: ApproverConfig[] = [
  { id: 'gita', name: 'Gita Ismaya', role: 'Mengetahui' },
  { id: 'fricella', name: 'Fricella Siehendra', role: 'Menyetujui' },
  { id: 'memorianti', name: 'Memorianti Kaban', role: 'Menyetujui' },
  { id: 'fricio', name: 'Fricio Sinkiani', role: 'Menyetujui' },
];

export const BRANCHES = [
  'Semua Cabang',
  'Pusat',
  'Meruya',
  'Denpasar',
  'Surabaya',
];

export const COLUMNS: ColumnDef[] = [
  { key: 'namaPemasok', label: 'Nama Pemasok', type: 'text', wide: true, group: 'info' },
  { key: 'kategori', label: 'Kategori Barang', type: 'text', group: 'info' },
  { key: 'kodeBarang', label: 'Kode Barang', type: 'text', group: 'info' },
  { key: 'namaBarang', label: 'Nama Barang', type: 'text', wide: true, group: 'info' },
  { key: 'namaMerek', label: 'Nama Merek Barang', type: 'text', wide: true, group: 'info' },
  { key: 'kts', label: 'Kts (Semua Gudang)', type: 'number', group: 'inventory' },
  { key: 'avg2022', label: 'Avg Sales 2022', type: 'number', group: 'sales' },
  { key: 'avg2023', label: 'Avg Sales 2023', type: 'number', group: 'sales' },
  { key: 'avg2024', label: 'Avg 2024', type: 'number', group: 'sales' },
  { key: 'avg2025', label: 'Avg Sales 2025', type: 'number', group: 'sales' },
  { key: 'monthlyProjection2026', label: 'Monthly Sales Projection 2026', type: 'number', group: 'sales' },
  { key: 'appliedAverage2026', label: 'Applied Average 2026', type: 'number', group: 'sales' },
  { key: 'minQtyStock', label: 'Min Qty Stock', type: 'computed', group: 'inventory' },
  { key: 'targetStock', label: 'Target Stock', type: 'computed', group: 'inventory' },
  { key: 'safetyPercent', label: 'Safety (%)', type: 'number', group: 'inventory' },
  { key: 'leadTimeMonth', label: 'Lead Time (bln)', type: 'number', group: 'inventory' },
  { key: 'coveragePeriodMonth', label: 'Coverage (bln)', type: 'number', group: 'inventory' },
  { key: 'estReorderSchedule', label: 'Est Reorder Schedule', type: 'text', group: 'order' },
  { key: 'orderMultiple', label: 'Order Multiple (Pcs/Ctn)', type: 'number', group: 'order' },
  { key: 'shortage', label: 'Shortage (Qty - Min Qty)', type: 'computed', group: 'inventory' },
  { key: 'estOrderMaxQty', label: 'Est Order Max Qty', type: 'computed', group: 'order' },
  { key: 'orderRounding', label: 'Order Rounding (Pcs)', type: 'computed', group: 'order' },
  { key: 'totalCarton', label: 'Total Carton', type: 'computed', group: 'order' },
  { key: 'opsi2Carton', label: 'Opsi 2 (Carton)', type: 'number', group: 'order' },
  { key: 'opsi3Carton', label: 'Opsi 3 (Carton)', type: 'number', group: 'order' },
];

export function round2(num: number): number {
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}

export function getMinQty(it: Partial<StockItem>): number {
  const applied = Number(it.appliedAverage2026) || 0;
  const lead = Number(it.leadTimeMonth) || 0;
  return applied * lead * 1.3;
}

export function getTargetStock(it: Partial<StockItem>): number {
  const applied = Number(it.appliedAverage2026) || 0;
  const lead = Number(it.leadTimeMonth) || 0;
  const coverage = Number(it.coveragePeriodMonth) || 0;
  return applied * (lead + coverage) * 1.3;
}

export function getEstOrderMaxQty(it: Partial<StockItem>): number {
  const stok = Number(it.kts) || 0;
  return getTargetStock(it) - stok;
}

export function getOrderRounding(it: Partial<StockItem>): number {
  const estOrder = getEstOrderMaxQty(it);
  const multiple = Number(it.orderMultiple) || 0;
  if (!multiple) return estOrder;
  return Math.round(estOrder / multiple) * multiple;
}

export function getTotalCarton(it: Partial<StockItem>): number {
  const multiple = Number(it.orderMultiple) || 0;
  const rounding = getOrderRounding(it);
  if (!multiple) return rounding;
  return rounding / multiple;
}

export function getShortage(it: Partial<StockItem>): number {
  const stok = Number(it.kts) || 0;
  const minQty = getMinQty(it);
  return stok - minQty;
}

export function getComputedValue(key: keyof StockItem, it: Partial<StockItem>): number | string {
  switch (key) {
    case 'minQtyStock':
      return round2(getMinQty(it));
    case 'targetStock':
      return round2(getTargetStock(it));
    case 'estOrderMaxQty':
      return round2(getEstOrderMaxQty(it));
    case 'orderRounding':
      return round2(getOrderRounding(it));
    case 'totalCarton':
      return round2(getTotalCarton(it));
    case 'shortage':
      return round2(getShortage(it));
    default:
      return '';
  }
}

export function computeSubmissionStatus(sub: Submission): SubmissionStatus {
  const approvals = sub.approvals || {};
  const statuses = APPROVERS.map(a => approvals[a.id]?.status || 'pending');
  if (statuses.includes('rejected')) return 'rejected';
  if (statuses.every(s => s === 'approved')) return 'approved';
  return 'pending';
}

export function createEmptyItem(): StockItem {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    namaPemasok: '',
    kategori: '',
    kodeBarang: '',
    namaBarang: '',
    namaMerek: '',
    kts: '',
    avg2022: '',
    avg2023: '',
    avg2024: '',
    avg2025: '',
    monthlyProjection2026: '',
    appliedAverage2026: '',
    safetyPercent: 30,
    leadTimeMonth: 2,
    coveragePeriodMonth: 3,
    estReorderSchedule: '',
    orderMultiple: 12,
    opsi2Carton: '',
    opsi3Carton: '',
  };
}

export const SAMPLE_ITEMS: StockItem[] = [
  {
    id: 'sample-1',
    namaPemasok: 'PT Multi Cookware Indah',
    kategori: 'Kitchen Utensil',
    kodeBarang: 'FAS-KU-01',
    namaBarang: 'Deep Fryer Stainless 12L Commercial',
    namaMerek: 'Fasco Heavy Duty',
    kts: 14,
    avg2022: 25,
    avg2023: 30,
    avg2024: 38,
    avg2025: 42,
    monthlyProjection2026: 45,
    appliedAverage2026: 42,
    safetyPercent: 30,
    leadTimeMonth: 2,
    coveragePeriodMonth: 3,
    estReorderSchedule: 'Minggu ke-2 Nov 2026',
    orderMultiple: 6,
    opsi2Carton: 40,
    opsi3Carton: 45,
  },
  {
    id: 'sample-2',
    namaPemasok: 'Sanwira Refrigeration Global',
    kategori: 'Cooling Equipment',
    kodeBarang: 'FAS-CL-04',
    namaBarang: 'Under-Counter Chiller 2 Doors 350L',
    namaMerek: 'Sanwira Cold Pro',
    kts: 5,
    avg2022: 12,
    avg2023: 15,
    avg2024: 18,
    avg2025: 20,
    monthlyProjection2026: 22,
    appliedAverage2026: 20,
    safetyPercent: 30,
    leadTimeMonth: 2,
    coveragePeriodMonth: 2,
    estReorderSchedule: 'Akhir Oktober 2026',
    orderMultiple: 2,
    opsi2Carton: 35,
    opsi3Carton: 40,
  },
  {
    id: 'sample-3',
    namaPemasok: 'Mitra Logam Prima',
    kategori: 'Gastronorm Pan',
    kodeBarang: 'FAS-GN-11',
    namaBarang: 'GN Pan 1/1 Depth 100mm SS304',
    namaMerek: 'Fasco ProLine',
    kts: 120,
    avg2022: 180,
    avg2023: 200,
    avg2024: 210,
    avg2025: 240,
    monthlyProjection2026: 250,
    appliedAverage2026: 240,
    safetyPercent: 30,
    leadTimeMonth: 1.5,
    coveragePeriodMonth: 3,
    estReorderSchedule: 'Desember 2026',
    orderMultiple: 24,
    opsi2Carton: 50,
    opsi3Carton: 55,
  }
];
