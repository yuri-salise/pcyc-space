'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Clock, CalendarDays, ArrowUpDown } from 'lucide-react';
import { formatDateForDateInput } from '@/lib/utils';

export interface ScheduleItem {
  day?: string;
  time: string;
  title: string;
  description: string;
}

interface AdminScheduleBuilderProps {
  initialSchedule?: ScheduleItem[] | string | null;
  startDate?: string;
  endDate?: string;
}

const SUGGESTED_SCHEDULE: ScheduleItem[] = [
  {
    day: 'Day 01',
    time: '1:00 PM – 4:00 PM',
    title: 'Delegate Arrival & Room Check-in',
    description: 'Welcome desk open for registration badges, study binders, and lodging keys.',
  },
  {
    day: 'Day 01',
    time: '5:30 PM – 6:30 PM',
    title: 'Welcome Fellowship Dinner',
    description: 'Communal dinner and meet-and-greet with brothers, sisters, and visiting friends.',
  },
  {
    day: 'Day 01',
    time: '7:00 PM – 9:00 PM',
    title: 'Opening Camp Lecture & Theme Introduction',
    description: 'First keynote address exploring our theme in Scripture, followed by evening hymns.',
  },
  {
    day: 'Day 01',
    time: '9:30 PM',
    title: 'Evening Fellowship Circle & Curfew',
    description: 'Informal discussions, hot chocolate, and lights-out preparation.',
  },
  {
    day: 'Day 02',
    time: '7:30 AM – 8:30 AM',
    title: 'Morning Praise & Breakfast',
    description: 'Devotional reading and communal breakfast.',
  },
  {
    day: 'Day 02',
    time: '9:00 AM – 11:30 AM',
    title: 'Interactive Bible Lecture & Exhortation',
    description: 'Deep-dive textual study with Q&A session for young people and seekers.',
  },
  {
    day: 'Day 02',
    time: '2:00 PM – 4:30 PM',
    title: 'Afternoon Sports & Team Fellowship',
    description: 'Volleyball, basketball, team quizzes, and recreation on camp grounds.',
  },
  {
    day: 'Day 02',
    time: '7:00 PM – 9:00 PM',
    title: 'Youth Choral Singing & Campfire Devotion',
    description: 'Learning multi-part Christadelphian anthems and outdoor praise circle.',
  },
  {
    day: 'Day 03',
    time: '8:00 AM – 9:00 AM',
    title: 'Breakfast & Packing',
    description: 'Room clearance and baggage storage before Sunday memorial service.',
  },
  {
    day: 'Day 03',
    time: '9:30 AM – 11:30 AM',
    title: 'Breaking of Bread Memorial Service',
    description: 'Solemn Breaking of Bread service, communion, and closing exhortation.',
  },
  {
    day: 'Day 03',
    time: '12:00 PM – 1:30 PM',
    title: 'Farewell Fellowship Lunch',
    description: 'Final group photographs, contact exchanges, and travel prayer.',
  },
  {
    day: 'Day 03',
    time: '2:00 PM',
    title: 'Safe Travels & Dismissal',
    description: 'Coordinated buses and ferry drop-offs for island delegates.',
  },
];

