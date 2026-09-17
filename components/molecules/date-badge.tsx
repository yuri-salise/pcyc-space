import React from 'react';
import { cn, formatDateForDateInput } from '@/lib/utils';

export interface DateBadgeProps {
  date: Date | string;
  className?: string;
}

export function DateBadge({ date, className }: DateBadgeProps) {
  const dateParts = formatDateForDateInput(date).split('-').map(Number);
  const [year, monthNumber, day] = dateParts;
  const month = Number.isFinite(monthNumber)
    ? new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
        .format(new Date(Date.UTC(year, monthNumber - 1, day)))
        .toUpperCase()
    : '';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] text-center shadow-xs overflow-hidden shrink-0',
        className
      )}
    >
      <span className="w-full bg-[#2c3324] dark:bg-[#20271c] text-[10px] font-bold text-[#fefcf1] py-0.5 tracking-wider">
        {month}
      </span>
      <span className="text-sm font-bold text-[#2c3324] dark:text-[#fefcf1] leading-none py-1">
        {Number.isFinite(day) ? day : ''}
      </span>
    </div>
  );
}
