/**
 * Unit Tests for Events & Event Registrations (GCash, Desk Payment, Free Admission)
 * Runner: Node test runner (npx tsx --test tests/events.test.ts)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { eventSchema, eventRegistrationSchema } from '../lib/validators';
import {
  formatDate,
  formatDateOnly,
  formatTimeOnly,
  formatDateForDateInput,
  formatTimeForTimeInput,
  formatEventSchedule,
  parsePhilippineDateObject,
} from '../lib/utils';
import { parseSchedule } from '../components/events/admin-schedule-builder';

describe('Event Creation & Update Schema Tests', () => {
  it('should validate an event with registrationFee', () => {
    const validEvent = {
      title: 'PCYC National Youth Camp 2026',
      slug: 'pcyc-national-youth-camp-2026',
      description: 'Annual gathering of Christadelphian young people from across the Philippines.',
      location: 'Cubao Ecclesial Hall, Quezon City',
      startDate: '2026-12-26',
      endDate: '2026-12-30',
      registrationFee: 500,
      isPublished: true,
      maxAttendees: 150,
      status: 'UPCOMING' as const,
    };

    const result = eventSchema.safeParse(validEvent);
    assert.equal(result.success, true, 'Event with registration fee should be valid');
    if (result.success) {
      assert.equal(result.data.registrationFee, 500);
      assert.equal(result.data.title, 'PCYC National Youth Camp 2026');
    }
  });

  it('should allow 0 for Free fellowship events', () => {
    const freeEvent = {
      title: 'Metro Manila Youth Bible Fellowship',
      slug: 'metro-manila-youth-bible-fellowship',
      description: 'Monthly study circle and psalm praise afternoon.',
      location: 'Manila Ecclesia',
      startDate: '2026-09-15',
      endDate: '2026-09-15',
      registrationFee: 0,
      isPublished: true,
      status: 'UPCOMING' as const,
    };

    const result = eventSchema.safeParse(freeEvent);
    assert.equal(result.success, true, 'Free event (fee = 0) should be valid');
    if (result.success) {
      assert.equal(result.data.registrationFee, 0);
    }
  });

  it('should reject events with negative registration fees', () => {
    const invalidFeeEvent = {
      title: 'Invalid Fee Camp',
      slug: 'invalid-fee-camp',
      description: 'Some description about the camp fellowship.',
      location: 'Cebu City',
      startDate: '2026-10-01',
      endDate: '2026-10-03',
      registrationFee: -100,
    };

    const result = eventSchema.safeParse(invalidFeeEvent);
    assert.equal(result.success, false, 'Negative fee must be rejected');
  });

  it('should accept ARCHIVED status for historical events', () => {
    const archivedEvent = {
      title: 'PCYC National Youth Camp 2024',
      slug: 'pcyc-national-youth-camp-2024',
      description: 'Historical archive of the 2024 national youth gathering.',
      location: 'Baguio City',
      startDate: '2024-12-26',
      endDate: '2024-12-30',
      registrationFee: 0,
      status: 'ARCHIVED' as const,
    };

    const result = eventSchema.safeParse(archivedEvent);
    assert.equal(result.success, true, 'ARCHIVED status should be valid');
    if (result.success) {
      assert.equal(result.data.status, 'ARCHIVED');
    }
  });

  it('should reject events where endDate is before startDate', () => {
    const invertedDateEvent = {
      title: 'Invalid Date Range Gathering',
      slug: 'invalid-date-range-gathering',
      description: 'Testing that closing date cannot precede start date.',
      location: 'Manila Ecclesial Hall',
      startDate: '2026-12-30T08:00:00+08:00',
      endDate: '2026-12-26T17:00:00+08:00',
      registrationFee: 0,
    };

    const result = eventSchema.safeParse(invertedDateEvent);
    assert.equal(result.success, false, 'End date earlier than start date must fail validation');
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.endDate, 'Field error on endDate should be present');
      assert.match(fieldErrors.endDate![0], /earlier than start date/i);
    }
  });

  it('should accept events where endDate is on the same day as startDate', () => {
    const singleDayEvent = {
      title: 'One Day Youth Bible Conference',
      slug: 'one-day-youth-bible-conference',
      description: 'Single day intensive study for young brothers and sisters.',
      location: 'Cubao Ecclesia',
      startDate: '2026-10-15T08:00:00+08:00',
      endDate: '2026-10-15T17:00:00+08:00',
      registrationFee: 150,
      isPublished: true,
    };

    const result = eventSchema.safeParse(singleDayEvent);
    assert.equal(result.success, true, 'Same day event should pass validation');
  });

  it('should accept schedule JSON with day and session information', () => {
    const schedulePayload = [
      { day: 'Day 01', time: '1:00 PM – 4:00 PM', title: 'Arrival & Check-in', description: 'Registration desk' },
      { day: 'Day 02', time: '8:30 AM – 11:30 AM', title: 'Morning Study', description: 'Interactive circle' },
    ];

    const eventWithSchedule = {
      title: 'PCYC Camp with Timetable',
      slug: 'pcyc-camp-with-timetable',
      description: 'Annual gathering with full itinerary schedule.',
      location: 'Cubao Ecclesial Hall',
      startDate: '2026-12-26T08:00:00+08:00',
      endDate: '2026-12-30T17:00:00+08:00',
      registrationFee: 500,
      schedule: JSON.stringify(schedulePayload),
    };

    const result = eventSchema.safeParse(eventWithSchedule);
    assert.equal(result.success, true, 'Event with schedule JSON should be valid');
  });
});

describe('Event Registration Schema Tests', () => {
  it('should validate GCash registration when referenceNumber is provided', () => {
    const validGcashReg = {
      eventId: 'df2435e4-5d09-43fd-a306-429d579280a6',
      paymentOption: 'GCASH' as const,
      referenceNumber: '100489201827',
      specialRequirements: 'Vegetarian meals preferred',
    };

    const result = eventRegistrationSchema.safeParse(validGcashReg);
    assert.equal(result.success, true, 'GCash registration with reference number should pass');
    if (result.success) {
      assert.equal(result.data.paymentOption, 'GCASH');
      assert.equal(result.data.referenceNumber, '100489201827');
    }
  });

  it('should reject GCash registration if referenceNumber is missing or too short', () => {
    const invalidGcashReg = {
      eventId: 'df2435e4-5d09-43fd-a306-429d579280a6',
      paymentOption: 'GCASH' as const,
      referenceNumber: '1', // too short
    };

    const result = eventRegistrationSchema.safeParse(invalidGcashReg);
    assert.equal(result.success, false, 'GCash registration without valid ref number must be rejected');
  });

  it('should validate VENUE_DESK (Pay at Venue) registration without reference number', () => {
    const validDeskReg = {
      eventId: 'df2435e4-5d09-43fd-a306-429d579280a6',
      paymentOption: 'VENUE_DESK' as const,
      specialRequirements: 'Arriving by bus in the afternoon',
    };

    const result = eventRegistrationSchema.safeParse(validDeskReg);
    assert.equal(result.success, true, 'Venue desk payment registration should pass without reference number');
    if (result.success) {
      assert.equal(result.data.paymentOption, 'VENUE_DESK');
    }
  });

  it('should validate FREE admission registration', () => {
    const validFreeReg = {
      eventId: 'df2435e4-5d09-43fd-a306-429d579280a6',
      paymentOption: 'FREE' as const,
    };

    const result = eventRegistrationSchema.safeParse(validFreeReg);
    assert.equal(result.success, true, 'Free event registration should pass');
  });
});

describe('Event Date Timezone & Timetable Accuracy Tests', () => {
  it('should format date and time accurately for Philippine timezone inputs', () => {
    // 8:00 AM Manila on Dec 26, 2026 is 00:00:00 UTC on Dec 26, 2026
    const morningDate = new Date('2026-12-26T00:00:00.000Z');
    assert.equal(formatDateForDateInput(morningDate), '2026-12-26');
    assert.equal(formatTimeForTimeInput(morningDate), '08:00');

    // 5:00 PM Manila on Dec 30, 2026 is 09:00:00 UTC on Dec 30, 2026
    const eveningDate = new Date('2026-12-30T09:00:00.000Z');
    assert.equal(formatDateForDateInput(eveningDate), '2026-12-30');
    assert.equal(formatTimeForTimeInput(eveningDate), '17:00');

    // 7:00 AM Manila on Dec 26, 2026 is 23:00:00 UTC on Dec 25, 2026 (day before in UTC)
    // Must correctly evaluate to Dec 26 in Asia/Manila, NOT Dec 25!
    const earlyMorningDate = new Date('2026-12-25T23:00:00.000Z');
    assert.equal(formatDateForDateInput(earlyMorningDate), '2026-12-26');
    assert.equal(formatTimeForTimeInput(earlyMorningDate), '07:00');
  });

  it('should preserve Philippine time without host timezone skew for un-offset ISO and date strings', () => {
    // Strings without timezone offsets must be anchored to Philippine Time (+08:00)
    assert.equal(formatDateForDateInput('2026-12-26'), '2026-12-26');
    assert.equal(formatTimeForTimeInput('14:30'), '14:30');
    assert.equal(formatTimeForTimeInput('9:05'), '09:05');
    assert.equal(formatTimeForTimeInput('2026-12-26T14:30:00'), '14:30');
    assert.equal(formatDateForDateInput('2026-12-26T18:00:00'), '2026-12-26');
    assert.equal(parsePhilippineDateObject('2026-12-26').toISOString(), '2026-12-25T16:00:00.000Z');
  });

  it('should format single-day event schedules cleanly without day-boundary skew', () => {
    const start = new Date('2026-10-15T00:00:00.000Z'); // 8:00 AM Manila
    const end = new Date('2026-10-15T09:00:00.000Z');   // 5:00 PM Manila
    const formatted = formatEventSchedule(start, end);

    assert.ok(formatted.includes('Oct 15, 2026'), `Should contain date: ${formatted}`);
    assert.ok(formatted.includes('8:00 AM'), `Should contain start time: ${formatted}`);
    assert.ok(formatted.includes('5:00 PM'), `Should contain end time: ${formatted}`);
    assert.ok(formatted.includes('•'), `Should use same-day separator '•': ${formatted}`);
  });

  it('should format same-day same-time events cleanly without duplicating time range', () => {
    const start = new Date('2026-10-15T00:00:00.000Z'); // 8:00 AM Manila
    const end = new Date('2026-10-15T00:00:00.000Z');   // 8:00 AM Manila
    const formatted = formatEventSchedule(start, end);

    assert.equal(formatted, 'Oct 15, 2026 • 8:00 AM');
  });

  it('should format multi-day event schedules with start and end dates', () => {
    const start = new Date('2026-12-26T00:00:00.000Z'); // Dec 26 8:00 AM Manila
    const end = new Date('2026-12-30T09:00:00.000Z');   // Dec 30 5:00 PM Manila
    const formatted = formatEventSchedule(start, end);

    assert.ok(formatted.includes('Dec 26, 2026'), `Should contain start date: ${formatted}`);
    assert.ok(formatted.includes('Dec 30, 2026'), `Should contain end date: ${formatted}`);
    assert.ok(formatted.includes('–'), `Should contain range separator: ${formatted}`);
  });

  it('should handle invalid or unparseable dates gracefully without crashing', () => {
    assert.equal(formatDateForDateInput('invalid-date'), '');
    assert.equal(formatTimeForTimeInput('invalid-date'), '08:00');
    assert.equal(formatDate('invalid-date'), '');
    assert.equal(formatDateOnly('invalid-date'), '');
    assert.equal(formatTimeOnly('invalid-date'), '');
    assert.equal(formatEventSchedule('invalid-date', 'invalid-date'), '');
  });

  it('should reject invalid unparseable dates in eventSchema', () => {
    const corruptDateEvent = {
      title: 'Corrupt Date Gathering',
      slug: 'corrupt-date-gathering',
      description: 'Testing that invalid date string fails schema parsing.',
      location: 'Cubao Ecclesial Hall',
      startDate: 'not-a-real-date',
      endDate: '2026-12-30T17:00:00+08:00',
    };

    const result = eventSchema.safeParse(corruptDateEvent);
    assert.equal(result.success, false, 'Unparseable start date must fail schema validation');
    if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.startDate, 'startDate should have field error');
    }
  });

  it('should reject registration deadline after event start date', () => {
    const lateDeadlineEvent = {
      title: 'Late Registration Gathering',
      slug: 'late-registration-gathering',
      description: 'Testing that registration deadline cannot be after start date.',
      location: 'Cubao Ecclesial Hall',
      startDate: '2026-10-15T08:00:00+08:00',
      endDate: '2026-10-17T17:00:00+08:00',
      registrationDeadline: '2026-10-18T23:59:00+08:00', // After start date!
    };

    const result = eventSchema.safeParse(lateDeadlineEvent);
    assert.equal(result.success, false, 'Registration deadline after start date must fail validation');
    if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.registrationDeadline, 'registrationDeadline should have field error');
    }
  });

  it('should accept valid registration deadline before event start date', () => {
    const validDeadlineEvent = {
      title: 'Valid Registration Gathering',
      slug: 'valid-registration-gathering',
      description: 'Testing valid registration deadline.',
      location: 'Cubao Ecclesial Hall',
      startDate: '2026-10-15T08:00:00+08:00',
      endDate: '2026-10-17T17:00:00+08:00',
      registrationDeadline: '2026-10-10T23:59:00+08:00',
    };

    const result = eventSchema.safeParse(validDeadlineEvent);
    assert.equal(result.success, true, 'Valid registration deadline should pass schema validation');
  });

  it('should safely parse diverse initialSchedule formats in parseSchedule', () => {
    // Array format
    const arr = [{ day: 'Day 01', time: '8:00 AM', title: 'Breakfast', description: '' }];
    assert.deepEqual(parseSchedule(arr), arr);

    // JSON string format
    assert.deepEqual(parseSchedule(JSON.stringify(arr)), arr);

    // Null and undefined
    assert.deepEqual(parseSchedule(null), []);
    assert.deepEqual(parseSchedule(undefined), []);

    // Corrupt JSON string
    assert.deepEqual(parseSchedule('not-valid-json{]'), []);

    // Non-array JSON
    assert.deepEqual(parseSchedule('{"day": "Day 01"}'), []);
  });
});
