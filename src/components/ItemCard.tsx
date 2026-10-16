import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  ShieldAlert, 
  Truck, 
  PackageCheck,
  Check
} from 'lucide-react';
import { StockItem, UserRoleId } from '../types';
import { 
  getMinQty, 
  getTargetStock, 
  getShortage, 
  getEstOrderMaxQty, 
  getOrderRounding, 
  getTotalCarton, 
  round2 
} from '../utils/calculations';
import { fmtNumber, triggerHaptic } from '../utils/formatters';

interface ItemCardProps {
  item: StockItem;
  index: number;
  canEditFull?: boolean;
  canEditOptions?: boolean;
  onEdit?: (item: StockItem) => void;
  onDelete?: (id: string) => void;
  onOptionsUpdate?: (itemId: string, opsi2: number | string, opsi3: number | string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  index,
  canEditFull,
  canEditOptions,
  onEdit,
  onDelete,
  onOptionsUpdate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [opsi2Val, setOpsi2Val] = useState<string>(item.opsi2Carton?.toString() || '');
  const [opsi3Val, setOpsi3Val] = useState<string>(item.opsi3Carton?.toString() || '');
  const [isSavingOptions, setIsSavingOptions] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Real-time calculated values
  const minQty = round2(getMinQty(item));
  const targetStock = round2(getTargetStock(item));
  const shortage = round2(getShortage(item));
  const estOrder = round2(getEstOrderMaxQty(item));
  const orderRounding = round2(getOrderRounding(item));
  const totalCarton = round2(getTotalCarton(item));
  const isShortage = shortage < 0;

  const handleSaveOptions = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onOptionsUpdate) return;
    triggerHaptic(15);
    setIsSavingOptions(true);
    await onOptionsUpdate(item.id, opsi2Val, opsi3Val);
    setIsSavingOptions(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 shadow-xs transition ${
      isShortage 
        ? 'border-amber-300 dark:border-amber-900/60 ring-1 ring-amber-300/40' 
        : 'border-slate-200 dark:border-slate-800'
    }`}>
      {/* Top Banner if shortage is negative */}
      {isShortage && (
        <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/80 text-[11px] font-semibold flex items-center justify-between mb-2.5">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>Shortage Stok ({shortage}): Stok di bawah batas minimum!</span>
          </span>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
            {shortage}
          </span>
        </div>
      )}

      {/* Main Bar: Number, Name, Supplier, and Expand Chevron */}
      <div 
        onClick={() => { triggerHaptic(8); setIsExpanded(!isExpanded); }}
        className="cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              {index + 1}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                {item.namaBarang || 'Tanpa Nama Barang'}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                {item.kodeBarang && (
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-semibold text-slate-700 dark:text-slate-300">
                    {item.kodeBarang}
                  </span>
                )}
                {item.namaMerek && <span>&bull; {item.namaMerek}</span>}
                {item.kategori && <span className="text-slate-400">&bull; {item.kategori}</span>}
              </div>
            </div>
          </div>

          <button 
            type="button" 
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg flex-shrink-0"
            aria-label="Buka Rincian"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Essential 4-Grid Key Metrics */}
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-center font-mono">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-[9px] text-slate-400 font-sans">Kts (Stok)</div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
              {fmtNumber(item.kts)}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-[9px] text-slate-400 font-sans">Min Qty</div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              {fmtNumber(minQty)}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg border border-blue-200 dark:border-blue-900/60">
            <div className="text-[9px] text-blue-600 dark:text-blue-300 font-sans font-semibold">Order Rnd</div>
            <div className="text-xs font-bold text-blue-900 dark:text-blue-200 mt-0.5">
              {fmtNumber(orderRounding)}
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60">
            <div className="text-[9px] text-indigo-600 dark:text-indigo-300 font-sans font-semibold">Total Ctn</div>
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mt-0.5">
              {fmtNumber(totalCarton)}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details Sections */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-slide-down">
          {/* Section 1: Supplier & Identity */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl text-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <PackageCheck className="w-3 h-3" />
              <span>Pemasok & Identitas Barang</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-slate-400 text-[11px]">Nama Pemasok:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.namaPemasok || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Merek:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.namaMerek || '—'}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Sales History & 2026 Projection */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl text-xs space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-500" />
              <span>Riwayat Penjualan & Proyeksi 2026</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-center">
              <div className="bg-white dark:bg-slate-900 p-1 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Avg 2022</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{fmtNumber(item.avg2022)}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Avg 2023</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{fmtNumber(item.avg2023)}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Avg 2024</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{fmtNumber(item.avg2024)}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Avg 2025</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{fmtNumber(item.avg2025)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Monthly Proj 2026</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{fmtNumber(item.monthlyProjection2026)}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Applied Avg 2026</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{fmtNumber(item.appliedAverage2026)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Inventory Parameters & Targets */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl text-xs space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              <span>Parameter Lead Time & Target Stok</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-center">
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Lead Time</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{fmtNumber(item.leadTimeMonth)} bln</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Coverage</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{fmtNumber(item.coveragePeriodMonth)} bln</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Safety</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{fmtNumber(item.safetyPercent)}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Target Stock Formula</span>
                <span className="font-bold text-slate-900 dark:text-white">{fmtNumber(targetStock)}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Est Order Max Qty</span>
                <span className="font-bold text-slate-900 dark:text-white">{fmtNumber(estOrder)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Order Carton Options & Approver Options */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl text-xs space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-indigo-500" />
                <span>Opsi Karton & Multiplier</span>
              </span>
              {item.estReorderSchedule && (
                <span className="text-[10px] text-slate-500 font-normal">
                  Jadwal: {item.estReorderSchedule}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block font-sans">Multiple (Pcs/Ctn)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{fmtNumber(item.orderMultiple)}</span>
              </div>

              {canEditOptions ? (
                <>
                  <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-sky-400 dark:border-sky-500">
                    <label className="text-[9px] text-sky-600 dark:text-sky-400 block font-sans font-bold">Opsi 2 Ctn</label>
                    <input
                      type="number"
                      value={opsi2Val}
                      onChange={(e) => setOpsi2Val(e.target.value)}
                      className="w-full text-center font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                      placeholder="—"
                    />
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-sky-400 dark:border-sky-500">
                    <label className="text-[9px] text-sky-600 dark:text-sky-400 block font-sans font-bold">Opsi 3 Ctn</label>
                    <input
                      type="number"
                      value={opsi3Val}
                      onChange={(e) => setOpsi3Val(e.target.value)}
                      className="w-full text-center font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                      placeholder="—"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block font-sans">Opsi 2 (Carton)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{fmtNumber(item.opsi2Carton)}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block font-sans">Opsi 3 (Carton)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{fmtNumber(item.opsi3Carton)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Approver quick save button for Opsi 2 & 3 */}
            {canEditOptions && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveOptions}
                  disabled={isSavingOptions}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs active:scale-95 transition"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Tersimpan</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSavingOptions ? 'Menyimpan...' : 'Simpan Opsi 2 & 3'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Full Item Edit/Delete Actions for Pengaju */}
          {canEditFull && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); triggerHaptic(); onDelete(item.id); }}
                  className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); triggerHaptic(); onEdit(item); }}
                  className="px-3 py-1.5 bg-[#20295f] hover:bg-[#18204b] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah Data</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
