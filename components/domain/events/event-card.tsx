import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateBadge } from '@/components/molecules/date-badge';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { formatEventSchedule } from '@/lib/utils';
import { MapPin, Users, ArrowRight } from '@phosphor-icons/react/dist/ssr';
import type { Event } from '@/lib/db/schema/events';

export interface EventCardProps {
  event: Event;
  showStatusBadge?: boolean;
}

export function EventCard({ event, showStatusBadge = true }: EventCardProps) {
  const statusVariant = {
    UPCOMING: 'gold',
    ONGOING: 'success',
    COMPLETED: 'cream',
    CANCELLED: 'error',
    ARCHIVED: 'slate',
  } as const;

  // Calculate days relative to today
  const eventDate = new Date(event.startDate);
  const now = new Date();
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let timeIndicator = '';
  if (diffDays > 0 && diffDays <= 30) {
    timeIndicator = `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    timeIndicator = `In ~${months} month${months > 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    timeIndicator = 'Today';
  }

  return (
    <InteractiveCard className="flex flex-col h-full rounded-3xl border border-[#e6dfcb] dark:border-[#323d2b] hover:border-[#e0a861]/60 hover:shadow-2xl transition-all duration-300 group overflow-hidden bg-white dark:bg-[#1b2117]">
      {/* Banner / Cover */}
      {event.bannerUrl ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#2c3324]/5">
          <Image
            src={event.bannerUrl}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Status Badge & Relative Time */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {timeIndicator && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[#fefcf1] border border-white/20 shadow-xs">
                {timeIndicator}
              </span>
            )}
            {showStatusBadge && (
              <Badge variant={statusVariant[event.status] || 'cream'} size="sm" className="rounded-full shadow-md backdrop-blur-md">
                {event.status}
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="h-3 bg-gradient-to-r from-[#e0a861]/40 via-[#e0a861]/10 to-transparent w-full" />
      )}

      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start gap-3">
          <DateBadge date={event.startDate} />
          <div className="space-y-1 min-w-0">
            {event.theme && (
              <span className="text-[11px] font-bold text-[#9a6423] dark:text-[#f0be7c] uppercase tracking-wider block truncate">
                {event.theme}
              </span>
            )}
            <CardTitle className="font-serif text-xl group-hover:text-[#9a6423] dark:group-hover:text-[#f0be7c] transition-colors line-clamp-2 leading-snug">
              {event.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 pb-4">
        <p className="text-xs sm:text-sm text-[#505748] dark:text-[#a3ab98] line-clamp-2 leading-relaxed">
          {event.description}
        </p>

        <div className="space-y-2 pt-1 text-xs text-[#707666] dark:text-[#a3ab98]">
          <div className="flex items-center gap-2">
            <MapPin weight="duotone" className="h-3.5 w-3.5 text-[#e0a861] shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          {event.maxAttendees && (
            <div className="flex items-center gap-2">
              <Users weight="duotone" className="h-3.5 w-3.5 text-[#e0a861] shrink-0" />
              <span>Max Capacity: {event.maxAttendees} attendees</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3.5 border-t border-[#e6dfcb]/60 dark:border-[#323d2b]/60 flex items-center justify-between text-xs font-semibold">
        <span className="text-[#8a9180] dark:text-[#8a9180] truncate max-w-[65%]">
          {formatEventSchedule(event.startDate, event.endDate)}
        </span>
        <Link
          href={`/events/${event.slug}`}
          className="text-[#2c3324] dark:text-[#fefcf1] group-hover:text-[#9a6423] dark:group-hover:text-[#f0be7c] flex items-center gap-1.5 transition-colors font-bold"
        >
          <span>View Gathering</span>
          <ArrowRight weight="bold" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
        </Link>
      </CardFooter>
    </InteractiveCard>
  );
}
