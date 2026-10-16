import React, { useState } from 'react';
import { X, Check, Calculator, Sparkles, AlertTriangle } from 'lucide-react';
import { StockItem } from '../types';
import { 
  getMinQty, 
  getTargetStock, 
  getShortage, 
  getEstOrderMaxQty, 
  getOrderRounding, 
  getTotalCarton, 
  round2,
  SAMPLE_ITEMS 
} from '../utils/calculations';
import { fmtNumber, triggerHaptic } from '../utils/formatters';

interface ItemSheetEditorProps {
  initialItem?: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: StockItem) => void;
}

export const ItemSheetEditor: React.FC<ItemSheetEditorProps> = ({
  initialItem,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<StockItem>(() => {
    return initialItem || {
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
  });

  const [activeTab, setActiveTab] = useState<'info' | 'sales' | 'inventory'>('info');

  if (!isOpen) return null;

  const handleChange = (field: keyof StockItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Live computed metrics
  const minQty = round2(getMinQty(formData));
  const targetStock = round2(getTargetStock(formData));
  const shortage = round2(getShortage(formData));
  const estOrder = round2(getEstOrderMaxQty(formData));
  const orderRounding = round2(getOrderRounding(formData));
  const totalCarton = round2(getTotalCarton(formData));
  const isShortage = shortage < 0;

  const handleApplyTemplate = (tmpl: StockItem) => {
    triggerHaptic(15);
    setFormData({
      ...tmpl,
      id: formData.id,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaBarang.trim()) {
      alert('Nama Barang wajib diisi.');
      return;
    }
    triggerHaptic(20);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {initialItem ? 'Ubah Rincian Barang' : 'Tambah Barang Baru'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Formulir terintegrasi kalkulasi pengajuan stok otomatis
            </p>
          </div>
          <button
            type="button"
            onClick={() => { triggerHaptic(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Calculation Floating Ribbon */}
        <div className="bg-[#18204b] text-white px-4 py-2 flex items-center justify-between text-xs font-mono shadow-inner">
          <div className="flex items-center gap-1.5 font-sans font-semibold text-[11px] text-sky-200">
            <Calculator className="w-3.5 h-3.5 text-sky-400" />
            <span>Hasil Kalkulasi:</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <div>
              <span className="text-slate-400 text-[9px] block">Shortage:</span>
              <span className={`font-bold ${isShortage ? 'text-amber-300' : 'text-emerald-300'}`}>
                {fmtNumber(shortage)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] block">Order Rnd:</span>
              <span className="font-bold text-sky-300">{fmtNumber(orderRounding)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] block">Total Ctn:</span>
              <span className="font-bold text-white">{fmtNumber(totalCarton)}</span>
            </div>
          </div>
        </div>

        {/* Quick Template Picker for rapid data entry */}
        {!initialItem && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Contoh:</span>
            </span>
            {SAMPLE_ITEMS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleApplyTemplate(s)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 whitespace-nowrap active:scale-95"
              >
                {s.namaBarang.slice(0, 16)}...
              </button>
            ))}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 pt-1 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => { triggerHaptic(8); setActiveTab('info'); }}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 text-center transition ${
              activeTab === 'info'
                ? 'border-[#20295f] dark:border-sky-400 text-[#20295f] dark:text-sky-400'
                : 'border-transparent text-slate-400'
            }`}
          >
            1. Info Barang
          </button>
          <button
            type="button"
            onClick={() => { triggerHaptic(8); setActiveTab('sales'); }}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 text-center transition ${
              activeTab === 'sales'
                ? 'border-[#20295f] dark:border-sky-400 text-[#20295f] dark:text-sky-400'
                : 'border-transparent text-slate-400'
            }`}
          >
            2. Penjualan & Stok
          </button>
          <button
            type="button"
            onClick={() => { triggerHaptic(8); setActiveTab('inventory'); }}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 text-center transition ${
              activeTab === 'inventory'
                ? 'border-[#20295f] dark:border-sky-400 text-[#20295f] dark:text-sky-400'
                : 'border-transparent text-slate-400'
            }`}
          >
            3. Parameter Order
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {activeTab === 'info' && (
            <div className="space-y-3 animate-slide-down">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Barang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaBarang}
                  onChange={(e) => handleChange('namaBarang', e.target.value)}
                  placeholder="Contoh: Deep Fryer Stainless 12L Commercial"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kode Barang
                  </label>
                  <input
                    type="text"
                    value={formData.kodeBarang}
                    onChange={(e) => handleChange('kodeBarang', e.target.value)}
                    placeholder="Contoh: FAS-KU-01"
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kategori Barang
                  </label>
                  <input
                    type="text"
                    value={formData.kategori}
                    onChange={(e) => handleChange('kategori', e.target.value)}
                    placeholder="Contoh: Kitchen Utensil"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Pemasok
                  </label>
                  <input
                    type="text"
                    value={formData.namaPemasok}
                    onChange={(e) => handleChange('namaPemasok', e.target.value)}
                    placeholder="Contoh: PT Multi Cookware Indah"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Merek
                  </label>
                  <input
                    type="text"
                    value={formData.namaMerek}
                    onChange={(e) => handleChange('namaMerek', e.target.value)}
                    placeholder="Contoh: Fasco ProLine"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-3 animate-slide-down">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Kts (Semua Gudang / Stok Fisik Saat Ini)
                </label>
                <input
                  type="number"
                  value={formData.kts}
                  onChange={(e) => handleChange('kts', e.target.value)}
                  placeholder="0"
                  className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Rata-rata Penjualan Historis
                </span>
                <div className="grid grid-cols-4 gap-2 font-mono">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Avg 2022</label>
                    <input
                      type="number"
                      value={formData.avg2022}
                      onChange={(e) => handleChange('avg2022', e.target.value)}
                      placeholder="0"
                      className="w-full text-xs text-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Avg 2023</label>
                    <input
                      type="number"
                      value={formData.avg2023}
                      onChange={(e) => handleChange('avg2023', e.target.value)}
                      placeholder="0"
                      className="w-full text-xs text-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Avg 2024</label>
                    <input
                      type="number"
                      value={formData.avg2024}
                      onChange={(e) => handleChange('avg2024', e.target.value)}
                      placeholder="0"
                      className="w-full text-xs text-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Avg 2025</label>
                    <input
                      type="number"
                      value={formData.avg2025}
                      onChange={(e) => handleChange('avg2025', e.target.value)}
                      placeholder="0"
                      className="w-full text-xs text-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Monthly Sales Proj 2026
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyProjection2026}
                    onChange={(e) => handleChange('monthlyProjection2026', e.target.value)}
                    placeholder="0"
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Applied Average 2026
                  </label>
                  <input
                    type="number"
                    value={formData.appliedAverage2026}
                    onChange={(e) => handleChange('appliedAverage2026', e.target.value)}
                    placeholder="0"
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-3 animate-slide-down">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Lead Time (bln)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.leadTimeMonth}
                    onChange={(e) => handleChange('leadTimeMonth', e.target.value)}
                    placeholder="2"
                    className="w-full text-xs font-mono p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Coverage (bln)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.coveragePeriodMonth}
                    onChange={(e) => handleChange('coveragePeriodMonth', e.target.value)}
                    placeholder="3"
                    className="w-full text-xs font-mono p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Safety (%)
                  </label>
                  <input
                    type="number"
                    value={formData.safetyPercent}
                    onChange={(e) => handleChange('safetyPercent', e.target.value)}
                    placeholder="30"
                    className="w-full text-xs font-mono p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Order Multiple (Pcs/Ctn)
                  </label>
                  <input
                    type="number"
                    value={formData.orderMultiple}
                    onChange={(e) => handleChange('orderMultiple', e.target.value)}
                    placeholder="12"
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Est Reorder Schedule
                  </label>
                  <input
                    type="text"
                    value={formData.estReorderSchedule}
                    onChange={(e) => handleChange('estReorderSchedule', e.target.value)}
                    placeholder="Contoh: Nov 2026"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Opsi 2 Carton (Opsional)
                  </label>
                  <input
                    type="number"
                    value={formData.opsi2Carton}
                    onChange={(e) => handleChange('opsi2Carton', e.target.value)}
                    placeholder="—"
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Opsi 3 Carton (Opsional)
                  </label>
                  <input
                    type="number"
                    value={formData.opsi3Carton}
                    onChange={(e) => handleChange('opsi3Carton', e.target.value)}
                    placeholder="—"
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action buttons inside form */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { triggerHaptic(); onClose(); }}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#20295f] hover:bg-[#18204b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950/20 active:scale-95 transition"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Barang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
