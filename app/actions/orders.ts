'use server';

import { db } from '@/lib/db';
import { orders, orderItems, paymentReceipts, type PaymentMethod, type OrderStatus } from '@/lib/db/schema/orders';
import { products } from '@/lib/db/schema/products';
import { profiles } from '@/lib/db/schema/users';
import { getCurrentUserProfile, getUserProfileById, verifyCurrentUserRole } from '@/lib/db/queries/users';
import { orderSchema, isSizeAvailable } from '@/lib/validators';
import { saveUploadedImage } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { eq, and, sql, gte, inArray } from 'drizzle-orm';
import { CACHE_TAGS, invalidateCacheTag } from '@/lib/db/queries/cached';
import { dispatchNotification } from '@/lib/notifications/dispatcher';
import {
  renderOrderConfirmationEmail,
  renderAdminOrderAlert,
} from '@/lib/email/templates/order-confirmation';
import { renderPaymentVerificationEmail } from '@/lib/email/templates/payment-verification';
import { getPaymentSettings } from '@/lib/db/queries/settings';

export interface OrderActionResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface ReceiptActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

const COURIER_DELIVERY_FEE = 120.0; // Standard PHP courier fee

function getConfiguredPaymentMethod(platform: string): PaymentMethod {
  switch (platform.trim().toUpperCase().replace(/[\s-]+/g, '_')) {
    case 'GCASH':
      return 'GCASH';
    case 'PALAWAN_PAY':
    case 'PALAWANPAY':
      return 'PALAWAN_PAY';
    case 'MAYA':
      return 'MAYA';
    case 'BANK_TRANSFER':
    case 'BANK':
      return 'BANK_TRANSFER';
    default:
      return 'OTHER';
  }
}

/**
 * Server Action for authenticated Members to place a merchandise order or pre-order.
 * Shift-Left Security: Enforces user authentication, role separation, strict input validation,
 * and stock/size availability checking before recording transaction in DB.
 */
