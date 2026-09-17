import { unstable_cache, updateTag, revalidateTag } from 'next/cache';
import { getPublishedEvents, getEventBySlug } from './events';
import { getAvailableProducts, getProductBySlug } from './products';
import { getDisplayedEcclesias, getEcclesiaCount } from './ecclesias';
import { getSiteSetting, getYouthAndFriendsCount, getPaymentSettings } from './settings';
import { getAdminOverviewMetrics, type AdminOverviewMetrics } from './admin-metrics';
import type { Event } from '@/lib/db/schema/events';
import type { Product } from '@/lib/db/schema/products';
import type { Ecclesia } from '@/lib/db/schema/ecclesias';

/**
 * Cache Tag Constants for Precise On-Demand Revalidation
 */
export const CACHE_TAGS = {
  events: 'events',
  eventsPublished: 'events:published',
  event: (slug: string) => `event:${slug}`,
  products: 'products',
  productsAvailable: 'products:available',
  product: (slug: string) => `product:${slug}`,
  ecclesias: 'ecclesias',
  ecclesiasDisplayed: 'ecclesias:displayed',
  ecclesiasCount: 'ecclesias:count',
  settings: 'settings',
  settingsKey: (key: string) => `settings:${key}`,
  youthCount: 'settings:youth_count',
  adminMetrics: 'admin:metrics',
  users: 'users',
  user: (id: string) => `user:${id}`,
  auditLogs: 'audit_logs',
  reviews: 'reviews',
  productReviews: (productId: string) => `reviews:product:${productId}`,
} as const;

/**
 * Safe caching wrapper that utilizes Next.js Data Cache in HTTP/SSR context
 * while cleanly falling back to direct query execution in standalone worker/test scripts.
 */
function safeCache<T extends (...args: any[]) => Promise<any>>(
  cb: T,
  keyParts?: string[],
  options?: { revalidate?: number | false; tags?: string[] }
): T {
  const cachedFn = unstable_cache(cb, keyParts, options);
  return (async (...args: Parameters<T>) => {
    try {
      return await cachedFn(...args);
    } catch (err: any) {
      if (
        err?.message?.includes('incrementalCache missing') ||
        err?.message?.includes('Invariant: static generation') ||
        err?.message?.includes('Next.js Data Cache') ||
        process.env.NODE_ENV === 'test'
      ) {
        return await cb(...args);
      }
      throw err;
    }
  }) as unknown as T;
}

/**
 * Public event schedules must reflect edits immediately.
 */
export const getCachedPublishedEvents = (): Promise<Event[]> => getPublishedEvents();

/**
 * Cached Event by Slug for Public Detail View
 * Revalidated on-demand when event is updated or every 1 hour (3600s).
 */
export function getCachedEventBySlug(slug: string): Promise<Event | null> {
  return getEventBySlug(slug);
}

/**
 * Cached Available Products for Public Merch Store.
 * Revalidated on-demand when admin creates/updates/archives merchandise or every 5 minutes (300s).
 */
export function getCachedAvailableProducts(category?: string): Promise<Product[]> {
  const normCategory = category || 'all';
  return safeCache(
    async (): Promise<Product[]> => {
      return getAvailableProducts(category);
    },
    [`cached-available-products-${normCategory}`],
    {
      revalidate: 300,
      tags: [CACHE_TAGS.products, CACHE_TAGS.productsAvailable],
    }
  )();
}

/**
 * Cached Product by Slug for Public Merch Detail View.
 * Revalidated on-demand when product is edited or every 5 minutes (300s).
 */
export function getCachedProductBySlug(slug: string): Promise<Product | null> {
  return safeCache(
    async (): Promise<Product | null> => {
      return getProductBySlug(slug);
    },
    [`cached-product-${slug}`],
    {
      revalidate: 300,
      tags: [CACHE_TAGS.products, CACHE_TAGS.product(slug)],
    }
  )();
}

