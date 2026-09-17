'use client';

import React, { useActionState, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { updateEventAction, AdminEventActionState } from '@/app/actions/events';
import { Event } from '@/lib/db/schema/events';
import { formatDateForDateInput, formatTimeForTimeInput } from '@/lib/utils';
import { AdminScheduleBuilder, ScheduleItem } from '@/components/events/admin-schedule-builder';
import { AdminChecklistBuilder } from '@/components/events/admin-checklist-builder';
import {
  Calendar,
  AlertCircle,
  Save,
  Wand2,
  FileText,
  Sparkles,
  Clock,
  MapPin,
  Info,
} from 'lucide-react';

const initialState: AdminEventActionState = {
  success: false,
};

interface EditEventFormProps {
  event: Event;
}

export function EditEventForm({ event }: EditEventFormProps) {
  const [state, formAction, isPending] = useActionState(updateEventAction, initialState);
  const [title, setTitle] = useState(event.title);
  const [slug, setSlug] = useState(event.slug);
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [fee, setFee] = useState(event.registrationFee ? String(Number(event.registrationFee)) : '0');
  const [startDate, setStartDate] = useState(formatDateForDateInput(event.startDate));
  const [startTime, setStartTime] = useState(formatTimeForTimeInput(event.startDate));
  const [endDate, setEndDate] = useState(formatDateForDateInput(event.endDate));
  const [endTime, setEndTime] = useState(formatTimeForTimeInput(event.endDate));
  const [registrationDeadline, setRegistrationDeadline] = useState(
    event.registrationDeadline ? formatDateForDateInput(event.registrationDeadline) : ''
  );

  const [prevPayload, setPrevPayload] = useState(state?.payload);
  if (state?.payload && state.payload !== prevPayload) {
    setPrevPayload(state.payload);
    if (state.payload.startDate) {
      setStartDate(formatDateForDateInput(state.payload.startDate));
      setStartTime(formatTimeForTimeInput(state.payload.startDate));
    }
    if (state.payload.endDate) {
      setEndDate(formatDateForDateInput(state.payload.endDate));
      setEndTime(formatTimeForTimeInput(state.payload.endDate));
    }
    if (state.payload.registrationDeadline !== undefined) {
      setRegistrationDeadline(
        state.payload.registrationDeadline ? formatDateForDateInput(state.payload.registrationDeadline) : ''
      );
    }
  }

  // Helper to generate clean URL slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Auto-fill URL slug from Title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isManuallyEdited) {
      setSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsManuallyEdited(true);
  };

  const handleRegenerateSlug = () => {
    setSlug(generateSlug(title));
    setIsManuallyEdited(false);
  };

  return (
    <Card className="shadow-xl rounded-3xl border border-[#e6dfcb] dark:border-[#323d2b] overflow-hidden bg-white dark:bg-[#1b2117]">
      <form action={formAction}>
        {/* Hidden identifier inputs */}
        <input type="hidden" name="eventId" value={event.id} />
        <input type="hidden" name="existingSlug" value={event.slug} />
        <input type="hidden" name="existingBannerUrl" value={event.bannerUrl || ''} />

        {/* Header Banner */}
        <CardHeader className="border-b border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/60 dark:bg-[#252e1f]/60 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#2c3324] text-[#e0a861] flex items-center justify-center shadow-xs">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-serif text-2xl sm:text-3xl font-bold text-[#2c3324] dark:text-[#fefcf1]">
                Edit Gathering: {event.title}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-[#707666] dark:text-[#a3ab98] mt-1">
                Update schedules, itinerary sessions, delegate packing lists, venue, and admissions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-8">
          {/* Global Validation Error Notification */}
          {state?.error && (
            <div className="p-4 rounded-2xl bg-[#fdf2f2] dark:bg-[#2d1815] border border-[#f5c6cb] dark:border-[#4d201b] text-[#c0392b] dark:text-[#ef5350] text-xs sm:text-sm flex items-start gap-3 animate-shake">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="block font-bold">Unable to Save Changes</strong>
                <span>{state.error}</span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 1: ESSENTIAL DETAILS */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-[#e6dfcb]/60 dark:border-[#323d2b]/60">
              <FileText className="h-4 w-4 text-[#e0a861]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#2c3324] dark:text-[#fefcf1]">
                1. Gathering Essentials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input
                  label="Event Title"
                  name="title"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="e.g. Philippine Christadelphian Youth Circle 2027"
                  required
                  error={state?.fieldErrors?.title?.[0]}
                />
                <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                  Public gathering title shown across the website.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#2c3324] dark:text-[#fefcf1] uppercase tracking-wider">
                    URL Permanent Slug <span className="text-[#c0392b]">*</span>
                  </label>
                  {isManuallyEdited && (
                    <button
                      type="button"
                      onClick={handleRegenerateSlug}
                      className="inline-flex items-center gap-1 text-[11px] text-[#9a6423] dark:text-[#f0be7c] hover:underline font-bold"
                    >
                      <Wand2 className="h-3 w-3" />
                      <span>Re-sync with Title</span>
                    </button>
                  )}
                </div>
                <Input
                  name="slug"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="e.g. pcyc-national-camp-2027"
                  required
                  error={state?.fieldErrors?.slug?.[0]}
                />
                <p className="text-[11px] text-[#707666] dark:text-[#a3ab98] truncate">
                  Preview: <span className="font-mono text-[#9a6423] dark:text-[#f0be7c]">/events/{slug}</span>
                </p>
              </div>
            </div>

            {/* Scriptural Theme */}
            <div className="space-y-1">
              <Input
                label="Spiritual Theme / Scriptural Motto (Optional)"
                name="theme"
                defaultValue={event.theme || ''}
                placeholder="e.g. Anchored in Hope: Laying Hold on Eternal Life (Hebrews 6:19)"
                error={state?.fieldErrors?.theme?.[0]}
              />
              <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                Scripture theme displayed with quote marks on the hero banner.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Textarea
                label="Event Overview & Fellowship Description"
                name="description"
                defaultValue={event.description}
                placeholder="Provide details on lessons, accommodations, registration..."
                required
                rows={4}
                error={state?.fieldErrors?.description?.[0]}
              />
              <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                Full event description displayed in the &quot;About This Gathering&quot; section.
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: BANNER IMAGE */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-[#e6dfcb]/60 dark:border-[#323d2b]/60">
              <Sparkles className="h-4 w-4 text-[#e0a861]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#2c3324] dark:text-[#fefcf1]">
                2. Event Banner Image
              </h3>
            </div>

            {event.bannerUrl && (
              <div className="p-3.5 rounded-2xl bg-[#f8f4e3] dark:bg-[#252e1f] border border-[#e6dfcb] dark:border-[#323d2b] flex items-center gap-4">
                <div className="relative h-16 w-28 rounded-xl overflow-hidden border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#1b2117] shrink-0">
                  <Image
                    src={event.bannerUrl}
                    alt="Current Banner"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-xs space-y-0.5">
                  <strong className="block text-[#2c3324] dark:text-[#fefcf1] font-bold">Current Active Banner</strong>
                  <p className="text-[#707666] dark:text-[#a3ab98]">
                    To change this photo, choose a new image file below. If omitted, the current banner will be preserved.
                  </p>
                </div>
              </div>
            )}

            <ImageUpload
              name="imageFile"
              label="Replace Event Banner (Optional)"
              helperText="Attach new image from device • PNG, JPG, or WEBP • Max 10MB"
              error={state?.fieldErrors?.bannerUrl?.[0]}
            />
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: SCHEDULE DATES & TIMES */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-[#e6dfcb]/60 dark:border-[#323d2b]/60">
              <Clock className="h-4 w-4 text-[#e0a861]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#2c3324] dark:text-[#fefcf1]">
                3. Dates & Timetable
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date & Time */}
              <div className="p-4 rounded-2xl bg-[#f8f4e3]/40 dark:bg-[#252e1f]/40 border border-[#e6dfcb] dark:border-[#323d2b] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9a6423] dark:text-[#f0be7c] block">
                  Check-in & Opening Session
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    error={state?.fieldErrors?.startDate?.[0]}
                  />
                  <Input
                    label="Start Time"
                    name="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="p-4 rounded-2xl bg-[#f8f4e3]/40 dark:bg-[#252e1f]/40 border border-[#e6dfcb] dark:border-[#323d2b] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9a6423] dark:text-[#f0be7c] block">
                  Dismissal & Closing Session
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="End Date"
                    name="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    error={state?.fieldErrors?.endDate?.[0]}
                  />
                  <Input
                    label="End Time"
                    name="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Registration Deadline */}
              <div className="p-4 rounded-2xl bg-[#f8f4e3]/40 dark:bg-[#252e1f]/40 border border-[#e6dfcb] dark:border-[#323d2b] space-y-3 md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9a6423] dark:text-[#f0be7c] block">
                  Registration Cut-off Deadline (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <Input
                    label="Deadline Date"
                    name="registrationDeadline"
                    type="date"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    error={state?.fieldErrors?.registrationDeadline?.[0]}
                  />
                  <p className="text-[11px] text-[#707666] dark:text-[#a3ab98] pt-1">
                    Last day delegates can sign up on PCYC Space. Leave blank if registration remains open until the gathering begins.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 4: LOCATION & REGISTRATION ADMISSION */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-[#e6dfcb]/60 dark:border-[#323d2b]/60">
              <MapPin className="h-4 w-4 text-[#e0a861]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#2c3324] dark:text-[#fefcf1]">
                4. Venue, Capacity & Registration Fee
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Input
                  label="Location / Ecclesial Hall"
                  name="location"
                  defaultValue={event.location}
                  placeholder="e.g. Cubao Ecclesial Hall, Quezon City"
                  required
                  error={state?.fieldErrors?.location?.[0]}
                />
                <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                  Venue address or campsite location.
                </p>
              </div>

              <div className="space-y-1">
                <Input
                  label="Registration Fee (₱ PHP)"
                  name="registrationFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="0.00"
                  required
                  error={state?.fieldErrors?.registrationFee?.[0]}
                />
                <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                  {Number(fee) === 0 ? (
                    <span className="text-[#2e7d32] dark:text-[#66bb6a] font-bold">✓ Free Fellowship Event</span>
                  ) : (
                    <span>Paid ticketing (settled online / at venue desk)</span>
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <Input
                  label="Max Attendee Capacity (Optional)"
                  name="maxAttendees"
                  type="number"
                  min="1"
                  defaultValue={event.maxAttendees ? String(event.maxAttendees) : ''}
                  placeholder="e.g. 150 (leave blank for unlimited)"
                  error={state?.fieldErrors?.maxAttendees?.[0]}
                />
                <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                  Caps registrations once capacity is reached.
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 5: DYNAMIC ITINERARY BUILDER */}
          {/* ======================================================== */}
          <div className="p-5 sm:p-6 rounded-3xl border border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/30 dark:bg-[#1b2117]/30">
            <AdminScheduleBuilder
              initialSchedule={(state?.payload?.schedule ? state.payload.schedule : event.schedule) as ScheduleItem[] | null}
              startDate={startDate}
              endDate={endDate}
            />
          </div>

          {/* ======================================================== */}
          {/* SECTION 6: DYNAMIC PACKING CHECKLIST BUILDER */}
          {/* ======================================================== */}
          <div className="p-5 sm:p-6 rounded-3xl border border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/30 dark:bg-[#1b2117]/30">
            <AdminChecklistBuilder initialChecklist={(state?.payload?.checklist ? state.payload.checklist : event.checklist) as string[] | null} />
          </div>

          {/* ======================================================== */}
          {/* SECTION 7: STATUS & PUBLICATION CONTROLS */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-[#e6dfcb]/60 dark:border-[#323d2b]/60">
              <Info className="h-4 w-4 text-[#e0a861]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#2c3324] dark:text-[#fefcf1]">
                7. Status & Portal Visibility
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Gathering Lifecycle Status"
                name="status"
                defaultValue={event.status}
                options={[
                  { value: 'UPCOMING', label: '🟢 UPCOMING (Open for delegate registration)' },
                  { value: 'ONGOING', label: '🟡 ONGOING (Currently taking place)' },
                  { value: 'COMPLETED', label: '⚪ COMPLETED (Gathering concluded)' },
                  { value: 'CANCELLED', label: '🔴 CANCELLED (Event cancelled)' },
                  { value: 'ARCHIVED', label: '📦 ARCHIVED (Historical archive only)' },
                ]}
              />

              <div className="p-4 rounded-2xl bg-[#f8f4e3] dark:bg-[#252e1f] border border-[#e6dfcb] dark:border-[#323d2b] flex items-center justify-between">
                <div className="space-y-0.5">
                  <strong className="block text-xs font-bold text-[#2c3324] dark:text-[#fefcf1]">
                    Published on Website
                  </strong>
                  <span className="text-[11px] text-[#707666] dark:text-[#a3ab98] block">
                    When active, event is visible to public visitors.
                  </span>
                </div>
                <input
                  type="checkbox"
                  name="isPublished"
                  defaultChecked={event.isPublished}
                  className="h-5 w-5 rounded-lg border-[#e6dfcb] dark:border-[#323d2b] text-[#2c3324] dark:text-[#e0a861] focus:ring-[#e0a861] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </CardContent>

        {/* Form Action Footer */}
        <CardFooter className="flex items-center justify-between gap-4 border-t border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/40 dark:bg-[#252e1f]/40 p-6 sm:p-8">
          <Link href="/admin/events">
            <Button type="button" variant="outline" size="md" className="rounded-xl px-5">
              <span>Cancel</span>
            </Button>
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isPending}
            className="gap-2 rounded-xl px-7 shadow-md font-bold text-sm"
          >
            <Save className="h-4 w-4" />
            <span>Save Gathering Changes</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
