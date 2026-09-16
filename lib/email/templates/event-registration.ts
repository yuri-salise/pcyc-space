import { renderBaseEmailLayout } from './base';
import { formatPHP, formatDate } from '@/lib/utils';

export interface EventRegistrationEmailData {
  userName: string;
  userDesignation?: string;
  userEcclesia?: string | null;
  eventTitle: string;
  eventTheme?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  location: string;
  registrationFee: number | string;
  paymentOption: 'GCASH' | 'VENUE_DESK' | 'FREE' | string;
  paymentStatus: 'PAID' | 'VERIFICATION_QUEUED' | 'UNPAID' | 'CONFIRMED' | string;
  paymentPlatform?: string;
  referenceNumber?: string | null;
  specialRequirements?: string | null;
}

export function renderEventRegistrationEmail(data: EventRegistrationEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pcyc-space.vercel.app';
  const prefix =
    data.userDesignation === 'BROTHER'
      ? 'Brother'
      : data.userDesignation === 'SISTER'
      ? 'Sister'
      : 'Friend';

  const fee = typeof data.registrationFee === 'number' ? data.registrationFee : parseFloat(data.registrationFee || '0');
  const feeDisplay = fee === 0 ? 'FREE (No Fee)' : formatPHP(fee);

  const platform = data.paymentPlatform || (data.paymentOption === 'GCASH' ? 'GCash' : 'Online Payment');

  const paymentBadgeColor =
    data.paymentStatus === 'CONFIRMED' || data.paymentStatus === 'PAID'
      ? '#2e7d32'
      : data.paymentStatus === 'VERIFICATION_QUEUED'
      ? '#b78103'
      : '#c0392b';

  const paymentStatusText =
    data.paymentStatus === 'CONFIRMED' || data.paymentStatus === 'PAID'
      ? 'Paid / Confirmed'
      : data.paymentStatus === 'VERIFICATION_QUEUED'
      ? `${platform} Verification Queued`
      : 'Payment Due at Venue Desk';

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #2c3324;">
      Dear ${prefix} ${data.userName},
    </p>
    <p style="margin: 0 0 20px 0;">
      Your registration for <strong>${data.eventTitle}</strong> has been successfully received! Here are your gathering and ticket details:
    </p>

    <!-- Event Summary Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fbf1e2; border: 1px solid #e0a861; border-radius: 14px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <h2 style="margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 18px; color: #2c3324;">
            ${data.eventTitle}
          </h2>
          ${data.eventTheme ? `<p style="margin: 0 0 12px 0; font-style: italic; color: #707666; font-size: 13px;">Theme: &ldquo;${data.eventTheme}&rdquo;</p>` : ''}
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: #2c3324; margin-top: 8px;">
            <tr>
              <td style="padding: 4px 0; width: 100px; color: #707666; font-weight: 600;">Dates:</td>
              <td style="padding: 4px 0; font-weight: 600;">${formatDate(data.startDate)} &ndash; ${formatDate(data.endDate)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #707666; font-weight: 600;">Venue:</td>
              <td style="padding: 4px 0; font-weight: 600;">${data.location}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #707666; font-weight: 600;">Fee:</td>
              <td style="padding: 4px 0; font-weight: 700; color: #2c3324;">${feeDisplay}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Payment & Verification Status -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f4e3; border: 1px solid #e6dfcb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #707666; text-transform: uppercase; letter-spacing: 0.5px;">Registration Status</p>
          <div style="margin-bottom: 8px;">
            <span style="display: inline-block; padding: 4px 10px; background-color: ${paymentBadgeColor}; color: #ffffff; border-radius: 6px; font-size: 12px; font-weight: 700;">
              ${paymentStatusText}
            </span>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #2c3324;"><strong>Payment Option:</strong> ${data.paymentOption === 'GCASH' ? `${data.paymentPlatform || 'Online Payment'} Transfer` : data.paymentOption === 'FREE' ? 'Free Event' : 'Payment at Venue Desk'}</p>
          ${data.referenceNumber ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #2c3324;"><strong>${data.paymentPlatform || 'Online Payment'} Reference #:</strong> <code style="background-color: #e6dfcb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${data.referenceNumber}</code></p>` : ''}
          ${data.specialRequirements ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #2c3324;"><strong>Notes/Dietary:</strong> ${data.specialRequirements}</p>` : ''}
        </td>
      </tr>
    </table>

    <!-- What to Bring Checklist -->
    <div style="background-color: #ffffff; border: 1px solid #e6dfcb; padding: 18px 20px; border-radius: 12px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-weight: 700; font-size: 14px; color: #2c3324;">🎒 What to Bring & Reminders:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #505748; line-height: 1.7;">
        <li>Bible, notebook, and pens for study workshops.</li>
        <li>Modest and comfortable attire suitable for worship and activities.</li>
        <li>Personal toiletries, towels, and maintenance medications (if applicable).</li>
        <li>Valid government or school ID for venue registration desk check-in.</li>
      </ul>
    </div>

    <p style="margin: 0; font-size: 13px; color: #707666; text-align: center;">
      We look forward to fellowshipping with you in the Lord's work!
    </p>
  `;

  return renderBaseEmailLayout({
    previewText: `Your registration for ${data.eventTitle} is confirmed!`,
    badge: 'Camp Registration Confirmed',
    title: 'Registration Confirmation',
    subtitle: data.eventTitle,
    contentHtml,
    ctaButton: {
      text: 'View in Member Space',
      url: `${appUrl}/portal`,
    },
  });
}

export function renderAdminEventRegistrationAlert(data: EventRegistrationEmailData & { userEmail: string }): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pcyc-space.vercel.app';
  const fee = typeof data.registrationFee === 'number' ? data.registrationFee : parseFloat(data.registrationFee || '0');

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #2c3324;">
      A new attendee has registered for an upcoming PCYC gathering:
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f4e3; border: 1px solid #e6dfcb; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 16px 20px; font-size: 14px; color: #2c3324; line-height: 1.7;">
          <p style="margin: 0;"><strong>Attendee:</strong> ${data.userName} (${data.userDesignation || 'Member'})</p>
          <p style="margin: 0;"><strong>Email:</strong> ${data.userEmail}</p>
          ${data.userEcclesia ? `<p style="margin: 0;"><strong>Ecclesia:</strong> ${data.userEcclesia}</p>` : ''}
          <p style="margin: 0;"><strong>Event:</strong> ${data.eventTitle}</p>
          <p style="margin: 0;"><strong>Payment Mode:</strong> ${data.paymentOption} (${fee === 0 ? 'FREE' : formatPHP(fee)})</p>
          ${data.referenceNumber ? `<p style="margin: 0;"><strong>${data.paymentPlatform || 'Online Payment'} Ref #:</strong> ${data.referenceNumber}</p>` : ''}
          ${data.specialRequirements ? `<p style="margin: 0;"><strong>Special Notes:</strong> ${data.specialRequirements}</p>` : ''}
        </td>
      </tr>
    </table>
  `;

  return renderBaseEmailLayout({
    previewText: `New attendee registration for ${data.eventTitle}: ${data.userName}`,
    badge: 'Admin Alert',
    title: 'New Event Registration',
    subtitle: data.eventTitle,
    contentHtml,
    ctaButton: {
      text: 'View Admin Events & Manifests',
      url: `${appUrl}/admin/events`,
    },
  });
}