export async function createOrderAction(
  prevState: OrderActionResult,
  formData: FormData
): Promise<OrderActionResult> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return {
        success: false,
        error: 'Please log in to your PCYC Member account to place an order.',
      };
    }

    const paymentSettings = await getPaymentSettings();
    const paymentMethod = getConfiguredPaymentMethod(paymentSettings.platform);

    // Role Segregation: Administrators must not place orders using admin privileges
    if (profile.role === 'ADMIN' || profile.role === 'SUPERADMIN') {
      return {
        success: false,
        error: 'Administrators are not permitted to place merchandise orders from the admin panel.',
      };
    }

    const rawData = {
      productId: formData.get('productId'),
      quantity: Number(formData.get('quantity')),
      selectedSize: formData.get('selectedSize') || undefined,
      fulfillmentType: formData.get('fulfillmentType') || 'EVENT_PICKUP',
      recipientName:
        (formData.get('recipientName') as string | null)?.trim() ||
        `${profile.firstName} ${profile.lastName}`.trim(),
      contactNumber:
        (formData.get('contactNumber') as string | null)?.trim() ||
        profile.phoneNumber ||
        undefined,
      deliveryAddress: (formData.get('deliveryAddress') as string | null)?.trim() || undefined,
      city: (formData.get('city') as string | null)?.trim() || undefined,
      province: (formData.get('province') as string | null)?.trim() || undefined,
      zipCode: (formData.get('zipCode') as string | null)?.trim() || undefined,
      notes: (formData.get('notes') as string | null)?.trim() || undefined,
      referenceNumber: (formData.get('referenceNumber') as string | null)?.trim() || undefined,
    };

    const parsed = orderSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message;
      return {
        success: false,
        error: firstError || 'Please correct the errors in the order form.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { data } = parsed;

    // Delivery payment proof rule: a payment proof is strictly required for courier orders
    const receiptFile = formData.get('receiptImage') as File | null;
    const refNumber = (formData.get('referenceNumber') as string | null)?.trim() || null;

    if (data.fulfillmentType === 'DELIVERY') {
      if (!receiptFile || (typeof receiptFile === 'object' && receiptFile.size === 0)) {
        return {
          success: false,
          error: `${paymentSettings.platform} payment proof screenshot is required for courier delivery orders.`,
        };
      }
      if (!refNumber) {
        return {
          success: false,
          error: `Please provide your ${paymentSettings.platform} reference number.`,
        };
      }
    }

    // 1. Fetch & validate Product
    const [targetProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);

    if (!targetProduct) {
      return {
        success: false,
        error: 'The requested merchandise item was not found.',
      };
    }

    if (!targetProduct.isAvailable) {
      return {
        success: false,
        error: 'This item is currently unavailable or hidden from the store.',
      };
    }

    // 2. Validate Size selection
    if (
      targetProduct.availableSizes &&
      targetProduct.availableSizes.length > 0 &&
      !isSizeAvailable(data.selectedSize, targetProduct.availableSizes)
    ) {
      return {
        success: false,
        error: `Please select a valid size (${targetProduct.availableSizes.join(', ')}).`,
        fieldErrors: { selectedSize: ['Please choose an available size option.'] },
      };
    }

    // 3. Calculate Total Amount
    const unitPriceNum = Number(targetProduct.price);
    const itemSubtotal = unitPriceNum * data.quantity;
    const deliveryFee = data.fulfillmentType === 'DELIVERY' ? COURIER_DELIVERY_FEE : 0;
    const totalAmount = itemSubtotal + deliveryFee;

    // Order number generated inside the transaction with collision retry
    const year = new Date().getFullYear();

    const isEventPickup = data.fulfillmentType === 'EVENT_PICKUP';
    const shippingInfoPayload = {
      recipientName: data.recipientName,
      contactNumber: data.contactNumber || profile.phoneNumber || 'N/A',
      deliveryAddress: isEventPickup
        ? 'Event Registration Desk'
        : data.deliveryAddress || 'Standard Courier Delivery',
      city: isEventPickup ? 'Event Venue' : data.city || '',
      province: isEventPickup ? 'Event Venue' : data.province || '',
      zipCode: isEventPickup ? undefined : data.zipCode || undefined,
      notes: data.notes || undefined,
    };

    try {
      // Atomic transaction: stock decrement + order + items + receipt
      let hasReceipt = false;
      const amountPaidStr = formData.get('amountPaid') as string | null;

      const newOrder = await db.transaction(async (tx) => {
        // Atomic stock decrement (skip for pre-orders)
        if (!targetProduct.isPreorder) {
          const [decremented] = await tx
            .update(products)
            .set({
              stockQuantity: sql`${products.stockQuantity} - ${data.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(products.id, data.productId),
                gte(products.stockQuantity, data.quantity)
              )
            )
            .returning({ id: products.id });

          if (!decremented) {
            throw new Error('Insufficient stock. This item may have sold out while you were ordering.');
          }
        }

        // Order number with collision retry
        let insertedOrder;
        for (let attempt = 0; attempt < 5; attempt++) {
          const suffix = Math.floor(10000 + Math.random() * 90000);
          const candidateOrderNumber = `PCYC-${year}-${suffix}`;
          try {
            const [row] = await tx
              .insert(orders)
              .values({
                userId: profile.id,
                orderNumber: candidateOrderNumber,
                totalAmount: totalAmount.toFixed(2),
                status: 'PENDING_PAYMENT',
                shippingInfo: shippingInfoPayload,
                notes: data.notes || null,
              })
              .returning();
            insertedOrder = row;
            break;
          } catch (e: any) {
            // Retry on unique constraint violation (order number collision)
            if ((e?.code === '23505' || e?.message?.includes('unique')) && attempt < 4) continue;
            throw e;
          }
        }

        if (!insertedOrder) {
          throw new Error('Failed to generate a unique order number. Please try again.');
        }

        // Update phone number on profile if not set
        if (!profile.phoneNumber && data.contactNumber) {
          await tx
            .update(profiles)
            .set({ phoneNumber: data.contactNumber, updatedAt: new Date() })
            .where(eq(profiles.id, profile.id));
        }

        // Insert Order Item
        await tx.insert(orderItems).values({
          orderId: insertedOrder.id,
          productId: targetProduct.id,
          quantity: data.quantity,
          unitPrice: unitPriceNum.toFixed(2),
          selectedSize: data.selectedSize || null,
        });

        // Process Proof of Payment Attachment
        if (receiptFile && typeof receiptFile === 'object' && receiptFile.size > 0 && refNumber) {
          const uploadResult = await saveUploadedImage(receiptFile, 'receipts', `receipt-${insertedOrder.orderNumber}`);
          if (uploadResult.success && uploadResult.url) {
            await tx.insert(paymentReceipts).values({
              orderId: insertedOrder.id,
              receiptImageUrl: uploadResult.url,
              paymentMethod,
              referenceNumber: refNumber,
              amountPaid: (amountPaidStr ? Number(amountPaidStr) : totalAmount).toFixed(2),
              verificationStatus: 'PENDING',
            });

            await tx
              .update(orders)
              .set({ status: 'VERIFICATION_QUEUED', updatedAt: new Date() })
              .where(eq(orders.id, insertedOrder.id));

            hasReceipt = true;
          }
        }

        return insertedOrder;
      });

      logger.info(
        {
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          userId: profile.id,
          totalAmount,
          fulfillmentType: data.fulfillmentType,
        },
        'Merchandise order placed successfully'
      );

      // Dispatch Order Confirmation Email + In-App Notification + Admin Alert
      const customerName = `${profile.firstName} ${profile.lastName}`;
      const orderEmailData = {
        userName: customerName,
        userDesignation: profile.designation,
        orderNumber: newOrder.orderNumber,
        createdAt: new Date(),
        totalAmount,
        items: [
          {
            name: targetProduct.name,
            size: data.selectedSize || null,
            quantity: data.quantity,
            unitPrice: unitPriceNum,
          },
        ],
        shippingInfo: {
          recipientName: data.recipientName,
          contactNumber: data.contactNumber,
          deliveryAddress: data.deliveryAddress,
          city: data.city,
          province: data.province,
          notes: data.notes,
        },
        hasReceiptUploaded: hasReceipt,
        referenceNumber: refNumber,
      };

      await dispatchNotification({
        userId: profile.id,
        type: 'ORDER_STATUS',
        title: `Order #${newOrder.orderNumber} Placed! 🛍️`,
        message: hasReceipt
          ? `Thank you! Your payment for Order #${newOrder.orderNumber} (₱${totalAmount.toFixed(2)}) is queued for verification.`
          : `Order #${newOrder.orderNumber} recorded. Please upload your ${paymentSettings.platform} payment receipt to proceed with fulfillment.`,
        linkUrl: '/portal',
        metadata: { orderId: newOrder.id, orderNumber: newOrder.orderNumber, totalAmount },
        email: {
          to: profile.email,
          subject: `Order Confirmation #${newOrder.orderNumber} - PCYC Space`,
          html: renderOrderConfirmationEmail(orderEmailData),
        },
        notifyAdmins: true,
        adminAlert: {
          title: `New Order: #${newOrder.orderNumber}`,
          message: `${customerName} placed order #${newOrder.orderNumber} for ₱${totalAmount.toFixed(2)}.`,
          linkUrl: '/admin/orders',
          emailSubject: `[Admin Alert] New Merch Order #${newOrder.orderNumber}`,
          emailHtml: renderAdminOrderAlert({
            ...orderEmailData,
            userEmail: profile.email,
          }),
        },
      });

      try {
        invalidateCacheTag(
          CACHE_TAGS.products,
          CACHE_TAGS.productsAvailable,
          CACHE_TAGS.product(targetProduct.slug),
          CACHE_TAGS.adminMetrics
        );
        revalidatePath('/portal');
        revalidatePath('/admin/orders');
        revalidatePath(`/merch/${targetProduct.slug}`);
      } catch (cacheErr: any) {
        logger.warn({ error: cacheErr?.message }, 'Cache revalidation warning');
      }

      return {
        success: true,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        totalAmount,
        message: `Order ${newOrder.orderNumber} placed successfully! Please upload your ${paymentSettings.platform} payment proof.`,
      };
    } catch (error: any) {
      logger.error({ error: error?.message, userId: profile.id }, 'Failed to place order');
      return {
        success: false,
        error: 'An unexpected error occurred while placing your order. Please try again.',
      };
    }
  } catch (err: any) {
    if (
      err?.digest === 'DYNAMIC_SERVER_USAGE' ||
      err?.message?.includes('DYNAMIC_SERVER_USAGE') ||
      err?.digest?.startsWith('NEXT_') ||
      err?.message === 'NEXT_REDIRECT'
    ) {
      throw err;
    }
    logger.error({ error: err?.message || err }, 'Unhandled error in createOrderAction');
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Server Action for Members (or Admins) to upload/re-submit a payment receipt for an existing order.
 */
export async function uploadReceiptAction(
  prevState: ReceiptActionResult,
  formData: FormData
): Promise<ReceiptActionResult> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return {
        success: false,
        error: 'Please log in to submit your payment receipt.',
      };
    }

    const orderId = formData.get('orderId') as string;
    const referenceNumber = formData.get('referenceNumber') as string;
    const paymentSettings = await getPaymentSettings();
    const paymentMethod = getConfiguredPaymentMethod(paymentSettings.platform);
    const amountPaid = formData.get('amountPaid') ? Number(formData.get('amountPaid')) : null;
    const receiptFile = formData.get('receiptImage') as File | null;

    if (!orderId) {
      return { success: false, error: 'Order ID is missing.' };
    }

    if (!referenceNumber || referenceNumber.trim().length < 3) {
      return {
        success: false,
        error: `Please provide a valid ${paymentSettings.platform} reference number.`,
      };
    }

    if (!receiptFile || (typeof receiptFile === 'object' && receiptFile.size === 0)) {
      return {
        success: false,
        error: `Please select a clear screenshot of your ${paymentSettings.platform} receipt.`,
      };
    }

    // 1. Check order ownership & status
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder) {
      return { success: false, error: 'Order not found.' };
    }

    if (existingOrder.userId !== profile.id && profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN') {
      return { success: false, error: 'Unauthorized to modify this order.' };
    }

    // 2. Upload Receipt Image
    const uploadResult = await saveUploadedImage(
      receiptFile,
      'receipts',
      `receipt-${existingOrder.orderNumber}`
    );

    if (!uploadResult.success || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload receipt screenshot.',
      };
    }

    const receiptUrl = uploadResult.url;

    try {
      // Atomic: receipt upsert + order status update
      await db.transaction(async (tx) => {
        // Upsert receipt using unique constraint on orderId (eliminates check-then-act race)
        await tx
          .insert(paymentReceipts)
          .values({
            orderId,
            receiptImageUrl: receiptUrl,
            paymentMethod,
            referenceNumber: referenceNumber.trim(),
            amountPaid: (amountPaid || Number(existingOrder.totalAmount)).toFixed(2),
            verificationStatus: 'PENDING',
          })
          .onConflictDoUpdate({
            target: paymentReceipts.orderId,
            set: {
              receiptImageUrl: receiptUrl,
              paymentMethod,
              referenceNumber: referenceNumber.trim(),
              amountPaid: (amountPaid || Number(existingOrder.totalAmount)).toFixed(2),
              verificationStatus: 'PENDING',
              verificationNotes: null,
              createdAt: new Date(),
            },
          });

        // Update order status
        await tx
          .update(orders)
          .set({
            status: 'VERIFICATION_QUEUED',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
      });

      logger.info(
        { orderId, orderNumber: existingOrder.orderNumber, userId: profile.id },
        'Payment receipt uploaded and queued for verification'
      );

      // Dispatch in-app notification & admin queue alert
      await dispatchNotification({
        userId: existingOrder.userId,
        type: 'PAYMENT_VERIFICATION',
        title: `Receipt Submitted for #${existingOrder.orderNumber}`,
        message: `Your ${paymentSettings.platform} receipt has been received and queued for admin review.`,
        linkUrl: '/portal',
        notifyAdmins: true,
        adminAlert: {
          title: `Receipt Queued: #${existingOrder.orderNumber}`,
          message: `New ${paymentSettings.platform} receipt submitted for Order #${existingOrder.orderNumber} (Ref: ${referenceNumber.trim()}).`,
          linkUrl: '/admin/orders',
        },
      });

      try {
        revalidatePath('/portal');
        revalidatePath('/admin/orders');
        revalidatePath('/admin');
      } catch (cacheErr: any) {
        logger.warn({ error: cacheErr?.message }, 'Cache revalidation warning');
      }

      return {
        success: true,
        message: 'Proof of payment uploaded successfully! Our admin team will verify it shortly.',
      };
    } catch (error: any) {
      logger.error({ error: error?.message, orderId }, 'Failed to upload receipt');
      return {
        success: false,
        error: 'Failed to submit payment receipt. Please try again.',
      };
    }
  } catch (err: any) {
    if (
      err?.digest === 'DYNAMIC_SERVER_USAGE' ||
      err?.message?.includes('DYNAMIC_SERVER_USAGE') ||
      err?.digest?.startsWith('NEXT_') ||
      err?.message === 'NEXT_REDIRECT'
    ) {
      throw err;
    }
    logger.error({ error: err?.message || err }, 'Unhandled error in uploadReceiptAction');
    return {
      success: false,
      error: err?.message || 'Failed to submit payment receipt.',
    };
  }
}

/**
 * Server Action for Admins to verify/approve or reject an uploaded payment receipt.
 */
export async function verifyReceiptAction(formData: FormData): Promise<void> {
  try {
    const orderId = formData.get('orderId') as string;
    const receiptId = formData.get('receiptId') as string;
    const decision = (formData.get('decision') as 'APPROVED' | 'REJECTED') || 'APPROVED';
    const adminNotes = formData.get('adminNotes') as string | undefined;

    if (!orderId || !receiptId) return;

    const profile = await getCurrentUserProfile();
    if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN')) {
      return;
    }

    try {
      // Atomic: receipt verification + order status update
      const newOrderStatus = decision === 'APPROVED' ? 'PAID' : 'PENDING_PAYMENT';
      await db.transaction(async (tx) => {
        await tx
          .update(paymentReceipts)
          .set({
            verificationStatus: decision,
            verifiedById: profile.id,
            verifiedAt: new Date(),
            verificationNotes: adminNotes || null,
          })
          .where(eq(paymentReceipts.id, receiptId));

        await tx
          .update(orders)
          .set({
            status: newOrderStatus,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
      });

      logger.info({ orderId, receiptId, decision, adminId: profile.id }, 'Payment receipt verified');

      // 3. Fetch order & customer profile to dispatch decision notification & email
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      const [receipt] = await db.select().from(paymentReceipts).where(eq(paymentReceipts.id, receiptId)).limit(1);

      if (order) {
        const buyer = await getUserProfileById(order.userId);
        if (buyer) {
          const isApproved = decision === 'APPROVED';
          const buyerName = `${buyer.firstName} ${buyer.lastName}`;

          await dispatchNotification({
            userId: buyer.id,
            type: 'PAYMENT_VERIFICATION',
            title: isApproved
              ? `Payment Approved for #${order.orderNumber}! 💳`
              : `Payment Review Needed for #${order.orderNumber} ⚠️`,
            message: isApproved
              ? `Your payment of ₱${order.totalAmount} has been verified. We are now preparing your order.`
              : `We could not verify your ${receipt?.paymentMethod || 'payment'}: ${adminNotes || 'Please re-upload a clear receipt screenshot.'}`,
            linkUrl: '/portal',
            metadata: { orderId: order.id, orderNumber: order.orderNumber, decision },
            email: {
              to: buyer.email,
              subject: isApproved
                ? `Payment Approved - Order #${order.orderNumber}`
                : `Payment Verification Update - Order #${order.orderNumber}`,
              html: renderPaymentVerificationEmail({
                userName: buyerName,
                userDesignation: buyer.designation,
                orderNumber: order.orderNumber,
                decision,
                totalAmount: order.totalAmount,
                referenceNumber: receipt?.referenceNumber,
                adminNotes: adminNotes || null,
              }),
            },
          });
        }
      }

      try {
        invalidateCacheTag(CACHE_TAGS.adminMetrics);
        revalidatePath('/admin/orders');
        revalidatePath('/admin');
        revalidatePath('/portal');
        revalidatePath('/orders');
      } catch (cacheErr: any) {
        logger.warn({ error: cacheErr?.message }, 'Cache revalidation warning');
      }
    } catch (error: any) {
      logger.error({ error: error?.message, orderId, receiptId }, 'Failed to verify receipt');
    }
  } catch (err: any) {
    logger.error({ error: err?.message || err }, 'Unhandled error in verifyReceiptAction');
  }
}

/**
 * Server Action for Members to cancel an unpaid order (in PENDING_PAYMENT status).
 */
export async function cancelOrderAction(formData: FormData): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, error: 'You must be logged in to manage orders.' };
    }

    const orderId = formData.get('orderId') as string;
    if (!orderId) {
      return { success: false, error: 'Invalid order identifier.' };
    }

    // Atomic cancellation: only cancel if still PENDING_PAYMENT
    // Prevents race condition where admin approves payment simultaneously
    const [cancelled] = await db
      .update(orders)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.userId, profile.id),
          eq(orders.status, 'PENDING_PAYMENT')
        )
      )
      .returning();

    if (!cancelled) {
      return {
        success: false,
        error: 'Order cannot be cancelled — it may have already been processed or does not exist.',
      };
    }

    const order = cancelled;

    logger.info({ orderId, userId: profile.id }, 'Order cancelled by member');

    // Notify user of cancellation confirmation
    await dispatchNotification({
      userId: profile.id,
      type: 'ORDER_STATUS',
      title: `Order #${order.orderNumber} Cancelled`,
      message: `Your merchandise order #${order.orderNumber} has been cancelled per your request.`,
      linkUrl: '/orders',
      metadata: { orderId: order.id, orderNumber: order.orderNumber, status: 'CANCELLED' },
    });

    invalidateCacheTag(CACHE_TAGS.adminMetrics);
    revalidatePath('/orders');
    revalidatePath('/portal');
    revalidatePath('/admin/orders');

    return { success: true, message: `Order #${order.orderNumber} was successfully cancelled.` };
  } catch (error: any) {
    logger.error({ error: error?.message }, 'Failed to cancel order');
    return { success: false, error: error?.message || 'Failed to cancel order.' };
  }
}

