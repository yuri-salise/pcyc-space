import { pgTable, uuid, text, timestamp, boolean, integer, index, unique } from 'drizzle-orm/pg-core';
import { profiles } from './users';
import { products } from './products';
import { orders } from './orders';

/**
 * Product Reviews Table
 * Stores verified buyer product ratings (1 to 5 stars) and feedback comments.
 * Tied to specific completed orders to guarantee review authenticity.
 */
export const productReviews = pgTable(
  'product_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1 to 5 stars
    comment: text('comment').notNull(),
    isHidden: boolean('is_hidden').default(false).notNull(), // Moderation flag
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_order_product_review').on(table.orderId, table.productId),
    index('idx_product_reviews_product_hidden').on(table.productId, table.isHidden),
    index('idx_reviews_product_visible').on(table.productId, table.isHidden, table.createdAt.desc()),
    index('idx_product_reviews_user_id').on(table.userId),
    index('idx_product_reviews_order_id').on(table.orderId),
    index('idx_product_reviews_created_at').on(table.createdAt),
  ]
);

export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;
