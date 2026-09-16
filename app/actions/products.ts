'use server';

import { db } from '@/lib/db';
import { products } from '@/lib/db/schema/products';
import { orderItems } from '@/lib/db/schema/orders';
import { getCurrentUserProfile } from '@/lib/db/queries/users';
import { productSchema } from '@/lib/validators';
import { logger } from '@/lib/logger';
import { saveUploadedImage } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { CACHE_TAGS, invalidateCacheTag } from '@/lib/db/queries/cached';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

export interface AdminProductActionState {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  payload?: any;
}

/**
 * Server Action for Admins to add new Merchandise to PostgreSQL database.
 */
export async function createProductAction(
  prevState: AdminProductActionState,
  formData: FormData
): Promise<AdminProductActionState> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN')) {
      return {
        success: false,
        error: 'Unauthorized: Admin privileges required to manage merchandise.',
      };
    }

    // Handle Image File from Device Upload
    let imageUrl = '/images/logo/pcyc-transparent-logo.png';
    const imageFile = formData.get('imageFile') as File | null;

    if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
      const slugPrefix = (formData.get('slug') as string) || 'product';
      const uploadResult = await saveUploadedImage(imageFile, 'merch', slugPrefix);

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload merchandise image.',
        };
      }

      imageUrl = uploadResult.url!;
    }

    const rawSizes = formData.getAll('sizes');
    const sizes = rawSizes.length > 0 ? (rawSizes as string[]) : ['XS', 'S', 'M', 'L', 'XL', '2XL'];

    const rawData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      price: formData.get('price') ? Number(formData.get('price')) : 0,
      category: formData.get('category') || 'Apparel',
      stockQuantity: formData.get('stockQuantity') ? Number(formData.get('stockQuantity')) : 0,
      imageUrls: [imageUrl],
      availableSizes: sizes,
      isAvailable: formData.get('isAvailable') === 'on' || formData.get('isAvailable') === 'true',
      isPreorder: formData.get('isPreorder') === 'on' || formData.get('isPreorder') === 'true',
    };

    const parsed = productSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Please correct the highlighted errors in the form.',
        fieldErrors: parsed.error.flatten().fieldErrors,
        payload: rawData,
      };
    }

    try {
      await db.insert(products).values({
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        price: parsed.data.price.toFixed(2),
        category: parsed.data.category,
        stockQuantity: parsed.data.stockQuantity,
        imageUrls: parsed.data.imageUrls,
        availableSizes: parsed.data.availableSizes,
        isAvailable: parsed.data.isAvailable ?? true,
        isPreorder: parsed.data.isPreorder ?? false,
      });

      logger.info({ slug: parsed.data.slug, adminId: profile.id }, 'New product created by admin');
    } catch (error: any) {
      logger.error({ error: error?.message }, 'Failed to insert product into database');
      return {
        success: false,
        error: error?.message?.includes('duplicate key')
          ? 'A product with this URL slug already exists. Please choose a unique slug.'
          : 'Failed to create merchandise item. Please try again.',
      };
    }

    try {
      invalidateCacheTag(CACHE_TAGS.products, CACHE_TAGS.productsAvailable);
      revalidatePath('/merch');
      revalidatePath('/admin/merch');
      revalidatePath('/');
    } catch (cacheErr: any) {
      logger.warn({ error: cacheErr?.message }, 'Cache revalidation warning');
    }

    redirect('/admin/merch');
  } catch (err: any) {
    if (
      err?.digest === 'DYNAMIC_SERVER_USAGE' ||
      err?.message?.includes('DYNAMIC_SERVER_USAGE') ||
      err?.digest?.startsWith('NEXT_') ||
      err?.message === 'NEXT_REDIRECT'
    ) {
      throw err;
    }
    logger.error({ error: err?.message || err }, 'Unhandled error in createProductAction');
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Server Action for Admins to update an existing Merchandise Product in PostgreSQL.
 */
export async function updateProductAction(
  prevState: AdminProductActionState,
  formData: FormData
): Promise<AdminProductActionState> {
  try {
    const productId = formData.get('productId') as string;
    if (!productId) {
      logger.warn('Update product attempt rejected: missing productId');
      return {
        success: false,
        error: 'Invalid request: Product ID is required.',
      };
    }

    // 1. RBAC Guard
    const profile = await getCurrentUserProfile();
    if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN')) {
      logger.warn({ productId, userId: profile?.id }, 'Unauthorized attempt to edit product');
      return {
        success: false,
        error: 'Unauthorized: Admin privileges required to manage merchandise.',
      };
    }

    // 2. Image Resolution (Preserve existing image unless replacement is uploaded)
    let imageUrl = (formData.get('existingImageUrl') as string) || '/images/logo/pcyc-transparent-logo.png';
    const imageFile = formData.get('imageFile') as File | null;

    if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
      const slugPrefix = (formData.get('slug') as string) || 'product';
      const uploadResult = await saveUploadedImage(imageFile, 'merch', slugPrefix);

      if (!uploadResult.success) {
        logger.warn({ error: uploadResult.error, productId }, 'Merchandise image upload rejected during edit');
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload new merchandise image.',
        };
      }

      imageUrl = uploadResult.url!;
    }

    // 3. Extract and Sanitize Inputs
    const rawSizes = formData.getAll('sizes');
    const sizes = rawSizes.length > 0 ? (rawSizes as string[]) : ['XS', 'S', 'M', 'L', 'XL', '2XL'];

    const rawData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      price: formData.get('price') ? Number(formData.get('price')) : 0,
      category: formData.get('category') || 'Apparel',
      stockQuantity: formData.get('stockQuantity') ? Number(formData.get('stockQuantity')) : 0,
      imageUrls: [imageUrl],
      availableSizes: sizes,
      isAvailable: formData.get('isAvailable') === 'on' || formData.get('isAvailable') === 'true',
      isPreorder: formData.get('isPreorder') === 'on' || formData.get('isPreorder') === 'true',
    };

    const parsed = productSchema.safeParse(rawData);
    if (!parsed.success) {
      logger.warn({ productId, fieldErrors: parsed.error.flatten().fieldErrors }, 'Product update failed schema validation');
      return {
        success: false,
        error: 'Please correct the highlighted errors in the form.',
        fieldErrors: parsed.error.flatten().fieldErrors,
        payload: rawData,
      };
    }

    // 4. Parameterized Database Mutation
    try {
      await db
        .update(products)
        .set({
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description,
          price: parsed.data.price.toFixed(2),
          category: parsed.data.category,
          stockQuantity: parsed.data.stockQuantity,
          imageUrls: parsed.data.imageUrls,
          availableSizes: parsed.data.availableSizes,
          isAvailable: parsed.data.isAvailable ?? true,
          isPreorder: parsed.data.isPreorder ?? false,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      logger.info(
        {
          productId,
          slug: parsed.data.slug,
          adminId: profile.id,
          price: parsed.data.price,
          stock: parsed.data.stockQuantity,
        },
        'Product successfully updated by administrator'
      );
    } catch (error: any) {
      logger.error({ error: error?.message, productId }, 'Failed to update product in database');
      return {
        success: false,
        error: error?.message?.includes('duplicate key')
          ? 'A product with this URL slug already exists. Please choose a unique slug.'
          : 'Failed to update merchandise item. Please try again.',
      };
    }

    // 5. Cache Revalidation & Navigation
    try {
      invalidateCacheTag(
        CACHE_TAGS.products,
        CACHE_TAGS.productsAvailable,
        CACHE_TAGS.product(parsed.data.slug)
      );
      revalidatePath('/merch');
      revalidatePath(`/merch/${parsed.data.slug}`);
      revalidatePath('/admin/merch');
      revalidatePath('/');
    } catch (cacheErr: any) {
      logger.warn({ error: cacheErr?.message }, 'Cache revalidation warning');
    }

    redirect('/admin/merch');
  } catch (err: any) {
    if (
      err?.digest === 'DYNAMIC_SERVER_USAGE' ||
      err?.message?.includes('DYNAMIC_SERVER_USAGE') ||
      err?.digest?.startsWith('NEXT_') ||
      err?.message === 'NEXT_REDIRECT'
    ) {
      throw err;
    }
    logger.error({ error: err?.message || err }, 'Unhandled error in updateProductAction');
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Server Action for Admins to delete a Product via form submission.
 */
export async function deleteProductAction(formData: FormData): Promise<AdminProductActionState> {
  try {
    const productId = formData.get('productId') as string;
    if (!productId) {
      return { success: false, error: 'Product ID is missing.' };
    }

    const profile = await getCurrentUserProfile();
    if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN')) {
      logger.warn({ productId }, 'Unauthorized attempt to delete product');
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }

    try {
      const [productRecord] = await db
        .select({ id: products.id, slug: products.slug })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!productRecord) {
        return { success: false, error: 'Product not found.' };
      }

      const [existingOrder] = await db
        .select({ id: orderItems.id })
        .from(orderItems)
        .where(eq(orderItems.productId, productId))
        .limit(1);

      if (existingOrder) {
        await db
          .update(products)
          .set({ isAvailable: false, updatedAt: new Date() })
          .where(eq(products.id, productId));
        logger.info({ productId, adminId: profile.id }, 'Product archived because it has order history');
      } else {
        await db.delete(products).where(eq(products.id, productId));
        logger.info({ productId, adminId: profile.id }, 'Product deleted by administrator');
      }

      invalidateCacheTag(
        CACHE_TAGS.products,
        CACHE_TAGS.productsAvailable,
        CACHE_TAGS.product(productRecord.slug),
        CACHE_TAGS.adminMetrics
      );
      revalidatePath('/merch');
      revalidatePath(`/merch/${productRecord.slug}`);
      revalidatePath('/admin/merch');
      revalidatePath('/');
      return {
        success: true,
        message: existingOrder
          ? 'Product archived because it has existing orders.'
          : 'Product permanently deleted.',
      };
    } catch (error: any) {
      logger.error({ error: error?.message, productId }, 'Failed to delete product');
      return { success: false, error: 'Unable to delete or archive this product.' };
    }
  } catch (err: any) {
    logger.error({ error: err?.message || err }, 'Unhandled error in deleteProductAction');
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
