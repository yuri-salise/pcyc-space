import { cache } from 'react';
import { db } from '@/lib/db';
import { products, type Product } from '@/lib/db/schema/products';
import { eq, desc, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Fetches all available products for the public merch store.
 * Includes items in active stock (isAvailable: true) or open for Pre-Order (isPreorder: true).
 * Memoized per server request lifecycle.
 */
export const getAvailableProducts = cache(async function getAvailableProducts(category?: string): Promise<Product[]> {
  try {
    const isStoreVisible = eq(products.isAvailable, true);

    if (category && category !== 'All') {
      return await db
        .select()
        .from(products)
        .where(and(isStoreVisible, eq(products.category, category)))
        .orderBy(desc(products.createdAt));
    }

    return await db
      .select()
      .from(products)
      .where(isStoreVisible)
      .orderBy(desc(products.createdAt));
  } catch (error: any) {
    if (
      error?.digest === 'DYNAMIC_SERVER_USAGE' ||
      error?.message?.includes('DYNAMIC_SERVER_USAGE') ||
      error?.digest?.startsWith('NEXT_')
    ) {
      throw error;
    }
    logger.error({ error: error?.message || error, category }, 'Failed to fetch available products');
    return [];
  }
});

/**
 * Fetches all products (including archived or unavailable items) for Admin inventory.
 * Memoized per server request lifecycle.
 */
export const getAllProducts = cache(async function getAllProducts(): Promise<Product[]> {
  try {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  } catch (error: any) {
    if (
      error?.digest === 'DYNAMIC_SERVER_USAGE' ||
      error?.message?.includes('DYNAMIC_SERVER_USAGE') ||
      error?.digest?.startsWith('NEXT_')
    ) {
      throw error;
    }
    logger.error({ error: error?.message || error }, 'Failed to fetch all products for admin');
    return [];
  }
});

/**
 * Fetches a single product by slug for product detail view.
 * Memoized per server request lifecycle.
 */
export const getProductBySlug = cache(async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const results = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    return results[0] || null;
  } catch (error: any) {
    if (
      error?.digest === 'DYNAMIC_SERVER_USAGE' ||
      error?.message?.includes('DYNAMIC_SERVER_USAGE') ||
      error?.digest?.startsWith('NEXT_')
    ) {
      throw error;
    }
    logger.error({ error: error?.message || error, slug }, 'Failed to fetch product by slug');
    return null;
  }
});

/**
 * Fetches a single product by ID for admin editor.
 * Memoized per server request lifecycle.
 */
export const getProductById = cache(async function getProductById(id: string): Promise<Product | null> {
  try {
    const results = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return results[0] || null;
  } catch (error: any) {
    if (
      error?.digest === 'DYNAMIC_SERVER_USAGE' ||
      error?.message?.includes('DYNAMIC_SERVER_USAGE') ||
      error?.digest?.startsWith('NEXT_')
    ) {
      throw error;
    }
    logger.error({ error: error?.message || error, id }, 'Failed to fetch product by id');
    return null;
  }
});
