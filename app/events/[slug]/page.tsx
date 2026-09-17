import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { getUserEventRegistration } from '@/lib/db/queries/events';
import { getCachedEventBySlug, getCachedPaymentSettings } from '@/lib/db/queries/cached';
import { getCurrentUserProfile } from '@/lib/db/queries/users';
import { formatPHP, formatEventSchedule } from '@/lib/utils';
import { Calendar, MapPin, Users, CheckCircle, ArrowLeft, HandHeart, Quotes } from '@phosphor-icons/react/dist/ssr';
import { EventRegistrationBox } from '@/components/domain/events/event-registration-box';
import { EventCountdownClock } from '@/components/events/event-countdown-clock';
import { EventScheduleTimeline, ScheduleItem } from '@/components/events/event-schedule-timeline';
import { EventPrepChecklist } from '@/components/events/event-prep-checklist';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { HeroGlow } from '@/components/ui/hero-glow';

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getCachedEventBySlug(slug);

  if (!event) {
    return { title: 'Event Not Found — PCYC Space' };
  }

  return {
    title: `${event.title} — PCYC Space`,
    description: event.theme || event.description,
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const [event, profile, paymentSettings] = await Promise.all([
    getCachedEventBySlug(slug),
    getCurrentUserProfile(),
    getCachedPaymentSettings(),
  ]);

  if (!event) {
    notFound();
  }

  const existingRegistration = profile
    ? await getUserEventRegistration(profile.id, event.id)
    : null;

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Top Breadcrumb Header */}
      <div className="bg-[#1b2117] text-[#fefcf1] py-4 border-b border-[#2c3324]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#e0a861] hover:text-[#f0be7c] transition-colors"
          >
            <ArrowLeft weight="bold" className="h-3.5 w-3.5" />
            <span>All Gatherings & Camps</span>
          </Link>
        </div>
      </div>

      {/* Cinematic Event Hero with Atmospheric Glow & Live Countdown */}
      <section className="bg-[#2c3324] text-[#fefcf1] pt-16 pb-28 sm:pb-36 border-b border-[#3d4632] relative overflow-hidden">
        <HeroGlow />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Title & Theme */}
            <ScrollReveal className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#e0a861]/20 border border-[#e0a861]/40 text-[#e0a861] uppercase tracking-wider">
                  Official PCYC Gathering
                </span>
                <Badge variant="gold" size="sm" className="rounded-full">
                  {event.status}
                </Badge>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-[#fefcf1] tracking-tight">
                {event.title}
              </h1>

              {event.theme && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-start gap-3">
                  <Quotes weight="fill" className="h-6 w-6 text-[#e0a861] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#e0a861] block">
                      Scriptural Gathering Theme
                    </span>
                    <p className="font-serif text-lg sm:text-xl text-[#f8f4e3] italic leading-snug">
                      &ldquo;{event.theme}&rdquo;
                    </p>
                  </div>
                </div>
              )}
            </ScrollReveal>

            {/* Right Real-Time Countdown Clock */}
            <ScrollReveal delay={0.15} className="lg:col-span-5 flex justify-center lg:justify-end">
              <EventCountdownClock startDate={event.startDate} status={event.status} />
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="py-16 sm:py-24 bg-cream -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-start">
            
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Event Hero Banner Image with 3D Specular Sheen */}
              {event.bannerUrl && (
                <ScrollReveal>
                  <InteractiveCard className="relative aspect-[21/9] w-full rounded-[2.5rem] overflow-hidden bg-[#2c3324] shadow-2xl border border-[#e6dfcb] dark:border-[#323d2b] group">
                    <Image
                      src={event.bannerUrl}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      priority
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Floating Info Overlay */}
                    <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-white">
                      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
                        <MapPin weight="fill" className="h-3.5 w-3.5 text-[#e0a861]" />
                        <span>{event.location}</span>
                      </div>
                      <div className="bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
                        <span>{formatEventSchedule(event.startDate, event.endDate)}</span>
                      </div>
                    </div>
                  </InteractiveCard>
                </ScrollReveal>
              )}

              {/* Event Overview */}
              <ScrollReveal className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#9a6423] dark:text-[#f0be7c] px-3 py-1 rounded-full bg-[#e0a861]/15 border border-[#e0a861]/30">
                  Gathering Overview
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2c3324] dark:text-[#fefcf1]">
                  About This Gathering
                </h2>
                <div className="text-base sm:text-lg text-[#5a634e] dark:text-[#a3ab98] leading-relaxed">
                  <p>{event.description}</p>
                </div>
              </ScrollReveal>

              {/* 3D Bento Logistics Pods */}
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Logistics Pod 1: Schedule */}
                <StaggerItem>
                  <InteractiveCard className="h-full p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-sm hover:shadow-xl hover:border-[#e0a861]/60 transition-all space-y-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#fbf1e2] dark:bg-[#252e1f] text-[#e0a861] flex items-center justify-center shadow-xs">
                      <Calendar weight="duotone" className="h-6 w-6 text-[#9a6423] dark:text-[#f0be7c]" />
                    </div>
                    <strong className="block font-serif text-lg text-[#2c3324] dark:text-[#fefcf1]">
                      Schedule & Dates
                    </strong>
                    <span className="text-xs sm:text-sm text-[#707666] dark:text-[#a3ab98] block leading-relaxed">
                      {formatEventSchedule(event.startDate, event.endDate)}
                    </span>
                  </InteractiveCard>
                </StaggerItem>

                {/* Logistics Pod 2: Location */}
                <StaggerItem>
                  <InteractiveCard className="h-full p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-sm hover:shadow-xl hover:border-[#e0a861]/60 transition-all space-y-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#fbf1e2] dark:bg-[#252e1f] text-[#e0a861] flex items-center justify-center shadow-xs">
                      <MapPin weight="duotone" className="h-6 w-6 text-[#9a6423] dark:text-[#f0be7c]" />
                    </div>
                    <strong className="block font-serif text-lg text-[#2c3324] dark:text-[#fefcf1]">
                      Location & Venue
                    </strong>
                    <span className="text-xs sm:text-sm text-[#707666] dark:text-[#a3ab98] block leading-relaxed">
                      {event.location}
                    </span>
                  </InteractiveCard>
                </StaggerItem>

                {/* Logistics Pod 3: Capacity */}
                <StaggerItem>
                  <InteractiveCard className="h-full p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-sm hover:shadow-xl hover:border-[#e0a861]/60 transition-all space-y-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#fbf1e2] dark:bg-[#252e1f] text-[#e0a861] flex items-center justify-center shadow-xs">
                      <Users weight="duotone" className="h-6 w-6 text-[#9a6423] dark:text-[#f0be7c]" />
                    </div>
                    <strong className="block font-serif text-lg text-[#2c3324] dark:text-[#fefcf1]">
                      Attendee Capacity
                    </strong>
                    <span className="text-xs sm:text-sm text-[#707666] dark:text-[#a3ab98] block leading-relaxed">
                      {event.maxAttendees ? `Limited to ${event.maxAttendees} attendees` : 'Open capacity for youth & friends'}
                    </span>
                  </InteractiveCard>
                </StaggerItem>

                {/* Logistics Pod 4: Fee */}
                <StaggerItem>
                  <InteractiveCard className="h-full p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-sm hover:shadow-xl hover:border-[#e0a861]/60 transition-all space-y-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#2c3324] text-[#e0a861] flex items-center justify-center shadow-xs">
                      <CheckCircle weight="fill" className="h-6 w-6 text-[#e0a861]" />
                    </div>
                    <strong className="block font-serif text-lg text-[#2c3324] dark:text-[#fefcf1]">
                      Registration Admission
                    </strong>
                    <span className="font-serif font-bold text-base sm:text-lg text-[#9a6423] dark:text-[#f0be7c] block">
                      {Number(event.registrationFee || 0) === 0
                        ? 'Free Admission'
                        : formatPHP(Number(event.registrationFee))}
                    </span>
                  </InteractiveCard>
                </StaggerItem>

              </StaggerContainer>

              {/* 3-Day Itinerary Component */}
              <ScrollReveal>
                <EventScheduleTimeline schedule={event.schedule as ScheduleItem[] | null} startDate={event.startDate} />
              </ScrollReveal>

              {/* Preparation Checklist */}
              <ScrollReveal>
                <EventPrepChecklist checklist={event.checklist as string[] | null} />
              </ScrollReveal>

            </div>

            {/* Right Sticky Registration Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <ScrollReveal className="sticky top-24 space-y-6">
                
                {/* Event Registration Box */}
                <EventRegistrationBox
                  event={event}
                  user={profile}
                  registration={existingRegistration}
                  paymentSettings={paymentSettings}
                />

                {/* Island Aid & Travel Subsidies Banner */}
                <InteractiveCard className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#2c3324] to-[#1b2117] text-[#fefcf1] border border-[#e0a861]/30 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e0a861]">
                    <HandHeart weight="fill" className="h-4 w-4" />
                    <span>Island Travel Assistance</span>
                  </div>
                  <h4 className="font-serif font-bold text-lg text-[#fefcf1]">
                    Traveling from Remote Islands?
                  </h4>
                  <p className="text-xs text-[#f8f4e3]/80 leading-relaxed">
                    100% of PCYC store proceeds directly fund ferry fares, bus tickets, and lodging for youth delegates with financial constraints.
                  </p>
                  <div className="pt-2">
                    <a
                      href="mailto:bumadillal@gmail.com"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e0a861] hover:underline"
                    >
                      <span>Request Subsidy Assistance →</span>
                    </a>
                  </div>
                </InteractiveCard>

              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

