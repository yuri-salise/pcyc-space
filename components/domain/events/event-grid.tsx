'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EventCard } from './event-card';
import { EmptyState } from '@/components/molecules/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Calendar, Search, Filter, X } from 'lucide-react';
import type { Event } from '@/lib/db/schema/events';
import { useDebounce } from '@/lib/hooks/use-debounce';

export interface EventGridProps {
  events: Event[];
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
}

export function EventGrid({
  events,
  emptyTitle = 'No events scheduled yet',
  emptyDescription = 'There are currently no events listed under this category. Please check back soon or browse other fellowship gatherings.',
  pageSize = 6,
}: EventGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter events based on search query and status filter
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Status filter
      if (statusFilter !== 'ALL' && event.status !== statusFilter) {
        return false;
      }

      // Search query filter
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesTheme = event.theme?.toLowerCase().includes(query);
        const matchesLocation = event.location.toLowerCase().includes(query);
        const matchesDesc = event.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesTheme && !matchesLocation && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [events, debouncedSearch, statusFilter]);

  if (!events || events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel="View All Events"
        actionHref="/events"
      />
    );
  }

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + pageSize);

  const filterOptions = [
    { value: 'ALL', label: 'All Gatherings' },
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'REGISTRATION_OPEN', label: 'Open for Registration' },
    { value: 'COMPLETED', label: 'Past Events' },
  ];

  return (
    <div className="space-y-8">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-sm">
        {/* Filter Pills with Spring Indicator */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#f8f4e3] dark:bg-[#131710] rounded-2xl">
          {filterOptions.map((opt) => {
            const isSelected = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setStatusFilter(opt.value);
                  setCurrentPage(1);
                }}
                className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 z-10 select-none ${
                  isSelected
                    ? 'text-[#fefcf1] dark:text-[#131710] font-bold'
                    : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1]'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeEventTab"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className="absolute inset-0 bg-[#2c3324] dark:bg-[#e0a861] rounded-xl z-[-1] shadow-sm"
                  />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707666] dark:text-[#a3ab98]" />
          <input
            type="text"
            placeholder="Search title, location, theme..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-[#fefcf1] dark:bg-[#131710] border border-[#e6dfcb] dark:border-[#323d2b] rounded-2xl text-[#2c3324] dark:text-[#fefcf1] placeholder-[#707666] dark:placeholder-[#8a9180] focus:outline-none focus:border-[#e0a861] focus:ring-2 focus:ring-[#e0a861]/20 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#707666] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Results */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] space-y-4 shadow-sm">
          <Calendar className="h-8 w-8 text-[#9a6423] dark:text-[#f0be7c] mx-auto opacity-70" />
          <h3 className="font-serif font-bold text-xl text-[#2c3324] dark:text-[#fefcf1]">
            No matching gatherings found
          </h3>
          <p className="text-xs sm:text-sm text-[#707666] dark:text-[#a3ab98] max-w-md mx-auto">
            We couldn&apos;t find any events matching &ldquo;{searchQuery}&rdquo;. Try clearing your search or selecting a different filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className="text-xs font-bold text-[#9a6423] dark:text-[#f0be7c] hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {paginatedEvents.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="h-full"
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredEvents.length > pageSize && (
        <div className="pt-4 flex justify-center">
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 200, behavior: 'smooth' });
            }}
            totalItems={filteredEvents.length}
            pageSize={pageSize}
            showCount={true}
          />
        </div>
      )}
    </div>
  );
}
