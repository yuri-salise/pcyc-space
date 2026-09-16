import { pgTable, uuid, text, timestamp, boolean, integer, numeric, pgEnum, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './users';

export const eventStatusEnum = pgEnum('event_status', ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED', 'ARCHIVED']);
export const registrationStatusEnum = pgEnum('registration_status', ['CONFIRMED', 'PENDING_PAYMENT', 'VERIFICATION_QUEUED', 'CANCELLED']);

/**
 * Events Table
 * Manages PCYC youth gatherings, bible camps, fellowship activities, and history.
 */
export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    theme: text('theme'),
    bannerUrl: text('banner_url'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    location: text('location').notNull(),
    schedule: jsonb('schedule'),
    checklist: jsonb('checklist'),
    registrationFee: numeric('registration_fee', { precision: 10, scale: 2 }).default('0.00').notNull(),
    isPublished: boolean('is_published').default(false).notNull(),
    status: eventStatusEnum('status').default('UPCOMING').notNull(),
    maxAttendees: integer('max_attendees'),
    registrationDeadline: timestamp('registration_deadline', { withTimezone: true }),
    createdById: uuid('created_by_id').references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_events_public_status').on(table.isPublished, table.status),
    index('idx_events_feed').on(table.isPublished, table.status, table.startDate.asc()),
    index('idx_events_start_date').on(table.startDate),
    index('idx_events_created_at').on(table.createdAt),
  ]
);

/**
 * Event Registrations Junction Table
 * 
 * Maps users (profiles) to events they have signed up for. Acts as the primary ledger for
 * event attendance, ticketing, and fee collection tracking (GCash/Venue).
 * Maintains a strict Unique Constraint on (eventId, userId) to prevent duplicate registrations.
 */
export const eventRegistrations = pgTable(
  'event_registrations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    status: text('status').default('CONFIRMED').notNull(),
    paymentOption: text('payment_option').default('VENUE_DESK').notNull(), // 'GCASH' | 'VENUE_DESK' | 'FREE'
    paymentStatus: text('payment_status').default('UNPAID').notNull(), // 'PAID' | 'VERIFICATION_QUEUED' | 'UNPAID' | 'FREE'
    referenceNumber: text('reference_number'),
    receiptImageUrl: text('receipt_image_url'),
    amountPaid: numeric('amount_paid', { precision: 10, scale: 2 }),
    specialRequirements: text('special_requirements'),
    registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_event_registrations_event_user').on(table.eventId, table.userId),
    index('idx_event_registrations_user_id').on(table.userId),
    index('idx_event_registrations_event_id').on(table.eventId),
    index('idx_event_registrations_payment_status').on(table.paymentStatus),
  ]
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;

