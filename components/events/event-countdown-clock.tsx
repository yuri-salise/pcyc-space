'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { HourglassMedium, CalendarCheck } from '@phosphor-icons/react';

interface EventCountdownClockProps {
  startDate: string | Date;
  status: string;
}

export function EventCountdownClock({ startDate, status }: EventCountdownClockProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const target = new Date(startDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  if (timeLeft.isPast || status === 'COMPLETED') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 dark:bg-black/30 border border-white/15 backdrop-blur-md text-xs font-semibold text-[#fefcf1]">
        <CalendarCheck weight="fill" className="h-4 w-4 text-[#e0a861]" />
        <span>Gathering Completed & Concluded</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-black/30 dark:bg-black/50 border border-white/15 backdrop-blur-md shadow-2xl max-w-xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e0a861]">
          <HourglassMedium weight="fill" className="h-3.5 w-3.5 animate-pulse" />
          <span>Gathering Countdown</span>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#e0a861]/20 text-[#fefcf1] border border-[#e0a861]/30">
          Live Clock
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Mins', value: timeLeft.minutes },
          { label: 'Secs', value: timeLeft.seconds },
        ].map((unit, idx) => (
          <div
            key={idx}
            className="p-2 sm:p-3 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/10 flex flex-col items-center justify-center"
          >
            <motion.span
              key={unit.value}
              initial={{ opacity: 0.8, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-[#fefcf1] tracking-tight leading-none"
            >
              {String(unit.value).padStart(2, '0')}
            </motion.span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#e0a861] mt-1">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
