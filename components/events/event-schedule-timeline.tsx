'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Sparkle, BookOpen, MusicNotes, UsersThree, Coffee, Heart } from '@phosphor-icons/react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { formatDateForDateInput } from '@/lib/utils';

export interface ScheduleItem {
  day?: string;
  time: string;
  title: string;
  description: string;
}

interface EventScheduleTimelineProps {
  schedule?: ScheduleItem[] | string | null;
  startDate?: Date | string;
}

/**
 * Parses time string (e.g. "8:30 AM – 11:30 AM", "1:00 PM", "14:30") into minutes from midnight for chronological ordering.
 */
function parseTimeMinutes(timeStr: string): number {
  if (!timeStr) return 9999;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 9999;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3]?.toUpperCase();

  if (meridian === 'PM' && hours < 12) hours += 12;
  if (meridian === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Intelligently assigns appropriate spiritual and fellowship icons based on session content.
 */
function getSessionIcon(title: string, desc: string, time: string) {
  const text = `${title} ${desc}`.toLowerCase();
  if (/breakfast|lunch|dinner|meal|coffee|snack|tea|food|refreshment/i.test(text)) return Coffee;
  if (/praise|hymn|sing|choir|song|music|anthem/i.test(text)) return MusicNotes;
  if (/memorial|bread|communion|worship|breaking of bread/i.test(text)) return Heart;
  if (/study|lecture|bible|exhort|scriptur|class|textual|q&a|workshop/i.test(text)) return BookOpen;
  if (/sport|game|fellowship|recreation|volleyball|basketball|circle|trivia|activity/i.test(text)) return UsersThree;
  if (/morning|sunrise/i.test(text) || /\bAM\b/i.test(time)) return Sun;
  if (/night|evening|curfew|lights out|campfire/i.test(text) || /\bPM\b/i.test(time)) return Moon;
  return Sparkle;
}

function getDayDateSubtitle(startDate: Date | string | undefined, dayIndex: number): string | null {
  if (!startDate) return null;
  const dateStr = formatDateForDateInput(startDate);
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

  const [sy, sm, sd] = dateStr.split('-').map(Number);
  const target = new Date(Date.UTC(sy, sm - 1, sd + dayIndex));
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(target);
}

export function EventScheduleTimeline({ schedule, startDate }: EventScheduleTimelineProps) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const parsedSchedule = React.useMemo<ScheduleItem[] | null>(() => {
    if (Array.isArray(schedule)) return schedule;
    if (typeof schedule === 'string') {
      try {
        const parsed = JSON.parse(schedule);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return null;
  }, [schedule]);

  const hasDynamicSchedule = Array.isArray(parsedSchedule) && parsedSchedule.length > 0;

  const displaySchedule = React.useMemo(() => {
    if (!hasDynamicSchedule || !parsedSchedule) {
      return [];
    }

    const hasDays = parsedSchedule.some((s) => s.day && s.day.trim().length > 0);
    if (!hasDays) {
      const dateStr = getDayDateSubtitle(startDate, 0);
      const sortedEvents = [...parsedSchedule].sort((a, b) => parseTimeMinutes(a.time) - parseTimeMinutes(b.time));
      return [
        {
          day: 'Itinerary',
          title: 'Event Schedule & Timetable',
          subtitle: dateStr ? `${dateStr} • Official gathering sessions` : 'Official gathering sessions and timetable',
          events: sortedEvents.map((s) => ({
            time: s.time,
            title: s.title,
            desc: s.description,
            icon: getSessionIcon(s.title, s.description, s.time),
          })),
        },
      ];
    }

    // Group by Day key preserving numerical/natural order
    const dayMap = new Map<string, ScheduleItem[]>();
    for (const item of parsedSchedule) {
      const dayKey = (item.day && item.day.trim()) || 'Day 01';
      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, []);
      }
      dayMap.get(dayKey)!.push(item);
    }

    const sortedDayKeys = Array.from(dayMap.keys()).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    return sortedDayKeys.map((dayKey, idx) => {
      const items = dayMap.get(dayKey)!;
      // Sort sessions chronologically within each day
      const sortedItems = [...items].sort((a, b) => parseTimeMinutes(a.time) - parseTimeMinutes(b.time));
      const match = dayKey.match(/\d+/);
      const dayOffset = match ? Math.max(0, parseInt(match[0], 10) - 1) : idx;
      const dateStr = getDayDateSubtitle(startDate, dayOffset);

      return {
        day: dayKey,
        title: `${dayKey} Itinerary`,
        subtitle: dateStr ? `${dateStr} • Official gathering sessions` : `Official gathering sessions for ${dayKey}`,
        events: sortedItems.map((s) => ({
          time: s.time,
          title: s.title,
          desc: s.description,
          icon: getSessionIcon(s.title, s.description, s.time),
        })),
      };
    });
  }, [hasDynamicSchedule, parsedSchedule, startDate]);

  const safeDayIndex = activeDayIndex < displaySchedule.length ? activeDayIndex : 0;
  const activeDay = displaySchedule[safeDayIndex] || displaySchedule[0];

  return (
    <InteractiveCard className="p-7 sm:p-10 rounded-[2.5rem] bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-xl space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[#e6dfcb]/60 dark:border-[#323d2b]/60">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#9a6423] dark:text-[#f0be7c] px-3 py-1 rounded-full bg-[#e0a861]/15 border border-[#e0a861]/30">
            Camp Itinerary
          </span>
          <h3 className="font-serif font-bold text-2xl sm:text-3xl text-[#2c3324] dark:text-[#fefcf1] mt-2">
            Gathering Schedule & Highlights
          </h3>
        </div>

        {/* Day Tab Pills */}
        {hasDynamicSchedule && displaySchedule.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-[#f8f4e3] dark:bg-[#131710] rounded-2xl">
            {displaySchedule.map((day, idx) => {
              const isSelected = activeDayIndex === idx;
              return (
                <button
                  key={day.day}
                  type="button"
                  onClick={() => setActiveDayIndex(idx)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 z-10 select-none ${
                    isSelected
                      ? 'text-[#fefcf1] dark:text-[#131710] font-bold'
                      : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1]'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeScheduleDayTab"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-[#2c3324] dark:bg-[#e0a861] rounded-xl z-[-1] shadow-xs"
                    />
                  )}
                  <span>{day.day}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!hasDynamicSchedule || !activeDay ? (
        <div className="p-8 text-center rounded-2xl bg-[#f8f4e3]/40 dark:bg-[#131710]/40 border border-[#e6dfcb] dark:border-[#323d2b] space-y-2">
          <p className="font-serif font-bold text-lg text-[#2c3324] dark:text-[#fefcf1]">
            Itinerary Under Preparation
          </p>
          <p className="text-xs sm:text-sm text-[#707666] dark:text-[#a3ab98] max-w-md mx-auto leading-relaxed">
            The detailed hour-by-hour program and study lectures for this gathering will be published closer to the camp date.
          </p>
        </div>
      ) : (
        <>
          {/* Subtitle */}
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-xl text-[#2c3324] dark:text-[#fefcf1]">
              {activeDay.title}
            </h4>
            <p className="text-xs sm:text-sm text-[#707666] dark:text-[#a3ab98]">
              {activeDay.subtitle}
            </p>
          </div>

          {/* Events Timeline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay.day}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {activeDay.events.map((event, idx) => {
                const EventIcon = event.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-[#f8f4e3]/60 dark:bg-[#131710]/60 border border-[#e6dfcb] dark:border-[#323d2b] flex items-start gap-4 hover:border-[#e0a861]/60 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-[#fbf1e2] dark:bg-[#252e1f] text-[#e0a861] flex items-center justify-center shrink-0 shadow-xs">
                      <EventIcon weight="duotone" className="h-5 w-5 text-[#9a6423] dark:text-[#f0be7c]" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <strong className="font-serif text-base text-[#2c3324] dark:text-[#fefcf1]">
                          {event.title}
                        </strong>
                        <span className="text-xs font-mono font-bold text-[#9a6423] dark:text-[#f0be7c] px-2.5 py-0.5 rounded-lg bg-[#e0a861]/15 shrink-0 w-fit">
                          {event.time}
                        </span>
                      </div>
                      {event.desc && (
                        <p className="text-xs text-[#707666] dark:text-[#a3ab98] leading-relaxed">
                          {event.desc}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </InteractiveCard>
  );
}
