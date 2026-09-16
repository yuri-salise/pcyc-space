import { pgTable, uuid, text, timestamp, integer, numeric, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { profiles } from './users';
import { products } from './products';

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING_PAYMENT',
  'VERIFICATION_QUEUED',
  'PAID',
  'PREPARING',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'GCASH',
  'PALAWAN_PAY',
  'BANK_TRANSFER',
  'MAYA',
  'OTHER',
]);

export const paymentVerificationStatusEnum = pgEnum('payment_verification_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

/**
 * Orders Ledger Table
 * 
 * Core table for the e-commerce and merchandise fundraising system. 
 * Tracks the complete lifecycle of a member's purchase, from pending payment to fulfillment.
 * Includes JSONB column for flexible shipping/pickup logistics data.
 */
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    orderNumber: text('order_number').notNull().unique(), // e.g. PCYC-2026-0001
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    status: orderStatusEnum('status').default('PENDING_PAYMENT').notNull(),
    shippingInfo: jsonb('shipping_info').$type<{
      recipientName: string;
      contactNumber: string;
      deliveryAddress: string;
      city: string;
      province: string;
      zipCode?: string;
      notes?: string;
    }>().notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_orders_user_id').on(table.userId),
    index('idx_orders_status').on(table.status),
    index('idx_orders_created_at').on(table.createdAt),
    index('idx_orders_user_created').on(table.userId, table.createdAt.desc()),
  ]
);

/**
 * Order Line Items Table
 * 
 * Maps specific merchandise items (and their selected variants like size) to a parent Order.
 * Snapshots the unit price at the time of purchase to prevent historical data mutation 
 * if product prices change later.
 */
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    selectedSize: text('selected_size'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_order_items_order_id').on(table.orderId),
    index('idx_order_items_product_id').on(table.productId),
  ]
);

/**
 * Payment Verification Receipts Table
 * 
 * Securely stores manual proof-of-payment screenshots (e.g., GCash, PalawanPay, Bank Transfer).
 * Administrators review these records to transition Orders from PENDING_PAYMENT to PAID.
 * Enforces a 1:1 unique relationship with orders.id.
 */
export const paymentReceipts = pgTable(
  'payment_receipts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }).unique(),
    receiptImageUrl: text('receipt_image_url').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    referenceNumber: text('reference_number'),
    amountPaid: numeric('amount_paid', { precision: 10, scale: 2 }),
    verificationStatus: paymentVerificationStatusEnum('verification_status').default('PENDING').notNull(),
    verificationNotes: text('verification_notes'),
    verifiedById: uuid('verified_by_id').references(() => profiles.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_payment_receipts_order_id').on(table.orderId),
    index('idx_payment_receipts_status').on(table.verificationStatus),
  ]
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type PaymentReceipt = typeof paymentReceipts.$inferSelect;
export type NewPaymentReceipt = typeof paymentReceipts.$inferInsert;
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type PaymentVerificationStatus = (typeof paymentVerificationStatusEnum.enumValues)[number];
