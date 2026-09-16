import { renderBaseEmailLayout } from './base';
import { formatPHP } from '@/lib/utils';

export interface PaymentVerificationEmailData {
  userName: string;
  userDesignation?: string;
  orderNumber: string;
  decision: 'APPROVED' | 'REJECTED';
  totalAmount: number | string;
  referenceNumber?: string | null;
  adminNotes?: string | null;
  paymentPlatform?: string;
}

export function renderPaymentVerificationEmail(data: PaymentVerificationEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pcyc-space.vercel.app';
  const prefix =
    data.userDesignation === 'BROTHER'
      ? 'Brother'
      : data.userDesignation === 'SISTER'
      ? 'Sister'
      : 'Friend';

  const isApproved = data.decision === 'APPROVED';
  const total = typeof data.totalAmount === 'number' ? data.totalAmount : parseFloat(data.totalAmount || '0');
  const platform = data.paymentPlatform || (data.referenceNumber?.toUpperCase().startsWith('GCASH') ? 'GCash' : '');
  const approvedHeadline = platform ? `✅ ${platform} Payment Approved!` : '✅ Payment Approved!';

  const contentHtml = isApproved
    ? `
      <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #2c3324;">
        Dear ${prefix} ${data.userName},
      </p>
      <div style="background-color: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0; font-weight: 700; font-size: 15px; color: #2e7d32;">
          ${approvedHeadline}
        </p>
        <p style="margin: 0; font-size: 13px; color: #1b5e20; line-height: 1.6;">
          Your payment for Order <strong>#${data.orderNumber}</strong> (${formatPHP(total)}) has been verified by our committee. Your order is now marked as <strong>PAID</strong>.
        </p>
      </div>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f4e3; border: 1px solid #e6dfcb; border-radius: 12px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 16px 20px; font-size: 13px; color: #2c3324; line-height: 1.7;">
            <p style="margin: 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
            <p style="margin: 0;"><strong>Total Verified:</strong> ${formatPHP(total)}</p>
            ${data.referenceNumber ? `<p style="margin: 0;"><strong>Payment Ref #:</strong> <code style="background-color: #e6dfcb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${data.referenceNumber}</code></p>` : ''}
            ${data.adminNotes ? `<p style="margin: 4px 0 0 0;"><strong>Admin Note:</strong> ${data.adminNotes}</p>` : ''}
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 8px 0; font-weight: 700; font-size: 14px; color: #2c3324;">📦 Next Steps:</p>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #505748; line-height: 1.6;">
        Our merchandise team is now allocating and preparing your items. You will receive an update once your package is ready for pickup or dispatch.
      </p>
    `
    : `
      <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #2c3324;">
        Dear ${prefix} ${data.userName},
      </p>
      <div style="background-color: #fdf2f2; border: 1px solid #f8b4b4; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0; font-weight: 700; font-size: 15px; color: #c0392b;">
          ⚠️ Payment Verification Update Needed
        </p>
        <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.6;">
          We reviewed the payment proof uploaded for Order <strong>#${data.orderNumber}</strong>, but were unable to confirm the transaction.
        </p>
      </div>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f4e3; border: 1px solid #e6dfcb; border-radius: 12px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 16px 20px; font-size: 13px; color: #2c3324; line-height: 1.7;">
            <p style="margin: 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
            <p style="margin: 0;"><strong>Order Total:</strong> ${formatPHP(total)}</p>
            ${data.adminNotes ? `<p style="margin: 6px 0 0 0; color: #c0392b;"><strong>Reason / Notes:</strong> ${data.adminNotes}</p>` : ''}
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 16px 0; font-size: 13px; color: #505748; line-height: 1.6;">
        Please log in to your Member Space to re-upload a clear payment receipt or verify the reference number.
      </p>
    `;

  return renderBaseEmailLayout({
    previewText: isApproved
      ? `Payment approved for Order #${data.orderNumber}`
      : `Payment verification update for Order #${data.orderNumber}`,
    badge: isApproved ? 'Payment Approved' : 'Action Required',
    title: isApproved ? 'Payment Verified' : 'Payment Review',
    subtitle: `Order #${data.orderNumber}`,
    contentHtml,
    ctaButton: {
      text: isApproved ? 'View Order in Member Space' : 'Re-upload Receipt in Member Space',
      url: `${appUrl}/portal`,
    },
  });
}