export function parseSchedule(input?: ScheduleItem[] | string | null): ScheduleItem[] {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
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

export function AdminScheduleBuilder({ initialSchedule, startDate, endDate }: AdminScheduleBuilderProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => parseSchedule(initialSchedule));
  const [prevInitialSchedule, setPrevInitialSchedule] = useState(initialSchedule);

  // Keep state in sync with prop updates during render without cascading useEffect
  if (initialSchedule !== prevInitialSchedule) {
    setPrevInitialSchedule(initialSchedule);
    setSchedule(parseSchedule(initialSchedule));
  }

  // Derive suggested day options from the event's start and end dates
  const dayOptions = useMemo(() => {
    if (!startDate) {
      return [
        { id: 'Day 01', label: 'Day 01' },
        { id: 'Day 02', label: 'Day 02' },
        { id: 'Day 03', label: 'Day 03' },
      ];
    }

    const startDateStr = formatDateForDateInput(startDate);
    if (!startDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) {
      return [
        { id: 'Day 01', label: 'Day 01' },
        { id: 'Day 02', label: 'Day 02' },
        { id: 'Day 03', label: 'Day 03' },
      ];
    }

    const endDateStr = endDate ? formatDateForDateInput(endDate) : startDateStr;
    const validEndDateStr = (endDateStr && /^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) ? endDateStr : startDateStr;

    const [sy, sm, sd] = startDateStr.split('-').map(Number);
    const [ey, em, ed] = validEndDateStr.split('-').map(Number);
    const startUtc = Date.UTC(sy, sm - 1, sd);
    const endUtc = Date.UTC(ey, em - 1, ed);

    const diffDays = Math.max(1, Math.min(14, Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1));

    const days: { id: string; label: string }[] = [];
    for (let i = 0; i < diffDays; i++) {
      const current = new Date(Date.UTC(sy, sm - 1, sd + i));
      const dayNum = String(i + 1).padStart(2, '0');
      const dayId = `Day ${dayNum}`;
      const dateFormatted = new Intl.DateTimeFormat('en-PH', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
      }).format(current);
      days.push({ id: dayId, label: `${dayId} (${dateFormatted})` });
    }

    return days;
  }, [startDate, endDate]);

  const addItem = () => {
    setSchedule((prev) => {
      const defaultDay = prev.length > 0 && prev[prev.length - 1].day ? prev[prev.length - 1].day : 'Day 01';
      return [...prev, { day: defaultDay, time: '', title: '', description: '' }];
    });
  };

  const loadTemplate = () => {
    setSchedule([...SUGGESTED_SCHEDULE]);
  };

  const clearAll = () => {
    setSchedule([]);
  };

  const removeItem = (index: number) => {
    setSchedule((prev) => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSchedule((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveDown = (index: number) => {
    setSchedule((prev) => {
      if (index >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const sortByTime = () => {
    setSchedule((prev) => {
      const copy = [...prev];
      copy.sort((a, b) => {
        const dayA = (a.day || 'Day 01').trim();
        const dayB = (b.day || 'Day 01').trim();
        if (dayA !== dayB) return dayA.localeCompare(dayB, undefined, { numeric: true });
        return parseTimeMinutes(a.time) - parseTimeMinutes(b.time);
      });
      return copy;
    });
  };

  const updateItem = (index: number, field: keyof ScheduleItem, value: string) => {
    setSchedule((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      {/* Hidden serialization input for FormData submission */}
      <input type="hidden" name="schedule" value={JSON.stringify(schedule)} />

      {/* Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6dfcb] dark:border-[#323d2b]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#e0a861]" />
            <h4 className="text-sm font-bold text-[#2c3324] dark:text-[#fefcf1]">
              Gathering Schedule & Itinerary
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-[#e0a861]/15 text-[#9a6423] dark:text-[#f0be7c]">
              {schedule.length} session{schedule.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
            Define the timeline of sessions, study classes, fellowship meals, and services.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {schedule.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={sortByTime}
              title="Sort sessions chronologically by time"
              className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-[#e6dfcb] dark:border-[#323d2b] text-[#505748] dark:text-[#a3ab98] hover:bg-[#e0a861]/10"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Sort by Time</span>
            </Button>
          )}

          {schedule.length === 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadTemplate}
              className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-[#e0a861]/50 text-[#9a6423] dark:text-[#f0be7c] hover:bg-[#e0a861]/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Load Suggested Camp Itinerary</span>
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
            onClick={addItem}
            className="h-8 text-xs font-bold gap-1.5 rounded-xl shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Session</span>
          </Button>
        </div>
      </div>

      {/* Schedule Items List */}
      <div className="space-y-3">
        {schedule.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-2xl border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#1b2117] shadow-xs space-y-3 transition-all hover:border-[#e0a861]/60"
          >
            {/* Slot Header with Reordering and Delete */}
            <div className="flex items-center justify-between pb-2 border-b border-[#e6dfcb]/50 dark:border-[#323d2b]/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9a6423] dark:text-[#f0be7c] px-2.5 py-0.5 rounded-lg bg-[#e0a861]/10">
                {item.day ? `${item.day} • Slot #${index + 1}` : `Slot #${index + 1}`}
              </span>

              <div className="flex items-center gap-1">
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
                  disabled={index === schedule.length - 1}
                  onClick={() => moveDown(index)}
                  title="Move Down"
                  className="p-1 rounded-lg text-[#707666] hover:text-[#2c3324] dark:hover:text-[#fefcf1] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  title="Remove this slot"
                  className="p-1 rounded-lg text-[#c0392b] hover:bg-[#fdf2f2] dark:hover:bg-[#2d1815] transition-colors ml-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Field Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4 space-y-1.5">
                <label className="block text-[11px] font-semibold text-[#505748] dark:text-[#a3ab98]">
                  Day / Tab
                </label>
                <Input
                  placeholder="e.g. Day 01"
                  value={item.day || ''}
                  onChange={(e) => updateItem(index, 'day', e.target.value)}
                  className="h-9 text-xs"
                />
                {dayOptions.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {dayOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateItem(index, 'day', opt.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                          (item.day || 'Day 01') === opt.id
                            ? 'bg-[#2c3324] dark:bg-[#e0a861] text-[#fefcf1] dark:text-[#131710]'
                            : 'bg-[#e0a861]/15 text-[#9a6423] dark:text-[#f0be7c] hover:bg-[#e0a861]/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-[#505748] dark:text-[#a3ab98] mb-1">
                  Time / Hours <span className="text-[#c0392b]">*</span>
                </label>
                <Input
                  placeholder="e.g. 08:00 AM – 09:30 AM"
                  value={item.time || ''}
                  onChange={(e) => updateItem(index, 'time', e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-[#505748] dark:text-[#a3ab98] mb-1">
                  Session Title / Activity <span className="text-[#c0392b]">*</span>
                </label>
                <Input
                  placeholder="e.g. Morning Textual Bible Study & Praise"
                  value={item.title || ''}
                  onChange={(e) => updateItem(index, 'title', e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="sm:col-span-12">
                <label className="block text-[11px] font-semibold text-[#505748] dark:text-[#a3ab98] mb-1">
                  Short Description & Details (Optional)
                </label>
                <Input
                  placeholder="e.g. Interactive textual study with Q&A session for young people."
                  value={item.description || ''}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        ))}

        {schedule.length === 0 && (
          <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/30 dark:bg-[#1b2117]/30 space-y-3">
            <div className="h-10 w-10 rounded-full bg-[#f8f4e3] dark:bg-[#252e1f] text-[#9a6423] dark:text-[#f0be7c] mx-auto flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="text-xs font-bold text-[#2c3324] dark:text-[#fefcf1]">
                No Custom Schedule Items
              </p>
              <p className="text-[11px] text-[#707666] dark:text-[#a3ab98] leading-relaxed">
                You have not added any itinerary slots. You can load a suggested template or add custom sessions above.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadTemplate}
                className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-[#e0a861]/60 text-[#9a6423] dark:text-[#f0be7c] hover:bg-[#e0a861]/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Load Suggested Template</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={addItem}
                className="h-8 text-xs font-bold gap-1.5 rounded-xl"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Empty Slot</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
