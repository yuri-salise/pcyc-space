'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { formatEventSchedule } from '@/lib/utils';
import { deleteEventAction, archiveEventAction, unarchiveEventAction } from '@/app/actions/events';
import type { Event } from '@/lib/db/schema/events';
import {
  Calendar,
  MapPin,
  Trash,
  ArrowSquareOut,
  PencilSimple,
  Archive,
  ArrowCounterClockwise,
  Users,
  MagnifyingGlass,
  Warning,
  X,
  CircleNotch,
} from '@phosphor-icons/react/dist/ssr';
import { motion, AnimatePresence } from 'motion/react';

interface AdminEventsListProps {
  events: Event[];
}

const PAGE_SIZE = 8;

export function AdminEventsList({ events }: AdminEventsListProps) {
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteEventTarget, setDeleteEventTarget] = useState<Event | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Compute counts
  const archivedCount = events.filter((e) => e.status === 'ARCHIVED').length;
  const activeCount = events.filter((e) => e.status !== 'ARCHIVED').length;
  const allCount = events.length;

  // Filter list
  const filteredEvents = events.filter((evt) => {
    // Tab filter
    if (filterTab === 'ACTIVE' && evt.status === 'ARCHIVED') return false;
    if (filterTab === 'ARCHIVED' && evt.status !== 'ARCHIVED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = evt.title?.toLowerCase().includes(q);
      const matchLocation = evt.location?.toLowerCase().includes(q);
      const matchTheme = evt.theme?.toLowerCase().includes(q);
      const matchSlug = evt.slug?.toLowerCase().includes(q);
      return matchTitle || matchLocation || matchTheme || matchSlug;
    }

    return true;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + PAGE_SIZE);

  const handleTabChange = (tab: 'ALL' | 'ACTIVE' | 'ARCHIVED') => {
    setFilterTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleDeleteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!deleteEventTarget) return;

    const formData = new FormData(e.currentTarget);
    startDeleteTransition(async () => {
      await deleteEventAction(formData);
      setDeleteEventTarget(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#1b2117] p-2.5 rounded-2xl border border-[#e6dfcb] dark:border-[#323d2b] shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-[#f8f4e3] dark:bg-[#252e1f] rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('ALL')}
            className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap z-10 ${
              filterTab === 'ALL'
                ? 'text-white dark:text-[#1b2117]'
                : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1]'
            }`}
          >
            {filterTab === 'ALL' && (
              <motion.div
                layoutId="adminEventsTab"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-[#2c3324] dark:bg-[#e0a861] rounded-lg z-[-1] shadow-xs"
              />
            )}
            <span>All Events ({allCount})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('ACTIVE')}
            className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap z-10 ${
              filterTab === 'ACTIVE'
                ? 'text-white dark:text-[#1b2117]'
                : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1]'
            }`}
          >
            {filterTab === 'ACTIVE' && (
              <motion.div
                layoutId="adminEventsTab"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-[#2c3324] dark:bg-[#e0a861] rounded-lg z-[-1] shadow-xs"
              />
            )}
            <span>Active & Upcoming ({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('ARCHIVED')}
            className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap z-10 ${
              filterTab === 'ARCHIVED'
                ? 'text-white dark:text-[#1b2117]'
                : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1]'
            }`}
          >
            {filterTab === 'ARCHIVED' && (
              <motion.div
                layoutId="adminEventsTab"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-[#2c3324] dark:bg-[#e0a861] rounded-lg z-[-1] shadow-xs"
              />
            )}
            <span>Archived ({archivedCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <MagnifyingGlass
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#707666] dark:text-[#a3ab98]"
          />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/50 dark:bg-[#131710] focus:bg-white dark:focus:bg-[#1b2117] dark:text-[#fefcf1] focus:outline-none focus:ring-1 focus:ring-[#2c3324] dark:focus:ring-[#e0a861]"
          />
        </div>
      </div>

      {/* Events Table / Card List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-serif">
                {filterTab === 'ARCHIVED'
                  ? 'Archived Events'
                  : filterTab === 'ACTIVE'
                  ? 'Active Events'
                  : 'All Events'}{' '}
                ({filteredEvents.length})
              </CardTitle>
              <CardDescription>
                {filterTab === 'ARCHIVED'
                  ? 'Historical events archived from the active public schedule.'
                  : 'Manage youth gatherings, attendees, and publication status.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Calendar weight="duotone" className="h-10 w-10 text-[#8a9180] mx-auto opacity-70" />
              <p className="text-sm font-semibold text-[#2c3324] dark:text-[#fefcf1]">
                {searchQuery ? 'No matching events found' : 'No events in this category'}
              </p>
              <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
                {searchQuery ? 'Try adjusting your search terms.' : 'Create a new event or switch tabs.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-[#e6dfcb] dark:divide-[#323d2b]">
                <AnimatePresence mode="popLayout">
                  {paginatedEvents.map((evt) => {
                    const isArchived = evt.status === 'ARCHIVED';

                    return (
                      <motion.div
                        key={evt.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className={`py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors px-3 rounded-xl ${
                          isArchived
                            ? 'bg-slate-50/70 dark:bg-slate-900/40 opacity-80'
                            : 'hover:bg-[#f8f4e3]/50 dark:hover:bg-[#252e1f]/50'
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif font-bold text-base text-[#2c3324] dark:text-[#fefcf1]">
                              {evt.title}
                            </span>
                            <Badge variant={evt.isPublished ? 'success' : 'cream'} size="sm">
                              {evt.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                            <Badge
                              variant={
                                isArchived
                                  ? 'slate'
                                  : evt.status === 'COMPLETED'
                                  ? 'success'
                                  : evt.status === 'CANCELLED'
                                  ? 'destructive'
                                  : 'gold'
                              }
                              size="sm"
                            >
                              {evt.status}
                            </Badge>
                          </div>

                          {evt.theme && (
                            <p className="text-xs italic text-[#9a6423] dark:text-[#f0be7c] font-serif">
                              &ldquo;{evt.theme}&rdquo;
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#707666] dark:text-[#a3ab98]">
                            <span className="inline-flex items-center gap-1">
                              <Calendar weight="duotone" className="h-3.5 w-3.5 text-[#e0a861]" />
                              <span>{formatEventSchedule(evt.startDate, evt.endDate)}</span>
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin weight="duotone" className="h-3.5 w-3.5 text-[#e0a861]" />
                              <span>{evt.location}</span>
                            </span>
                            <span>•</span>
                            <span className="text-[#9a6423] dark:text-[#f0be7c] font-mono">
                              /events/{evt.slug}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 self-end lg:self-center">
                          <Link
                            href={`/admin/events/${evt.id}/attendees`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2c3324] dark:text-[#fefcf1] bg-[#f8f4e3] dark:bg-[#252e1f] hover:bg-[#e0a861]/20 border border-[#e6dfcb] dark:border-[#323d2b] transition-all inline-flex items-center gap-1.5 shadow-2xs"
                            title="View Registered Attendees"
                          >
                            <Users weight="duotone" className="h-3.5 w-3.5 text-[#9a6423] dark:text-[#f0be7c]" />
                            <span>Attendees</span>
                          </Link>

                          <Link
                            href={`/admin/events/${evt.id}/edit`}
                            className="p-2 rounded-lg text-[#505748] dark:text-[#a3ab98] hover:bg-white dark:hover:bg-[#1b2117] hover:text-[#2c3324] dark:hover:text-[#fefcf1] border border-transparent hover:border-[#e6dfcb] dark:hover:border-[#323d2b] transition-all"
                            title="Edit Event"
                          >
                            <PencilSimple weight="duotone" className="h-4 w-4" />
                          </Link>

                          <Link
                            href={`/events/${evt.slug}`}
                            target="_blank"
                            className="p-2 rounded-lg text-[#505748] dark:text-[#a3ab98] hover:bg-white dark:hover:bg-[#1b2117] hover:text-[#2c3324] dark:hover:text-[#fefcf1] border border-transparent hover:border-[#e6dfcb] dark:hover:border-[#323d2b] transition-all"
                            title="Preview Public Page"
                          >
                            <ArrowSquareOut weight="bold" className="h-4 w-4" />
                          </Link>

                          {/* Quick Archive / Restore Action */}
                          {isArchived ? (
                            <form action={unarchiveEventAction}>
                              <input type="hidden" name="eventId" value={evt.id} />
                              <button
                                type="submit"
                                className="p-2 rounded-lg text-[#2e7d32] dark:text-[#66bb6a] hover:bg-green-50 dark:hover:bg-green-950/30 border border-transparent hover:border-green-200 dark:hover:border-green-800 transition-all"
                                title="Restore Event"
                              >
                                <ArrowCounterClockwise weight="bold" className="h-4 w-4" />
                              </button>
                            </form>
                          ) : (
                            <form action={archiveEventAction}>
                              <input type="hidden" name="eventId" value={evt.id} />
                              <button
                                type="submit"
                                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                title="Archive Event"
                              >
                                <Archive weight="duotone" className="h-4 w-4" />
                              </button>
                            </form>
                          )}

                          {/* Delete Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setDeleteEventTarget(evt)}
                            className="p-2 rounded-lg text-[#c0392b] dark:text-[#ef5350] hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all"
                            title="Delete Event & Attendees"
                          >
                            <Trash weight="duotone" className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {totalPages > 1 && (
                <div className="pt-2">
                  <Pagination
                    currentPage={activePage}
                    totalPages={totalPages}
                    onPageChange={(p) => setCurrentPage(p)}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal with Framer Motion and Active Deletion Spinner */}
      <AnimatePresence>
        {deleteEventTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteEventTarget(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 bg-[#fefcf1] dark:bg-[#1b2117] border-2 border-[#c0392b]/30 dark:border-[#c0392b]/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#fdf2f2] dark:bg-[#2d1815] text-[#c0392b] dark:text-[#ef5350] border border-[#f5c6cb] dark:border-[#4d201b] shadow-xs">
                    <Warning weight="fill" className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl text-[#2c3324] dark:text-[#fefcf1]">
                      Delete Event & Attendees?
                    </h3>
                    <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
                      Permanent destructive action
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteEventTarget(null)}
                  className="text-[#707666] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1] p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <X weight="bold" className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#252e1f] border border-[#e6dfcb] dark:border-[#323d2b] text-xs text-[#505748] dark:text-[#a3ab98] space-y-3">
                <p>
                  You are about to permanently delete{' '}
                  <strong className="text-[#2c3324] dark:text-[#fefcf1] font-bold">
                    {deleteEventTarget.title}
                  </strong>
                  .
                </p>
                <p className="text-[#c0392b] dark:text-[#ef5350] font-semibold bg-[#fdf2f2] dark:bg-[#2d1815] p-3 rounded-xl border border-[#f5c6cb] dark:border-[#4d201b] leading-relaxed">
                  ⚠️ This will permanently remove ALL registered attendees, check-ins, and data for this gathering. This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => setDeleteEventTarget(null)}
                  className="rounded-xl px-4"
                >
                  Cancel
                </Button>

                <form onSubmit={handleDeleteSubmit}>
                  <input type="hidden" name="eventId" value={deleteEventTarget.id} />
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    className="gap-2 rounded-xl px-5 shadow-sm"
                  >
                    {isDeleting ? (
                      <>
                        <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
                        <span>Deleting Event...</span>
                      </>
                    ) : (
                      <>
                        <Trash weight="bold" className="h-4 w-4" />
                        <span>Confirm Delete</span>
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
