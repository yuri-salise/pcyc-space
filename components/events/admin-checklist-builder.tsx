'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Luggage } from 'lucide-react';

interface AdminChecklistBuilderProps {
  initialChecklist?: string[] | string | null;
}

const SUGGESTED_CHECKLIST: string[] = [
  'Holy Bible & Scripture Study Notebook',
  'Christadelphian Hymn Book / Praise App',
  'Smart Formal Attire for Sunday Memorial Service',
  'Casual Wear & Sports Attire for Outdoor Games',
  'Personal Toiletries & Required Medications',
  'Light Jacket or Sweater for Evening Fellowship',
];

const QUICK_CHIPS: string[] = [
  'Holy Bible',
  'Study Notebook & Pens',
  'Sunday Formal Attire',
  'Casual Clothes & Sneakers',
  'Personal Toiletries',
  'Sleeping Bag / Bedding',
  'Light Jacket / Hoodie',
  'Personal Prescriptions / Meds',
  'Water Bottle',
  'Flashlight',
];

export function AdminChecklistBuilder({ initialChecklist }: AdminChecklistBuilderProps) {
  const [checklist, setChecklist] = useState<string[]>(() => {
    if (Array.isArray(initialChecklist)) {
      return initialChecklist;
    }
    if (typeof initialChecklist === 'string') {
      try {
        const parsed = JSON.parse(initialChecklist);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const addItem = (customValue = '') => {
    setChecklist((prev) => [...prev, customValue]);
  };

  const loadTemplate = () => {
    setChecklist([...SUGGESTED_CHECKLIST]);
  };

  const clearAll = () => {
    setChecklist([]);
  };

  const removeItem = (index: number) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setChecklist((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveDown = (index: number) => {
    setChecklist((prev) => {
      if (index >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const updateItem = (index: number, value: string) => {
    setChecklist((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      {/* Hidden serialization input for FormData submission */}
      <input type="hidden" name="checklist" value={JSON.stringify(checklist)} />

      {/* Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6dfcb] dark:border-[#323d2b]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Luggage className="h-4 w-4 text-[#e0a861]" />
            <h4 className="text-sm font-bold text-[#2c3324] dark:text-[#fefcf1]">
              Delegate Packing Checklist
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-[#e0a861]/15 text-[#9a6423] dark:text-[#f0be7c]">
              {checklist.length} item{checklist.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
            Items that youth delegates and visitors should pack for this camp.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {checklist.length === 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadTemplate}
              className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-[#e0a861]/50 text-[#9a6423] dark:text-[#f0be7c] hover:bg-[#e0a861]/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Load Suggested Checklist</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-8 text-xs font-semibold text-[#c0392b] hover:bg-[#fdf2f2] dark:hover:bg-[#2d1815] rounded-xl"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              <span>Clear All</span>
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => addItem()}
            className="h-8 text-xs font-bold gap-1.5 rounded-xl shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Item</span>
          </Button>
        </div>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#707666] dark:text-[#a3ab98] block">
          Quick-Add Common Items:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_CHIPS.map((chip) => {
            const alreadyAdded = checklist.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  if (!alreadyAdded) addItem(chip);
                }}
                disabled={alreadyAdded}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                  alreadyAdded
                    ? 'bg-[#e6dfcb]/50 dark:bg-[#323d2b]/50 text-[#707666] dark:text-[#a3ab98] opacity-50 cursor-default'
                    : 'bg-[#f8f4e3] dark:bg-[#252e1f] border border-[#e6dfcb] dark:border-[#323d2b] text-[#2c3324] dark:text-[#fefcf1] hover:border-[#e0a861] hover:text-[#9a6423] dark:hover:text-[#f0be7c]'
                }`}
              >
                {alreadyAdded ? '✓' : '+'} {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Checklist Items List */}
      <div className="space-y-2 pt-1">
        {checklist.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#1b2117] transition-all hover:border-[#e0a861]/60"
          >
            <span className="text-xs font-mono font-bold text-[#9a6423] dark:text-[#f0be7c] w-6 text-center shrink-0">
              {index + 1}.
            </span>

            <Input
              placeholder="e.g. Holy Bible and Notebook"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              className="h-8 text-xs flex-1 border-transparent focus:border-[#e0a861] bg-transparent"
              required
            />

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveUp(index)}
                title="Move Up"
                className="p-1 rounded-lg text-[#707666] hover:text-[#2c3324] dark:hover:text-[#fefcf1] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={index === checklist.length - 1}
                onClick={() => moveDown(index)}
                title="Move Down"
                className="p-1 rounded-lg text-[#707666] hover:text-[#2c3324] dark:hover:text-[#fefcf1] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                title="Remove this item"
                className="p-1 rounded-lg text-[#c0392b] hover:bg-[#fdf2f2] dark:hover:bg-[#2d1815] transition-colors ml-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {checklist.length === 0 && (
          <div className="text-center py-6 px-4 rounded-2xl border-2 border-dashed border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/30 dark:bg-[#1b2117]/30 space-y-2">
            <p className="text-xs font-bold text-[#2c3324] dark:text-[#fefcf1]">
              No Packing Checklist Items
            </p>
            <p className="text-[11px] text-[#707666] dark:text-[#a3ab98] max-w-xs mx-auto leading-relaxed">
              You can click any quick-add chip above or load the suggested camp checklist.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
