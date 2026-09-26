'use client';

import React, { useState } from 'react';
import { Square, Suitcase, CheckCircle } from '@phosphor-icons/react';
import { InteractiveCard } from '@/components/ui/interactive-card';

const CHECKLIST_ITEMS = [
  { id: 'bible', label: 'Holy Bible & Scripture Notebook', desc: 'For lectures, workshops, and group circles' },
  { id: 'hymnal', label: 'Christadelphian Hymn Book / Praise App', desc: 'For morning devotions and choral praise' },
  { id: 'sunday-attire', label: 'Smart Attire for Sunday Memorial Service', desc: 'Modest formal wear for the Breaking of Bread service' },
  { id: 'casual', label: 'Casual Wear & Sports Attire', desc: 'Comfortable shirts, pants, and sneakers for sports and recreation' },
  { id: 'toiletries', label: 'Personal Toiletries & Medications', desc: 'Towel, soap, shampoo, and required personal prescriptions' },
  { id: 'jacket', label: 'Light Jacket or Sweater', desc: 'For air-conditioned lecture halls and cooler evenings' },
];

export function EventPrepChecklist({ checklist }: { checklist?: string[] | null }) {
  const isExplicitlyEmpty = Array.isArray(checklist) && checklist.length === 0;
  const hasDynamicItems = Array.isArray(checklist) && checklist.length > 0;

  const displayItems = hasDynamicItems
    ? checklist.map((item, idx) => ({ id: `item-${idx}`, label: item, desc: '' }))
    : isExplicitlyEmpty
    ? []
    : CHECKLIST_ITEMS;

  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const progress = displayItems.length > 0 ? Math.round((checkedIds.length / displayItems.length) * 100) : 0;

  return (
    <InteractiveCard className="p-7 sm:p-9 rounded-[2.5rem] bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[#fbf1e2] dark:bg-[#252e1f] text-[#e0a861] flex items-center justify-center shadow-xs">
            <Suitcase weight="duotone" className="h-6 w-6 text-[#9a6423] dark:text-[#f0be7c]" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-2xl text-[#2c3324] dark:text-[#fefcf1]">
              Delegate Packing Checklist
            </h3>
            <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
              Interactive checklist to ensure you are fully prepared for camp.
            </p>
          </div>
        </div>

        {/* Progress Badge */}
        {!isExplicitlyEmpty && (
          <div className="text-right shrink-0">
            <span className="font-serif font-bold text-xl text-[#9a6423] dark:text-[#f0be7c]">
              {progress}%
            </span>
            <span className="text-[10px] text-[#707666] dark:text-[#a3ab98] block">Packed</span>
          </div>
        )}
      </div>

      {isExplicitlyEmpty ? (
        <div className="p-6 text-center rounded-2xl bg-[#f8f4e3]/40 dark:bg-[#131710]/40 border border-[#e6dfcb] dark:border-[#323d2b] space-y-1">
          <p className="font-serif font-bold text-base text-[#2c3324] dark:text-[#fefcf1]">
            Standard Camp Guidelines
          </p>
          <p className="text-xs text-[#707666] dark:text-[#a3ab98] max-w-sm mx-auto">
            Please bring your Bible, notebook, and personal essentials. Specific items will be announced as needed.
          </p>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-[#f8f4e3] dark:bg-[#131710] rounded-full overflow-hidden border border-[#e6dfcb] dark:border-[#323d2b]">
            <div
              className="h-full bg-gradient-to-r from-[#e0a861] to-[#9a6423] transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {displayItems.map((item) => {
              const isChecked = checkedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                    isChecked
                      ? 'bg-[#fbf1e2]/80 dark:bg-[#252e1f]/80 border-[#e0a861]/60 text-[#2c3324] dark:text-[#fefcf1]'
                      : 'bg-[#f8f4e3]/40 dark:bg-[#131710]/40 border-[#e6dfcb] dark:border-[#323d2b] text-[#505748] dark:text-[#a3ab98] hover:border-[#e0a861]/40'
                  }`}
                >
                  {isChecked ? (
                    <CheckCircle weight="fill" className="h-5 w-5 text-[#9a6423] dark:text-[#f0be7c] shrink-0 mt-0.5" />
                  ) : (
                    <Square weight="bold" className="h-5 w-5 text-[#8a9180] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5 min-w-0">
                    <span className={`text-xs font-bold block ${isChecked ? 'line-through opacity-80' : ''}`}>
                      {item.label}
                    </span>
                    {item.desc && (
                      <span className="text-[11px] text-[#707666] dark:text-[#a3ab98] leading-tight block truncate">
                        {item.desc}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </InteractiveCard>
  );
}
