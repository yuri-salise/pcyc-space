import { renderBaseEmailLayout } from './base';
import { formatPHP } from '@/lib/utils';

export interface OrderItemSummary {
  name: string;
  size?: string | null;
  quantity: number;
  unitPrice: number | string;
}

export interface OrderConfirmationEmailData {
  userName: string;
  userDesignation?: string;
  orderNumber: string;
  createdAt: Date | string;
  totalAmount: number | string;
  items: OrderItemSummary[];
  shippingInfo: {
    recipientName?: string;
    contactNumber?: string;
    deliveryAddress?: string;
    city?: string;
    province?: string;
    notes?: string;
  };
  hasReceiptUploaded: boolean;
  paymentMethod?: string;
  referenceNumber?: string | null;
}

export function renderOrderConfirmationEmail(data: OrderConfirmationEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pcyc-space.vercel.app';
  const prefix =
    data.userDesignation === 'BROTHER'
      ? 'Brother'
      : data.userDesignation === 'SISTER'
      ? 'Sister'
      : 'Friend';

  const total = typeof data.totalAmount === 'number' ? data.totalAmount : parseFloat(data.totalAmount || '0');

  const itemsRows = data.items
    .map((item) => {
      const uPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || '0');
      const itemSubtotal = uPrice * item.quantity;
      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e6dfcb; font-size: 13px; color: #2c3324;">
            <strong>${item.name}</strong>
            ${item.size ? `<span style="display: block; font-size: 11px; color: #707666;">Size: ${item.size}</span>` : ''}
          </td>
          <td align="center" style="padding: 10px 12px; border-bottom: 1px solid #e6dfcb; font-size: 13px; color: #2c3324;">
            ${item.quantity}
          </td>
          <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #e6dfcb; font-size: 13px; color: #2c3324;">
            ${formatPHP(uPrice)}
          </td>
          <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #e6dfcb; font-size: 13px; font-weight: 700; color: #2c3324;">
            ${formatPHP(itemSubtotal)}
          </td>
        </tr>
      `;
    })
    .join('');

  const paymentPlatform = data.paymentMethod || (data.referenceNumber?.toUpperCase().startsWith('GCASH') ? 'GCash' : 'Online Payment');

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #2c3324;">
      Dear ${prefix} ${data.userName},
    </p>
    <p style="margin: 0 0 20px 0;">
      Thank you for your merchandise order with PCYC Space! We have recorded your order <strong>#${data.orderNumber}</strong>.
    </p>

    <!-- Order Items Breakdown Table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #e6dfcb; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #f8f4e3;">
          <th align="left" style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #707666; text-transform: uppercase;">Item</th>
          <th align="center" style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #707666; text-transform: uppercase;">Qty</th>
          <th align="right" style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #707666; text-transform: uppercase;">Price</th>
          <th align="right" style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #707666; text-transform: uppercase;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr style="background-color: #fbf1e2;">
          <td colspan="3" align="right" style="padding: 12px; font-size: 14px; font-weight: 700; color: #2c3324;">
            Grand Total:
          </td>
          <td align="right" style="padding: 12px; font-size: 16px; font-weight: 700; color: #2c3324;">
            ${formatPHP(total)}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Delivery & Payment Summary -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f4e3; border: 1px solid #e6dfcb; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #707666; text-transform: uppercase; letter-spacing: 0.5px;">Delivery & Payment Info</p>
          <p style="margin: 0; font-size: 13px; color: #2c3324;"><strong>Recipient:</strong> ${data.shippingInfo.recipientName || data.userName}</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #2c3324;"><strong>Contact:</strong> ${data.shippingInfo.contactNumber || 'N/A'}</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #2c3324;"><strong>Address:</strong> ${data.shippingInfo.deliveryAddress || ''}, ${data.shippingInfo.city || ''} ${data.shippingInfo.province || ''}</p>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #2c3324;">
            <strong>Payment Status:</strong> 
            <span style="font-weight: 700; color: ${data.hasReceiptUploaded ? '#b78103' : '#c0392b'};">
              ${data.hasReceiptUploaded ? `${paymentPlatform} Verification Queued` : `Pending ${paymentPlatform} Receipt Upload`}
            </span>
          </p>
          ${data.referenceNumber ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #2c3324;"><strong>${paymentPlatform} Ref #:</strong> <code style="background-color: #e6dfcb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${data.referenceNumber}</code></p>` : ''}
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #707666; text-align: center;">
      You can track the progress of this order anytime in your Member Space.
    </p>
  `;

  return renderBaseEmailLayout({
    previewText: `Order #${data.orderNumber} confirmed! Total: ${formatPHP(total)}`,
    badge: 'Merchandise Order Receipt',
    title: 'Order Confirmed',
    subtitle: `Order #${data.orderNumber}`,
    contentHtml,
    ctaButton: {
      text: 'View Order in Member Space',
      url: `${appUrl}/portal`,
    },
  });
}

export function renderAdminOrderAlert(data: OrderConfirmationEmailData & { userEmail: string }): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pcyc-space.vercel.app';
  const total = typeof data.totalAmount === 'number' ? data.totalAmount : parseFloat(data.totalAmount || '0');

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #2c3324;">
      A new merchandise order has been placed on PCYC Space:
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f4e3; border: 1px solid #e6dfcb; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 16px 20px; font-size: 14px; color: #2c3324; line-height: 1.7;">
          <p style="margin: 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p style="margin: 0;"><strong>Customer:</strong> ${data.userName} (${data.userEmail})</p>
          <p style="margin: 0;"><strong>Total Amount:</strong> ${formatPHP(total)}</p>
          <p style="margin: 0;"><strong>Item Count:</strong> ${data.items.reduce((acc, i) => acc + i.quantity, 0)} item(s)</p>
          <p style="margin: 0;"><strong>Payment Proof:</strong> ${data.hasReceiptUploaded ? '✅ Payment Screenshot Uploaded' : '⏳ Awaiting Upload'}</p>
          ${data.referenceNumber ? `<p style="margin: 0;"><strong>${data.paymentMethod || 'Online Payment'} Ref #:</strong> ${data.referenceNumber}</p>` : ''}
        </td>
      </tr>
    </table>
  `;

  return renderBaseEmailLayout({
    previewText: `New merch order #${data.orderNumber} placed by ${data.userName}`,
    badge: 'Admin Alert',
    title: 'New Merchandise Order',
    subtitle: `Order #${data.orderNumber} - ${formatPHP(total)}`,
    contentHtml,
    ctaButton: {
      text: 'View Admin Orders & Verify Payment',
      url: `${appUrl}/admin/orders`,
    },
  });
}
