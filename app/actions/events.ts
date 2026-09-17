'use server';

import { db } from '@/lib/db';
import { events, eventRegistrations } from '@/lib/db/schema/events';
import { getCurrentUserProfile } from '@/lib/db/queries/users';
import { eventSchema } from '@/lib/validators';
import { logger } from '@/lib/logger';
import { saveUploadedImage } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { CACHE_TAGS, invalidateCacheTag } from '@/lib/db/queries/cached';
import { redirect } from 'next/navigation';
import { eq, and, ne, sql } from 'drizzle-orm';
import { dispatchNotification } from '@/lib/notifications/dispatcher';
import { getPaymentSettings } from '@/lib/db/queries/settings';
import {
  renderEventRegistrationEmail,
  renderAdminEventRegistrationAlert,
} from '@/lib/email/templates/event-registration';
import { formatDateForDateInput, formatTimeForTimeInput } from '@/lib/utils';

export interface EventFormPayload {
  title?: string;
  slug?: string;
  theme?: string;
  description?: string;
  bannerUrl?: string;
  registrationFee?: number;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  maxAttendees?: number;
  registrationDeadline?: string;
  isPublished?: boolean;
  status?: string;
  schedule?: string;
  checklist?: string;
}

export interface AdminEventActionState {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  payload?: EventFormPayload;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return String(error || 'An unexpected error occurred.');
}

function isNextError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const candidate = err as { digest?: unknown; message?: unknown };
  const digest = typeof candidate.digest === 'string' ? candidate.digest : '';
  const message = typeof candidate.message === 'string' ? candidate.message : '';
  return (
    digest === 'DYNAMIC_SERVER_USAGE' ||
    message.includes('DYNAMIC_SERVER_USAGE') ||
    digest.startsWith('NEXT_') ||
    message === 'NEXT_REDIRECT'
  );
}

export async function confirmEventRegistrationPaymentAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  return reviewEventRegistrationPaymentAction(formData, 'APPROVED');
}

export async function declineEventRegistrationPaymentAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  return reviewEventRegistrationPaymentAction(formData, 'DECLINED');
}

async function reviewEventRegistrationPaymentAction(
  formData: FormData,
  decision: 'APPROVED' | 'DECLINED'
): Promise<{ success: boolean; message?: string; error?: string }> {
  const registrationId = formData.get('registrationId') as string | null;
  const eventId = formData.get('eventId') as string | null;
  const reviewNote = ((formData.get('reviewNote') as string | null) || '').trim();

  if (!registrationId || !eventId) {
    return { success: false, error: 'Registration details are missing.' };
  }

  const profile = await getCurrentUserProfile();
  if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN')) {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  try {
    const [registration] = await db
      .select()
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.id, registrationId), eq(eventRegistrations.eventId, eventId)))
      .limit(1);

    if (!registration) {
      return { success: false, error: 'Registration not found.' };
    }

    if (registration.paymentOption === 'FREE') {
      return { success: true, message: 'Free registration is already verified.' };
    }

    if (decision === 'APPROVED') {
      await db
        .update(eventRegistrations)
        .set({
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          specialRequirements: reviewNote
            ? `${registration.specialRequirements || ''}\nPayment verified: ${reviewNote}`.trim()
            : registration.specialRequirements,
        })
        .where(eq(eventRegistrations.id, registrationId));
    } else {
      await db
        .update(eventRegistrations)
        .set({
          status: 'CANCELLED',
          paymentStatus: 'DECLINED',
          receiptImageUrl: null,
          specialRequirements: `${registration.specialRequirements || ''}\nPayment declined: ${
            reviewNote || 'Submitted proof could not be verified.'
          }`.trim(),
        })
        .where(eq(eventRegistrations.id, registrationId));
    }

    revalidatePath(`/admin/events/${eventId}/attendees`);
    revalidatePath(`/admin/events/${eventId}/print`);
    revalidatePath('/portal');

    if (decision === 'DECLINED') {
      await dispatchNotification({
        userId: registration.userId,
        type: 'EVENT_REGISTRATION',
        title: `Payment Review Needed`,
        message: `Your event payment proof was declined. Please register again with valid payment details.${reviewNote ? ` Note: ${reviewNote}` : ''}`,
        linkUrl: `/events/${eventId}`,
        metadata: { eventId, registrationId, decision: 'DECLINED' },
      });
    }

    return {
      success: true,
      message: decision === 'DECLINED'
        ? 'Payment declined. The attendee can register again.'
        : registration.paymentOption === 'VENUE_DESK'
        ? 'Venue payment confirmed.'
        : 'Payment receipt confirmed.',
    };
  } catch (error) {
    logger.error({ error: getErrorMessage(error), registrationId, eventId }, 'Failed to confirm event registration payment');
    return { success: false, error: 'Unable to confirm this attendee payment.' };
  }
}

