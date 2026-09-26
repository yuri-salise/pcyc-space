import { db } from '@/lib/db';
import { productReviews, type ProductReview } from '@/lib/db/schema/reviews';
import { profiles, type UserDesignation } from '@/lib/db/schema/users';
import { products, type Product } from '@/lib/db/schema/products';
import { eq, and, desc, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface ProductReviewWithAuthor extends ProductReview {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    designation: UserDesignation;
    avatarUrl: string | null;
    ecclesia: string | null;
  };
}

export interface ProductRatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

/**
 * Fetches all visible reviews for a product with reviewer profile metadata.
 */
export async function getProductReviews(
  productId: string,
  includeHidden: boolean = false
): Promise<ProductReviewWithAuthor[]> {
  try {
    const whereConditions = includeHidden
      ? eq(productReviews.productId, productId)
      : and(eq(productReviews.productId, productId), eq(productReviews.isHidden, false));

    const rows = await db
      .select({
        review: productReviews,
        user: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          designation: profiles.designation,
          avatarUrl: profiles.avatarUrl,
          ecclesia: profiles.ecclesia,
        },
      })
      .from(productReviews)
      .innerJoin(profiles, eq(productReviews.userId, profiles.id))
      .where(whereConditions)
      .orderBy(desc(productReviews.createdAt));

    return rows.map(({ review, user }) => ({
      ...review,
      user,
    }));
  } catch (error: any) {
    logger.error({ error: error?.message, productId }, 'Failed to fetch product reviews');
    return [];
  }
}

/**
 * High-performance aggregate calculation for product star ratings and distribution.
 */
export async function getProductRatingSummary(productId: string): Promise<ProductRatingSummary> {
  try {
    const [stats] = await db
      .select({
        totalReviews: sql<number>`count(*)::int`,
        avgRating: sql<number>`COALESCE(ROUND(AVG(${productReviews.rating})::numeric, 1), 0.0)::float`,
        star5: sql<number>`count(*) filter (where ${productReviews.rating} = 5)::int`,
        star4: sql<number>`count(*) filter (where ${productReviews.rating} = 4)::int`,
        star3: sql<number>`count(*) filter (where ${productReviews.rating} = 3)::int`,
        star2: sql<number>`count(*) filter (where ${productReviews.rating} = 2)::int`,
        star1: sql<number>`count(*) filter (where ${productReviews.rating} = 1)::int`,
      })
      .from(productReviews)
      .where(and(eq(productReviews.productId, productId), eq(productReviews.isHidden, false)));

    if (!stats || stats.totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    return {
      averageRating: Number(stats.avgRating) || 0,
      totalReviews: stats.totalReviews,
      distribution: {
        5: stats.star5,
        4: stats.star4,
        3: stats.star3,
        2: stats.star2,
        1: stats.star1,
      },
    };
  } catch (error: any) {
    logger.error({ error: error?.message, productId }, 'Failed to calculate product rating summary');
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
}

/**
 * Checks if a member has already reviewed a product for a specific completed order.
 */
export async function getUserProductReview(
  userId: string,
  productId: string,
  orderId: string
): Promise<ProductReview | null> {
  try {
    const [review] = await db
      .select()
      .from(productReviews)
      .where(
        and(
          eq(productReviews.userId, userId),
          eq(productReviews.productId, productId),
          eq(productReviews.orderId, orderId)
        )
      )
      .limit(1);

    return review || null;
  } catch (error: any) {
    logger.error({ error: error?.message, userId, productId, orderId }, 'Failed to check user product review');
    return null;
  }
}

/**
 * Retrieves all reviews submitted by a specific user across their orders.
 */
export async function getUserReviews(userId: string): Promise<ProductReview[]> {
  try {
    return await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.userId, userId))
      .orderBy(desc(productReviews.createdAt));
  } catch (error: any) {
    logger.error({ error: error?.message, userId }, 'Failed to fetch user reviews');
    return [];
  }
}

/**
 * Admin query to retrieve all reviews for platform moderation (hide/delete).
 */
export async function getAdminAllReviews(): Promise<
  Array<ProductReviewWithAuthor & { product: Pick<Product, 'id' | 'name' | 'slug' | 'imageUrls'> }>
> {
  try {
    const rows = await db
      .select({
        review: productReviews,
        user: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          designation: profiles.designation,
          avatarUrl: profiles.avatarUrl,
          ecclesia: profiles.ecclesia,
        },
        product: {
          id: products.id,
          name: products.name,
          slug: products.slug,
          imageUrls: products.imageUrls,
        },
      })
      .from(productReviews)
      .innerJoin(profiles, eq(productReviews.userId, profiles.id))
      .innerJoin(products, eq(productReviews.productId, products.id))
      .orderBy(desc(productReviews.createdAt));

    return rows.map(({ review, user, product }) => ({
      ...review,
      user,
      product,
    }));
  } catch (error: any) {
    logger.error({ error: error?.message }, 'Failed to fetch admin all reviews');
    return [];
  }
}