/**
 * Server Action for Administrators to perform bulk order status transitions.
 * Supports bulk payment acceptance, bulk in-transit/shipped updates, and bulk completion.
 */
export async function adminBulkUpdateOrderStatusAction(
  orderIds: string[],
  targetStatus: OrderStatus,
  adminNotes?: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const auth = await verifyCurrentUserRole(['ADMIN', 'SUPERADMIN']);
    if (!auth.authorized || !auth.profile) {
      return { success: false, error: 'Unauthorized. Admin access required.' };
    }
    const admin = auth.profile;

    if (!orderIds || orderIds.length === 0) {
      return { success: false, error: 'No orders selected for bulk operation.' };
    }

    // 1. Single atomic transaction for all order status & payment receipt updates
    const { updatedOrders, buyerProfiles } = await db.transaction(async (tx) => {
      // Single query bulk status update
      const updated = await tx
        .update(orders)
        .set({
          status: targetStatus,
          updatedAt: new Date(),
        })
        .where(inArray(orders.id, orderIds))
        .returning();

      if (updated.length === 0) {
        return { updatedOrders: [], buyerProfiles: [] };
      }

      // Single query bulk payment receipt approval (if PAID)
      if (targetStatus === 'PAID') {
        await tx
          .update(paymentReceipts)
          .set({
            verificationStatus: 'APPROVED',
            verifiedById: admin.id,
            verifiedAt: new Date(),
            verificationNotes: adminNotes || 'Bulk payment verification by admin',
          })
          .where(inArray(paymentReceipts.orderId, orderIds));
      }

      // Batch load buyer profiles in a single query (eliminates N+1 queries)
      const userIds = Array.from(new Set(updated.map((o) => o.userId).filter(Boolean)));
      const loadedProfiles =
        userIds.length > 0
          ? await tx.select().from(profiles).where(inArray(profiles.id, userIds))
          : [];

      return { updatedOrders: updated, buyerProfiles: loadedProfiles };
    });

    const processedCount = updatedOrders.length;
    const buyerMap = new Map(buyerProfiles.map((p) => [p.id, p]));

    // 2. Dispatch notifications asynchronously with Promise.allSettled
    await Promise.allSettled(
      updatedOrders.map(async (order) => {
        const buyer = buyerMap.get(order.userId);
        if (!buyer) return;

        let statusTitle = `Order #${order.orderNumber} Status Update`;
        let statusMessage = `Your order #${order.orderNumber} is now ${targetStatus.replace(/_/g, ' ')}.`;

        if (targetStatus === 'PAID') {
          statusTitle = `Payment Approved for #${order.orderNumber}! 💳`;
          statusMessage = `Your payment of ₱${order.totalAmount} has been verified. We are preparing your items.`;
        } else if (targetStatus === 'SHIPPED') {
          statusTitle = `Order #${order.orderNumber} is In Transit / Shipped! 🚚`;
          statusMessage = `Your order is on the way or prepared for camp distribution.`;
        } else if (targetStatus === 'COMPLETED') {
          statusTitle = `Order #${order.orderNumber} Completed! 🎉`;
          statusMessage = `Your merchandise has been delivered/received. You can now leave a review!`;
        }

        await dispatchNotification({
          userId: buyer.id,
          type: 'ORDER_STATUS',
          title: statusTitle,
          message: statusMessage,
          linkUrl: '/orders',
          metadata: { orderId: order.id, orderNumber: order.orderNumber, status: targetStatus },
        });
      })
    );

    logger.info(
      { adminId: admin.id, targetStatus, processedCount, totalSelected: orderIds.length },
      'Admin bulk order status update completed'
    );

    invalidateCacheTag(CACHE_TAGS.adminMetrics);
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath('/orders');
    revalidatePath('/portal');

    return {
      success: true,
      count: processedCount,
    };
  } catch (error: any) {
    logger.error({ error: error?.message }, 'Failed in adminBulkUpdateOrderStatusAction');
    return { success: false, error: error?.message || 'Bulk order update failed.' };
  }
}