/**
 * Normalizes input date and time into a precise Philippine Standard Time (UTC+8) ISO-8601 string.
 */
function parsePhilippineDateTime(dateStr: string, timeStr?: string): string {
  if (!dateStr) return '';

  const cleanDate = formatDateForDateInput(dateStr);
  if (!cleanDate) return '';

  let rawTime = (timeStr || '').trim();
  if (!rawTime && dateStr.includes('T')) {
    rawTime = formatTimeForTimeInput(dateStr);
  }
  if (!rawTime) {
    rawTime = '00:00';
  }

  const cleanTime = rawTime.slice(0, 5) || '00:00';
  const normalizedTime = cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime;
  return `${cleanDate}T${normalizedTime}+08:00`;
}

/**
 * Safely parses JSON string representation of schedule or checklist.
 */
function parseJsonArraySafe(jsonStr?: string | null): unknown[] | null {
  if (!jsonStr) return null;
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Server Action for Admins to create a new live Event in PostgreSQL.
 */
export async function createEventAction(
  prevState: AdminEventActionState,
  formData: FormData
): Promise<AdminEventActionState> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN')) {
      return {
        success: false,
        error: 'Unauthorized: You must have an Admin account to publish events.',
      };
    }

    // Handle Image File from Device Upload
    let bannerUrl = '/images/logo/pcyc-transparent-logo.png';
    const imageFile = formData.get('imageFile') as File | null;

    if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
      const slugPrefix = (formData.get('slug') as string) || 'event';
      const uploadResult = await saveUploadedImage(imageFile, 'events', slugPrefix);

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload event banner image.',
        };
      }

      bannerUrl = uploadResult.url!;
    }

    const startDateStr = (formData.get('startDate') as string) || '';
    const startTimeStr = (formData.get('startTime') as string) || '08:00';
    const endDateStr = (formData.get('endDate') as string) || '';
    const endTimeStr = (formData.get('endTime') as string) || '17:00';
    const registrationDeadlineStr = (formData.get('registrationDeadline') as string) || '';

    const combinedStart = parsePhilippineDateTime(startDateStr, startTimeStr);
    const combinedEnd = parsePhilippineDateTime(endDateStr, endTimeStr);
    const combinedDeadline = registrationDeadlineStr
      ? parsePhilippineDateTime(registrationDeadlineStr, '23:59')
      : undefined;

    const rawData: EventFormPayload = {
      title: (formData.get('title') as string) || undefined,
      slug: (formData.get('slug') as string) || undefined,
      theme: (formData.get('theme') as string) || undefined,
      description: (formData.get('description') as string) || undefined,
      bannerUrl: bannerUrl || undefined,
      registrationFee: formData.get('registrationFee') ? Number(formData.get('registrationFee')) : 0,
      startDate: combinedStart,
      startTime: startTimeStr,
      endDate: combinedEnd,
      endTime: endTimeStr,
      location: (formData.get('location') as string) || undefined,
      maxAttendees: formData.get('maxAttendees') ? Number(formData.get('maxAttendees')) : undefined,
      registrationDeadline: combinedDeadline,
      isPublished: formData.get('isPublished') === 'on' || formData.get('isPublished') === 'true',
      status: (formData.get('status') as string) || 'UPCOMING',
      schedule: (formData.get('schedule') as string) || undefined,
      checklist: (formData.get('checklist') as string) || undefined,
    };

    const parsed = eventSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Please correct the highlighted errors in the form.',
        fieldErrors: parsed.error.flatten().fieldErrors,
        payload: rawData,
      };
    }

    try {
      await db.insert(events).values({
        title: parsed.data.title,
        slug: parsed.data.slug,
        theme: parsed.data.theme || null,
        description: parsed.data.description,
        bannerUrl: parsed.data.bannerUrl || bannerUrl,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        location: parsed.data.location,
        registrationFee: parsed.data.registrationFee.toFixed(2),
        maxAttendees: parsed.data.maxAttendees || null,
        registrationDeadline: parsed.data.registrationDeadline ? new Date(parsed.data.registrationDeadline) : null,
        isPublished: parsed.data.isPublished ?? true,
        status: (parsed.data.status as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED') || 'UPCOMING',
        schedule: parseJsonArraySafe(parsed.data.schedule),
        checklist: parseJsonArraySafe(parsed.data.checklist),
      });

      logger.info({ slug: parsed.data.slug, adminId: profile.id }, 'New event created by admin');
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error({ error: message }, 'Failed to insert event into database');
      return {
        success: false,
        error: message.includes('duplicate key')
          ? 'An event with this URL slug already exists. Please choose a unique slug.'
          : 'Failed to create event. Please try again.',
      };
    }

    try {
      invalidateCacheTag(CACHE_TAGS.events, CACHE_TAGS.eventsPublished);
      revalidatePath('/events');
      revalidatePath('/admin/events');
      revalidatePath('/');
    } catch (cacheErr) {
      logger.warn({ error: getErrorMessage(cacheErr) }, 'Cache revalidation warning');
    }

    redirect('/admin/events');
  } catch (err) {
    if (isNextError(err)) {
      throw err;
    }
    const message = getErrorMessage(err);
    logger.error({ error: message }, 'Unhandled error in createEventAction');
    return {
      success: false,
      error: message || 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Server Action for Admins to update an existing Event in PostgreSQL.
 */
export async function updateEventAction(
  prevState: AdminEventActionState,
  formData: FormData
): Promise<AdminEventActionState> {
  try {
    const eventId = formData.get('eventId') as string;
    if (!eventId) {
      logger.warn('Update event attempt rejected: missing eventId');
      return {
        success: false,
        error: 'Invalid request: Event ID is required.',
      };
    }

    // 1. RBAC Guard (Zero-Trust)
    const profile = await getCurrentUserProfile();
    if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN')) {
      logger.warn({ eventId, userId: profile?.id }, 'Unauthorized attempt to edit event');
      return {
        success: false,
        error: 'Unauthorized: You must have an Admin account to edit events.',
      };
    }

    // 2. Banner Image Resolution
    let bannerUrl = (formData.get('existingBannerUrl') as string) || '/images/logo/pcyc-transparent-logo.png';
    const imageFile = formData.get('imageFile') as File | null;

    if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
      const slugPrefix = (formData.get('slug') as string) || 'event';
      const uploadResult = await saveUploadedImage(imageFile, 'events', slugPrefix);

      if (!uploadResult.success) {
        logger.warn({ error: uploadResult.error, eventId }, 'Event image upload rejected during edit');
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload new event banner image.',
        };
      }

      bannerUrl = uploadResult.url!;
    }

    // 3. Extract and Sanitize Form Inputs
    const startDateStr = (formData.get('startDate') as string) || '';
    const startTimeStr = (formData.get('startTime') as string) || '08:00';
    const endDateStr = (formData.get('endDate') as string) || '';
    const endTimeStr = (formData.get('endTime') as string) || '17:00';
    const registrationDeadlineStr = (formData.get('registrationDeadline') as string) || '';

    const combinedStart = parsePhilippineDateTime(startDateStr, startTimeStr);
    const combinedEnd = parsePhilippineDateTime(endDateStr, endTimeStr);
    const combinedDeadline = registrationDeadlineStr
      ? parsePhilippineDateTime(registrationDeadlineStr, '23:59')
      : undefined;

    const rawData: EventFormPayload = {
      title: (formData.get('title') as string) || undefined,
      slug: (formData.get('slug') as string) || undefined,
      theme: (formData.get('theme') as string) || undefined,
      description: (formData.get('description') as string) || undefined,
      bannerUrl: bannerUrl || undefined,
      startDate: combinedStart,
      startTime: startTimeStr,
      endDate: combinedEnd,
      endTime: endTimeStr,
      location: (formData.get('location') as string) || undefined,
      registrationFee: formData.get('registrationFee') ? Number(formData.get('registrationFee')) : 0,
      maxAttendees: formData.get('maxAttendees') ? Number(formData.get('maxAttendees')) : undefined,
      registrationDeadline: combinedDeadline,
      isPublished: formData.get('isPublished') === 'on' || formData.get('isPublished') === 'true',
      status: (formData.get('status') as string) || 'UPCOMING',
      schedule: (formData.get('schedule') as string) || undefined,
      checklist: (formData.get('checklist') as string) || undefined,
    };

    const parsed = eventSchema.safeParse(rawData);
    if (!parsed.success) {
      logger.warn({ eventId, fieldErrors: parsed.error.flatten().fieldErrors }, 'Event update failed schema validation');
      return {
        success: false,
        error: 'Please correct the highlighted errors in the form.',
        fieldErrors: parsed.error.flatten().fieldErrors,
        payload: rawData,
      };
    }

    // 4. Parameterized Database Update
    try {
      await db
        .update(events)
        .set({
          title: parsed.data.title,
          slug: parsed.data.slug,
          theme: parsed.data.theme || null,
          description: parsed.data.description,
          bannerUrl: bannerUrl,
          startDate: new Date(parsed.data.startDate),
          endDate: new Date(parsed.data.endDate),
          location: parsed.data.location,
          registrationFee: parsed.data.registrationFee.toFixed(2),
          maxAttendees: parsed.data.maxAttendees || null,
          registrationDeadline: parsed.data.registrationDeadline ? new Date(parsed.data.registrationDeadline) : null,
          isPublished: parsed.data.isPublished ?? true,
          status: (parsed.data.status as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED') || 'UPCOMING',
          schedule: parseJsonArraySafe(parsed.data.schedule),
          checklist: parseJsonArraySafe(parsed.data.checklist),
          updatedAt: new Date(),
        })
        .where(eq(events.id, eventId));

      logger.info(
        {
          eventId,
          slug: parsed.data.slug,
          adminId: profile.id,
          adminEmail: profile.email,
        },
        'Event successfully updated by administrator'
      );
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error({ error: message, eventId }, 'Failed to update event in database');
      return {
        success: false,
        error: message.includes('duplicate key')
          ? 'An event with this URL slug already exists. Please choose a unique slug.'
          : 'Failed to update event. Please try again.',
      };
    }

    try {
      const existingSlug = (formData.get('existingSlug') as string) || parsed.data.slug;
      invalidateCacheTag(
        CACHE_TAGS.events,
        CACHE_TAGS.eventsPublished,
        CACHE_TAGS.event(parsed.data.slug),
        ...(existingSlug !== parsed.data.slug ? [CACHE_TAGS.event(existingSlug)] : [])
      );
      revalidatePath('/events');
      revalidatePath(`/events/${parsed.data.slug}`);
      if (existingSlug !== parsed.data.slug) {
        revalidatePath(`/events/${existingSlug}`);
      }
      revalidatePath('/admin/events');
      revalidatePath(`/admin/events/${eventId}/edit`);
      revalidatePath('/');
    } catch (cacheErr) {
      logger.warn({ error: getErrorMessage(cacheErr) }, 'Cache revalidation warning');
    }

    redirect('/admin/events');
  } catch (err) {
    if (isNextError(err)) {
      throw err;
    }
    const message = getErrorMessage(err);
    logger.error({ error: message }, 'Unhandled error in updateEventAction');
    return {
      success: false,
      error: message || 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Server Action for Admins to delete an Event and all its attendees.
 */
export async function deleteEventAction(formData: FormData): Promise<void> {
  try {
    const eventId = formData.get('eventId') as string;
    if (!eventId) return;

    const profile = await getCurrentUserProfile();
    if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN')) {
      logger.warn({ eventId }, 'Unauthorized attempt to delete event');
      return;
    }

    try {
      await db.transaction(async (tx) => {
        await tx.delete(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
        await tx.delete(events).where(eq(events.id, eventId));
      });

      logger.info({ eventId, adminId: profile.id }, 'Event and associated attendees deleted by administrator');
      invalidateCacheTag(CACHE_TAGS.events, CACHE_TAGS.eventsPublished);
      revalidatePath('/events');
      revalidatePath('/admin/events');
      revalidatePath('/portal');
      revalidatePath('/');
    } catch (error) {
      logger.error({ error: getErrorMessage(error), eventId }, 'Failed to delete event and attendees');
    }
  } catch (err) {
    logger.error({ error: getErrorMessage(err) }, 'Unhandled error in deleteEventAction');
  }
}

/**
 * Server Action for Admins to archive an Event.
 */
export async function archiveEventAction(formData: FormData): Promise<void> {
  try {
    const eventId = formData.get('eventId') as string;
    if (!eventId) return;

    const profile = await getCurrentUserProfile();
    if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN')) {
      logger.warn({ eventId }, 'Unauthorized attempt to archive event');
      return;
    }

    try {
      await db
        .update(events)
        .set({
          status: 'ARCHIVED',
          updatedAt: new Date(),
        })
        .where(eq(events.id, eventId));

      logger.info({ eventId, adminId: profile.id }, 'Event archived by administrator');
      invalidateCacheTag(CACHE_TAGS.events, CACHE_TAGS.eventsPublished);
      revalidatePath('/events');
      revalidatePath('/admin/events');
      revalidatePath('/');
    } catch (error) {
      logger.error({ error: getErrorMessage(error), eventId }, 'Failed to archive event');
    }
  } catch (err) {
    logger.error({ error: getErrorMessage(err) }, 'Unhandled error in archiveEventAction');
  }
}

/**
 * Server Action for Admins to unarchive an Event.
 */
export async function unarchiveEventAction(formData: FormData): Promise<void> {
  try {
    const eventId = formData.get('eventId') as string;
    if (!eventId) return;

    const profile = await getCurrentUserProfile();
    if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN')) {
      logger.warn({ eventId }, 'Unauthorized attempt to unarchive event');
      return;
    }

    try {
      await db
        .update(events)
        .set({
          status: 'UPCOMING',
          updatedAt: new Date(),
        })
        .where(eq(events.id, eventId));

      logger.info({ eventId, adminId: profile.id }, 'Event unarchived by administrator');
      invalidateCacheTag(CACHE_TAGS.events, CACHE_TAGS.eventsPublished);
      revalidatePath('/events');
      revalidatePath('/admin/events');
      revalidatePath('/');
    } catch (error) {
      logger.error({ error: getErrorMessage(error), eventId }, 'Failed to unarchive event');
    }
  } catch (err) {
    logger.error({ error: getErrorMessage(err) }, 'Unhandled error in unarchiveEventAction');
  }
}

export interface EventRegistrationState {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Server Action for Members to register for an Event with GCash or Venue payment.
 */
export async function registerForEventAction(
  prevState: EventRegistrationState,
  formData: FormData
): Promise<EventRegistrationState> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return {
        success: false,
        error: 'Please log in to your PCYC Member account to register for this event.',
      };
    }

    const eventId = (formData.get('eventId') as string) || '';
    const paymentOption = (formData.get('paymentOption') as 'GCASH' | 'VENUE_DESK' | 'FREE') || 'VENUE_DESK';
    const referenceNumber = ((formData.get('referenceNumber') as string) || '').trim();
    const specialRequirements = ((formData.get('specialRequirements') as string) || '').trim();
    const receiptFile = formData.get('receiptImage') as File | null;

    // 1. Fetch Event
    const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event) {
      return {
        success: false,
        error: 'The requested gathering could not be found.',
      };
    }

    if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Registration is closed for this event.',
      };
    }

    // Enforce registration deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return {
        success: false,
        error: 'Registration deadline has passed for this event.',
      };
    }

    // Enforce max attendee capacity
    if (event.maxAttendees) {
      const [capacityCheck] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, eventId),
            ne(eventRegistrations.status, 'CANCELLED')
          )
        );
      if ((capacityCheck?.count ?? 0) >= event.maxAttendees) {
        return {
          success: false,
          error: 'This event has reached maximum capacity. Registration is closed.',
        };
      }
    }

    // 2. Check if already registered
    const { getUserEventRegistration } = await import('@/lib/db/queries/events');
    const existing = await getUserEventRegistration(profile.id, eventId);
    if (existing && existing.status !== 'CANCELLED') {
      return {
        success: false,
        error: 'You are already registered for this event! Check your Member Portal for details.',
      };
    }

    const feeNum = Number(event.registrationFee || 0);
    const paymentSettings = await getPaymentSettings();

    // 3. Payment Processing
    const finalPaymentOption = feeNum === 0 ? 'FREE' : paymentOption;
    const finalPaymentStatus = feeNum === 0 ? 'FREE' : (paymentOption === 'GCASH' ? 'VERIFICATION_QUEUED' : 'UNPAID');
    const finalRegStatus = feeNum === 0 ? 'CONFIRMED' : (paymentOption === 'GCASH' ? 'VERIFICATION_QUEUED' : 'CONFIRMED');
    let receiptImageUrl: string | null = null;

    if (feeNum > 0 && paymentOption === 'GCASH') {
      if (!referenceNumber || referenceNumber.length < 3) {
        return {
          success: false,
          error: `Please provide your ${paymentSettings.platform} reference number.`,
        };
      }

      if (!receiptFile || (typeof receiptFile === 'object' && receiptFile.size === 0)) {
        return {
          success: false,
          error: `Please upload a screenshot of your ${paymentSettings.platform} payment confirmation receipt.`,
        };
      }

      const uploadResult = await saveUploadedImage(
        receiptFile,
        'receipts',
        `event-reg-${event.slug}-${profile.id}`
      );

      if (!uploadResult.success || !uploadResult.url) {
        return {
          success: false,
          error: uploadResult.error || `Failed to upload ${paymentSettings.platform} receipt proof.`,
        };
      }

      receiptImageUrl = uploadResult.url;
    }

    // 4. Insert into eventRegistrations
    try {
      const registrationValues = {
        eventId: event.id,
        userId: profile.id,
        status: finalRegStatus,
        paymentOption: finalPaymentOption,
        paymentStatus: finalPaymentStatus,
        paymentPlatform: paymentSettings.platform,
        referenceNumber: referenceNumber || null,
        receiptImageUrl: receiptImageUrl,
        amountPaid: feeNum > 0 ? feeNum.toFixed(2) : '0.00',
        specialRequirements: specialRequirements || null,
      };

      await db
        .insert(eventRegistrations)
        .values(registrationValues)
        .onConflictDoUpdate({
          target: [eventRegistrations.eventId, eventRegistrations.userId],
          set: registrationValues,
        });

      logger.info(
        { eventId: event.id, userId: profile.id, paymentOption: finalPaymentOption },
        'User registered for event successfully'
      );

      // Dispatch Attendee Ticket Confirmation & Admin Notification
      const attendeeName = `${profile.firstName} ${profile.lastName}`;
      const regEmailData = {
        userName: attendeeName,
        userDesignation: profile.designation,
        userEcclesia: profile.ecclesia,
        eventTitle: event.title,
        eventTheme: event.theme,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        registrationFee: event.registrationFee,
        paymentOption: finalPaymentOption,
        paymentStatus: finalPaymentStatus,
        referenceNumber: referenceNumber || null,
        specialRequirements: specialRequirements || null,
      };

      await dispatchNotification({
        userId: profile.id,
        type: 'EVENT_REGISTRATION',
        title: `Registered for ${event.title}! 🎟️`,
        message:
          finalPaymentOption === 'GCASH'
            ? `Your registration is queued for payment verification (${paymentSettings.platform} Ref: ${referenceNumber || 'N/A'}).`
            : finalPaymentOption === 'VENUE_DESK'
            ? `Registration confirmed! You can settle the fee (${feeNum > 0 ? `₱${feeNum}` : 'FREE'}) at the venue desk.`
            : `Registration confirmed! See you at ${event.location}.`,
        linkUrl: `/events/${event.slug}`,
        metadata: { eventId: event.id, eventSlug: event.slug, referenceNumber },
        email: {
          to: profile.email,
          subject: `Event Ticket Confirmation: ${event.title}`,
          html: renderEventRegistrationEmail(regEmailData),
        },
        notifyAdmins: true,
        adminAlert: {
          title: `New Registration: ${attendeeName}`,
          message: `${attendeeName} registered for "${event.title}" (${
            finalPaymentOption === 'GCASH' ? paymentSettings.platform : finalPaymentOption
          }).`,
          linkUrl: '/admin/events',
          emailSubject: `[Admin Alert] New Registration for ${event.title}`,
          emailHtml: renderAdminEventRegistrationAlert({
            ...regEmailData,
            userEmail: profile.email,
          }),
        },
      });

      try {
        invalidateCacheTag(CACHE_TAGS.events, CACHE_TAGS.event(event.slug));
        revalidatePath('/events');
        revalidatePath(`/events/${event.slug}`);
        revalidatePath('/portal');
        revalidatePath('/admin/events');
      } catch (cacheErr) {
        logger.warn({ error: getErrorMessage(cacheErr) }, 'Cache revalidation warning');
      }

      return {
        success: true,
        message:
          finalPaymentOption === 'GCASH'
            ? `Registration submitted with ${paymentSettings.platform} payment! Our committee will verify your payment shortly.`
            : finalPaymentOption === 'VENUE_DESK'
            ? 'Registration confirmed! You can settle your registration fee at the venue desk upon arrival.'
            : 'Registration confirmed! We look forward to seeing you at the gathering.',
      };
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error({ error: message, eventId: event.id, userId: profile.id }, 'Failed to save event registration');
      return {
        success: false,
        error: message.includes('unique')
          ? 'You are already registered for this event.'
          : 'Failed to complete registration. Please try again.',
      };
    }
  } catch (err) {
    if (isNextError(err)) {
      throw err;
    }
    const message = getErrorMessage(err);
    logger.error({ error: message }, 'Unhandled error in registerForEventAction');
    return {
      success: false,
      error: message || 'An unexpected error occurred during registration. Please try again.',
    };
  }
}
