'use client';

import React, { useActionState, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { createEventAction, AdminEventActionState } from '@/app/actions/events';
import { formatDateForDateInput, formatTimeForTimeInput } from '@/lib/utils';
import { AdminScheduleBuilder } from '@/components/events/admin-schedule-builder';
import { AdminChecklistBuilder } from '@/components/events/admin-checklist-builder';
import {
  Calendar,
  AlertCircle,
  Wand2,
  FileText,
  Sparkles,
  Clock,
  MapPin,
  Info,
  ArrowLeft,
} from 'lucide-react';

const initialState: AdminEventActionState = {
  success: false,
};

export default function NewEventPage() {
  const [state, formAction, isPending] = useActionState(createEventAction, initialState);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [fee, setFee] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('17:00');
  const [registrationDeadline, setRegistrationDeadline] = useState('');

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
    if (state.payload.registrationDeadline) {
      setRegistrationDeadline(formatDateForDateInput(state.payload.registrationDeadline));
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-xs text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1] font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Events Management</span>
        </Link>

        <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-[#e0a861]/15 text-[#9a6423] dark:text-[#f0be7c] border border-[#e0a861]/30">
          PCYC Event CMS
        </span>
      </div>

      <Card className="shadow-xl rounded-3xl border border-[#e6dfcb] dark:border-[#323d2b] overflow-hidden bg-white dark:bg-[#1b2117]">
        <form action={formAction}>
          {/* Header Banner */}
          <CardHeader className="border-b border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/60 dark:bg-[#252e1f]/60 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#2c3324] text-[#e0a861] flex items-center justify-center shadow-xs">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-serif text-2xl sm:text-3xl font-bold text-[#2c3324] dark:text-[#fefcf1]">
                  Create New PCYC Gathering
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-[#707666] dark:text-[#a3ab98] mt-1">
                  Fill in event information, schedules, packing guidelines, and ticketing details below.
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
                  <strong className="block font-bold">Submission Incomplete</strong>
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
                    Official public name of the camp or fellowship gathering.
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
                        <span>Auto-sync with Title</span>
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
                    Preview: <span className="font-mono text-[#9a6423] dark:text-[#f0be7c]">/events/{slug || '...'}</span>
                  </p>
                </div>
              </div>

              {/* Scriptural Theme */}
              <div className="space-y-1">
                <Input
                  label="Spiritual Theme / Scriptural Motto (Optional)"
                  name="theme"
                  key={state?.payload?.theme || 'theme'}
                  defaultValue={state?.payload?.theme || ''}
                  placeholder="e.g. Anchored in Hope: Laying Hold on Eternal Life (Hebrews 6:19)"
                  error={state?.fieldErrors?.theme?.[0]}
                />
                <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                  Scripture passage or theme highlighted in quotes on the event banner.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Textarea
                  label="Event Overview & Fellowship Description"
                  name="description"
                  key={state?.payload?.description || 'desc'}
                  defaultValue={state?.payload?.description || ''}
                  placeholder="Provide an inspiring summary of the camp, lesson focus, guest speakers, accommodation arrangements, and travel logistics..."
                  required
                  rows={4}
                  error={state?.fieldErrors?.description?.[0]}
                />
                <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                  Detailed overview shown in the &quot;About This Gathering&quot; section.
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

              <ImageUpload
                name="imageFile"
                label="Attach Banner Image from Device"
                helperText="Recommended: 1920x800 px (Landscape 21:9 or 16:9) • PNG, JPG, or WEBP • Max 10MB"
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
                    key={state?.payload?.location || 'loc'}
                    defaultValue={state?.payload?.location || ''}
                    placeholder="e.g. Cubao Ecclesial Hall, Quezon City"
                    required
                    error={state?.fieldErrors?.location?.[0]}
                  />
                  <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                    Venue address or campsite name.
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
                    key={state?.payload?.maxAttendees || 'max'}
                    defaultValue={state?.payload?.maxAttendees || ''}
                    placeholder="e.g. 150 (leave blank for unlimited)"
                    error={state?.fieldErrors?.maxAttendees?.[0]}
                  />
                  <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                    Caps automated registrations once reached.
                  </p>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTION 5: DYNAMIC ITINERARY BUILDER */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-3xl border border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/30 dark:bg-[#1b2117]/30">
              <AdminScheduleBuilder
                initialSchedule={state?.payload?.schedule}
                startDate={startDate}
                endDate={endDate}
              />
            </div>

            {/* ======================================================== */}
            {/* SECTION 6: DYNAMIC PACKING CHECKLIST BUILDER */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-3xl border border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/30 dark:bg-[#1b2117]/30">
              <AdminChecklistBuilder initialChecklist={state?.payload?.checklist} />
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
                  defaultValue="UPCOMING"
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
                      Publish to Public Website
                    </strong>
                    <span className="text-[11px] text-[#707666] dark:text-[#a3ab98] block">
                      Make this gathering immediately discoverable on PCYC Space.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    name="isPublished"
                    defaultChecked
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
              <Sparkles className="h-4 w-4" />
              <span>Publish Gathering</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