/**
 * Cached Displayed Ecclesias Directory
 * Revalidated on-demand when ecclesias are added/edited or every 24 hours (86400s).
 */
export const getCachedDisplayedEcclesias = safeCache(
  async (): Promise<Ecclesia[]> => {
    return getDisplayedEcclesias();
  },
  ['cached-displayed-ecclesias'],
  {
    revalidate: 86400,
    tags: [CACHE_TAGS.ecclesias, CACHE_TAGS.ecclesiasDisplayed],
  }
);

/**
 * Cached Ecclesia Count
 * Revalidated on-demand when ecclesias change or every 24 hours (86400s).
 */
export const getCachedEcclesiaCount = safeCache(
  async (): Promise<number> => {
    return getEcclesiaCount();
  },
  ['cached-ecclesia-count'],
  {
    revalidate: 86400,
    tags: [CACHE_TAGS.ecclesias, CACHE_TAGS.ecclesiasCount],
  }
);

/**
 * Cached Youth and Friends Count Metric
 * Revalidated on-demand when admin updates count or every 1 hour (3600s).
 */
export const getCachedYouthAndFriendsCount = safeCache(
  async (): Promise<number> => {
    return getYouthAndFriendsCount();
  },
  ['cached-youth-friends-count'],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.settings, CACHE_TAGS.youthCount],
  }
);

/**
 * Cached Site Setting Value
 * Revalidated on-demand when setting is updated or every 1 hour (3600s).
 */
export function getCachedSiteSetting(key: string, defaultValue: string = ''): Promise<string> {
  return safeCache(
    async (): Promise<string> => {
      return getSiteSetting(key, defaultValue);
    },
    [`cached-site-setting-${key}`],
    {
      revalidate: 3600,
      tags: [CACHE_TAGS.settings, CACHE_TAGS.settingsKey(key)],
    }
  )();
}

/**
 * Cached Payment Provider Settings
 * Revalidated on-demand when settings are updated or every 1 hour (3600s).
 */
export const getCachedPaymentSettings = safeCache(
  async () => {
    return getPaymentSettings();
  },
  ['cached-payment-settings'],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.settings],
  }
);

/**
 * Cached Admin Overview Metrics
 * Revalidated every 60s or on-demand when any admin resource is mutated.
 */
export const getCachedAdminOverviewMetrics = safeCache(
  async (): Promise<AdminOverviewMetrics> => {
    return getAdminOverviewMetrics();
  },
  ['cached-admin-overview-metrics'],
  {
    revalidate: 60,
    tags: [CACHE_TAGS.adminMetrics],
  }
);

/**
 * Cached Product Rating Summary (Average rating, total reviews, star breakdown)
 */
export async function getCachedProductRatingSummary(productId: string) {
  const { getProductRatingSummary } = await import('./reviews');
  return safeCache(
    async () => getProductRatingSummary(productId),
    [`cached-product-rating-summary-${productId}`],
    {
      revalidate: 300,
      tags: [CACHE_TAGS.reviews, CACHE_TAGS.productReviews(productId)],
    }
  )();
}

/**
 * Cached Product Reviews List
 */
export async function getCachedProductReviews(productId: string) {
  const { getProductReviews } = await import('./reviews');
  return safeCache(
    async () => getProductReviews(productId),
    [`cached-product-reviews-${productId}`],
    {
      revalidate: 300,
      tags: [CACHE_TAGS.reviews, CACHE_TAGS.productReviews(productId)],
    }
  )();
}

/**
 * Invalidate cache tag(s) immediately from Server Actions.
 * Utilizes Next.js 16 updateTag API with revalidateTag fallback.
 */
export function invalidateCacheTag(...tags: string[]): void {
  for (const tag of tags) {
    if (!tag) continue;
    try {
      if (typeof updateTag === 'function') {
        updateTag(tag);
      } else if (typeof revalidateTag === 'function') {
        (revalidateTag as any)(tag, 'max');
      }
    } catch {
      // Safe fallback - suppresses invariant errors outside request context
    }
  }
}
