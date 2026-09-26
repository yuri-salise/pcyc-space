'use client';

import React, { useState } from 'react';
import { Ruler, X, Info } from '@phosphor-icons/react';

const SIZE_CHART = [
  { size: 'XS', widthCm: '46 cm', lengthCm: '66 cm', widthIn: '18 in', lengthIn: '26 in' },
  { size: 'S', widthCm: '48 cm', lengthCm: '69 cm', widthIn: '19 in', lengthIn: '27 in' },
  { size: 'M', widthCm: '51 cm', lengthCm: '71 cm', widthIn: '20 in', lengthIn: '28 in' },
  { size: 'L', widthCm: '53 cm', lengthCm: '74 cm', widthIn: '21 in', lengthIn: '29 in' },
  { size: 'XL', widthCm: '56 cm', lengthCm: '76 cm', widthIn: '22 in', lengthIn: '30 in' },
  { size: '2XL', widthCm: '58 cm', lengthCm: '79 cm', widthIn: '23 in', lengthIn: '31 in' },
  { size: '3XL', widthCm: '61 cm', lengthCm: '81 cm', widthIn: '24 in', lengthIn: '32 in' },
];

export function ProductSizeGuideModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9a6423] dark:text-[#f0be7c] hover:underline"
      >
        <Ruler weight="bold" className="h-3.5 w-3.5" />
        <span>View Size Chart & Measurements</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] p-6 sm:p-8 shadow-2xl space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-[#fbf1e2] dark:bg-[#252e1f] text-[#e0a861] flex items-center justify-center">
                  <Ruler weight="duotone" className="h-5 w-5 text-[#9a6423] dark:text-[#f0be7c]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#2c3324] dark:text-[#fefcf1]">
                    Apparel Size Chart
                  </h3>
                  <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
                    Standard unisex comfort fit dimensions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#707666] transition-colors"
              >
                <X weight="bold" className="h-4 w-4" />
              </button>
            </div>

            {/* Unit Switcher */}
            <div className="flex items-center justify-end gap-1 text-xs">
              <span className="text-[#707666] mr-2">Unit:</span>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  unit === 'cm' ? 'bg-[#2c3324] text-[#fefcf1]' : 'bg-black/5 text-[#707666]'
                }`}
              >
                CM
              </button>
              <button
                type="button"
                onClick={() => setUnit('in')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  unit === 'in' ? 'bg-[#2c3324] text-[#fefcf1]' : 'bg-black/5 text-[#707666]'
                }`}
              >
                Inches
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#e6dfcb] dark:border-[#323d2b]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8f4e3] dark:bg-[#131710] text-[#2c3324] dark:text-[#fefcf1] font-bold border-b border-[#e6dfcb] dark:border-[#323d2b]">
                  <tr>
                    <th className="p-3">Size</th>
                    <th className="p-3">Chest Width</th>
                    <th className="p-3">Body Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6dfcb]/50 dark:divide-[#323d2b]/50 text-[#505748] dark:text-[#a3ab98]">
                  {SIZE_CHART.map((row) => (
                    <tr key={row.size} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-[#2c3324] dark:text-[#fefcf1]">{row.size}</td>
                      <td className="p-3">{unit === 'cm' ? row.widthCm : row.widthIn}</td>
                      <td className="p-3">{unit === 'cm' ? row.lengthCm : row.lengthIn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tip */}
            <div className="p-3.5 rounded-xl bg-[#f8f4e3] dark:bg-[#131710] border border-[#e6dfcb] dark:border-[#323d2b] flex items-start gap-2.5 text-xs text-[#707666] dark:text-[#a3ab98]">
              <Info weight="duotone" className="h-4 w-4 text-[#e0a861] shrink-0 mt-0.5" />
              <span>For an oversized aesthetic, we recommend ordering one size larger than your usual fit.</span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-[#2c3324] dark:bg-[#e0a861] text-[#fefcf1] dark:text-[#131710] font-bold text-xs shadow-md"
            >
              Close Size Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
