'use client';

import React, { useSyncExternalStore } from 'react';
import { useTheme } from '@/components/providers/theme-provider';
import { Sun, Moon } from 'lucide-react';

const emptySubscribe = () => () => {};

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl p-2 text-[#707666] dark:text-[#a3ab98] bg-[#f8f4e3] dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] opacity-50 ${className}`}
        aria-hidden="true"
      >
        <span className="h-4 w-4" />
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center rounded-xl transition-all ${
        size === 'sm' ? 'p-1.5' : 'p-2'
      } ${
        isDark
          ? 'bg-[#232c1e] text-[#e0a861] hover:bg-[#2c3725] border border-[#38452f]'
          : 'bg-[#f8f4e3] text-[#2c3324] hover:bg-[#efe8d0] border border-[#e6dfcb]'
      } focus:outline-none focus:ring-2 focus:ring-[#e0a861] shadow-2xs ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} transition-transform hover:rotate-45`} />
      ) : (
        <Moon className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} transition-transform hover:-rotate-12`} />
      )}
    </button>
  );
}
