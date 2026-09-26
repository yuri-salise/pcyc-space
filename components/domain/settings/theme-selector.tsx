'use client';

import React, { useSyncExternalStore } from 'react';
import { useTheme, Theme } from '@/components/providers/theme-provider';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

const emptySubscribe = () => () => {};

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const options: {
    id: Theme;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'light',
      title: 'Warm Light Mode',
      description: 'Classic PCYC warm cream paper and deep forest green aesthetic.',
      icon: Sun,
    },
    {
      id: 'dark',
      title: 'Night Forest Dark',
      description: 'Deep midnight green and warm golden accents for low-light comfort.',
      icon: Moon,
    },
    {
      id: 'system',
      title: 'Sync with System',
      description: 'Automatically matches your computer or smartphone OS appearance.',
      icon: Laptop,
    },
  ];

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-32 rounded-2xl bg-[#f8f4e3] dark:bg-[#1d2419] border border-[#e6dfcb] dark:border-[#323d2b] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {options.map((opt) => {
        const isSelected = theme === opt.id;
        const Icon = opt.icon;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={`relative p-5 rounded-2xl text-left transition-all border flex flex-col justify-between group ${
              isSelected
                ? 'bg-white dark:bg-[#232c1e] border-[#e0a861] ring-2 ring-[#e0a861]/30 shadow-sm'
                : 'bg-[#f8f4e3]/60 dark:bg-[#1b2117] border-[#e6dfcb] dark:border-[#323d2b] hover:bg-white dark:hover:bg-[#20271c]'
            }`}
          >
            <div className="flex items-start justify-between w-full">
              <div
                className={`p-2.5 rounded-xl ${
                  isSelected
                    ? 'bg-[#2c3324] text-[#e0a861] dark:bg-[#e0a861] dark:text-[#131710]'
                    : 'bg-[#e6dfcb]/50 dark:bg-[#2c3725] text-[#505748] dark:text-[#a3ab98] group-hover:text-[#2c3324] dark:group-hover:text-[#fefcf1]'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {isSelected && (
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[#e0a861] text-[#2c3324]">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </span>
              )}
            </div>

            <div className="mt-4 space-y-1">
              <h4 className="font-serif font-bold text-sm text-[#2c3324] dark:text-[#fefcf1]">
                {opt.title}
              </h4>
              <p className="text-xs text-[#707666] dark:text-[#a3ab98] leading-relaxed">
                {opt.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
