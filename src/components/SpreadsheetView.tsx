import React from 'react';
import { StockItem } from '../types';
import { COLUMNS, getComputedValue, getShortage } from '../utils/calculations';
import { fmtNumber } from '../utils/formatters';

interface SpreadsheetViewProps {
  items: StockItem[];
  canEditOptions?: boolean;
  onOptionsChange?: (itemId: string, field: 'opsi2Carton' | 'opsi3Carton', value: string) => void;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  items,
  canEditOptions,
  onOptionsChange,
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Tampilan Tabel Lengkap (25 Kolom)
        </span>
        <span className="text-[11px] text-slate-400">
          Geser ke kanan untuk melihat semua kolom &rarr;
        </span>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-left border-collapse text-[11px] font-sans whitespace-nowrap min-w-[2000px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
              <th className="py-2 px-2.5 text-center sticky left-0 bg-slate-100 dark:bg-slate-800 z-10 w-10 border-r border-slate-200 dark:border-slate-700">
                No
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`py-2 px-3 border-r border-slate-200 dark:border-slate-700 ${
                    col.type === 'number' || col.type === 'computed' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
            {items.map((it, idx) => {
              const shortage = getShortage(it);
              const isShortage = shortage < 0;

              return (
                <tr 
                  key={it.id || idx}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  <td className="py-2 px-2.5 text-center font-bold text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800">
                    {idx + 1}
                  </td>
                  {COLUMNS.map((col) => {
                    const isNum = col.type === 'number' || col.type === 'computed';

                    if (col.type === 'computed') {
                      const val = getComputedValue(col.key, it);
                      const isShortageCell = col.key === 'shortage' && isShortage;
                      const isRoundingCell = col.key === 'orderRounding';

                      return (
                        <td
                          key={col.key}
                          className={`py-2 px-3 text-right border-r border-slate-100 dark:border-slate-800 ${
                            isShortageCell
                              ? 'text-rose-600 dark:text-rose-400 font-bold bg-rose-50/50 dark:bg-rose-950/20'
                              : isRoundingCell
                              ? 'font-bold text-[#20295f] dark:text-sky-300 bg-sky-50/30'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {fmtNumber(val)}
                        </td>
                      );
                    }

                    // Editable option inputs
                    if (canEditOptions && (col.key === 'opsi2Carton' || col.key === 'opsi3Carton')) {
                      return (
                        <td key={col.key} className="py-1 px-2 border-r border-slate-100 dark:border-slate-800">
                          <input
                            type="number"
                            value={it[col.key] || ''}
                            onChange={(e) => onOptionsChange?.(it.id, col.key as any, e.target.value)}
                            className="w-20 text-right px-2 py-1 rounded border border-sky-400 bg-white dark:bg-slate-800 font-mono text-xs font-bold"
                            placeholder="—"
                          />
                        </td>
                      );
                    }

                    const rawVal = it[col.key];
                    return (
                      <td
                        key={col.key}
                        className={`py-2 px-3 border-r border-slate-100 dark:border-slate-800 ${
                          isNum ? 'text-right' : 'text-left font-sans'
                        }`}
                      >
                        {isNum ? fmtNumber(rawVal) : (rawVal || '—')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
