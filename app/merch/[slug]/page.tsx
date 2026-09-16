import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/molecules/price-tag';
import {
  getCachedProductBySlug,
  getCachedProductRatingSummary,
  getCachedProductReviews,
  getCachedPaymentSettings,
} from '@/lib/db/queries/cached';
import { getCurrentUserProfile } from '@/lib/db/queries/users';
import { ProductOrderForm } from '@/components/domain/merch/product-order-form';
import { ProductReviewsSection } from '@/components/domain/reviews/product-reviews-section';
import { ProductImageShowcase } from '@/components/merch/product-image-showcase';
import { ProductSizeGuideModal } from '@/components/merch/product-size-guide-modal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tote, Truck, ShieldCheck, PencilSimple, UserCirclePlus, SignIn, HandHeart } from '@phosphor-icons/react/dist/ssr';
import { InteractiveCard } from '@/components/ui/interactive-card';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found — PCYC Space' };
  }

  return {
    title: `${product.name} — PCYC Space Merch`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [profile, ratingSummary, reviews, paymentSettings] = await Promise.all([
    getCurrentUserProfile(),
    getCachedProductRatingSummary(product.id),
    getCachedProductReviews(product.id),
    getCachedPaymentSettings(),
  ]);

  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN';
  if (!product.isAvailable && !isAdmin) {
    notFound();
  }

  const sizes = (product.availableSizes as string[]) || [];

  return (
    <div className="flex flex-col w-full bg-cream min-h-screen overflow-hidden">
      {/* Top Editorial Breadcrumbs Bar */}
      <div className="bg-[#f8f4e3] dark:bg-[#1b2117] py-3.5 border-b border-[#e6dfcb] dark:border-[#323d2b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs font-medium text-[#707666] dark:text-[#a3ab98] overflow-x-auto whitespace-nowrap">
            <Link
              href="/"
              className="hover:text-[#2c3324] dark:hover:text-[#fefcf1] transition-colors"
            >
              Home
            </Link>
            <span className="text-[#c5ccc0] dark:text-[#5a634e]">/</span>
            <Link
              href="/merch"
              className="hover:text-[#2c3324] dark:hover:text-[#fefcf1] transition-colors"
            >
              Merch Store
            </Link>
            <span className="text-[#c5ccc0] dark:text-[#5a634e]">/</span>
            <span className="text-[#9a6423] dark:text-[#f0be7c] font-semibold">
              {product.category}
            </span>
            <span className="text-[#c5ccc0] dark:text-[#5a634e]">/</span>
            <span className="text-[#2c3324] dark:text-[#fefcf1] font-semibold truncate max-w-[240px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
            
            {/* Left Column: Visual Showcase & Mission Bento Pods */}
            <div className="lg:col-span-6 space-y-6">
              {/* Interactive 3D Image Showcase */}
              <ProductImageShowcase
                imageUrls={product.imageUrls as string[]}
                productName={product.name}
                isPreorder={product.isPreorder}
                category={product.category}
              />

              {/* 3D Bento Features Pods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mission Impact Pod */}
                <InteractiveCard className="h-full p-5 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-xs hover:border-[#e0a861]/60 transition-all space-y-2">
                  <div className="h-10 w-10 rounded-2xl bg-[#fbf1e2] dark:bg-[#252e1f] text-[#e0a861] flex items-center justify-center shadow-xs">
                    <HandHeart weight="duotone" className="h-5 w-5 text-[#9a6423] dark:text-[#f0be7c]" />
                  </div>
                  <strong className="block font-serif text-base text-[#2c3324] dark:text-[#fefcf1]">
                    100% Mission Funded
                  </strong>
                  <p className="text-xs text-[#707666] dark:text-[#a3ab98] leading-relaxed">
                    Every purchase directly subsidizes boat & bus fares for provincial youth delegates.
                  </p>
                </InteractiveCard>

                {/* Fulfillment Pod */}
                <InteractiveCard className="h-full p-5 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-xs hover:border-[#e0a861]/60 transition-all space-y-2">
                  <div className="h-10 w-10 rounded-2xl bg-[#fbf1e2] dark:bg-[#252e1f] text-[#e0a861] flex items-center justify-center shadow-xs">
                    <Truck weight="duotone" className="h-5 w-5 text-[#9a6423] dark:text-[#f0be7c]" />
                  </div>
                  <strong className="block font-serif text-base text-[#2c3324] dark:text-[#fefcf1]">
                    Camp Pickup or Door Ship
                  </strong>
                  <p className="text-xs text-[#707666] dark:text-[#a3ab98] leading-relaxed">
                    Free pickup at nationwide camp check-in, or door-to-door courier anywhere in PH.
                  </p>
                </InteractiveCard>
              </div>
            </div>

            {/* Right Column: Title, Price, Sizes, Checkout Action & Story */}
            <div className="lg:col-span-6 space-y-6">
              {/* Product Header & Pricing */}
              <div className="space-y-3">
                {/* Category & Availability Bar */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold uppercase tracking-wider">
                  <span className="px-3 py-1 rounded-full bg-[#e0a861]/15 text-[#9a6423] dark:text-[#f0be7c] border border-[#e0a861]/30">
                    {product.category}
                  </span>
                  {product.isAvailable ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      In Stock & Ready
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-[#707666]/10 text-[#707666] dark:text-[#a3ab98] border border-[#707666]/20 text-xs font-semibold">
                      Made-to-Order Batch
                    </span>
                  )}
                </div>
                
                {/* Product Title */}
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2c3324] dark:text-[#fefcf1] tracking-tight leading-[1.1]">
                  {product.name}
                </h1>
                
                {/* Price & Support Notice */}
                <div className="flex flex-wrap items-baseline gap-3 pt-1">
                  <PriceTag price={product.price} className="text-3xl sm:text-4xl text-[#9a6423] dark:text-[#f0be7c] font-serif font-bold" />
                  <span className="text-xs text-[#707666] dark:text-[#a3ab98] font-medium">
                    • 100% Proceeds Fund Youth Ministry Camps
                  </span>
                </div>
              </div>

              {/* Available Sizes Overview & Size Guide */}
              {sizes.length > 0 && (
                <div className="pt-2 pb-1 space-y-3 border-t border-[#e6dfcb] dark:border-[#323d2b]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2c3324] dark:text-[#fefcf1]">
                      Manufactured Sizes
                    </span>
                    {product.category === 'Apparel' && <ProductSizeGuideModal />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <span
                        key={s}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] text-[#2c3324] dark:text-[#fefcf1] shadow-2xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Action Card */}
              <div>
                {profile && (profile.role === 'ADMIN' || profile.role === 'SUPERADMIN') ? (
                  /* Admin View */
                  <div className="p-8 sm:p-10 rounded-[2.5rem] bg-[#f8f4e3] dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] space-y-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-[#2c3324] text-[#e0a861] flex items-center justify-center shadow-md">
                        <ShieldCheck weight="duotone" className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-[#2c3324] dark:text-[#fefcf1]">
                          Admin Product CMS
                        </h3>
                        <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
                          Logged in as {profile.email} ({profile.role})
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/60 dark:bg-[#20271c] border border-[#e6dfcb] dark:border-[#323d2b] space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#707666] dark:text-[#a3ab98]">Stock Count:</span>
                        <strong className="text-[#2c3324] dark:text-[#fefcf1] font-mono">{product.stockQuantity} units</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#707666] dark:text-[#a3ab98]">Catalog Status:</span>
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          {product.isAvailable ? 'Publicly Listed' : 'Hidden from Catalog'}
                        </strong>
                      </div>
                    </div>

                    <p className="text-sm text-[#5a634e] dark:text-[#a3ab98] leading-relaxed">
                      You are previewing this product as an administrator. To purchase this item for personal use, please use a standard member account.
                    </p>

                    <div className="flex flex-col gap-3 pt-2">
                      <Link href={`/admin/merch/${product.id}/edit`}>
                        <Button variant="primary" size="lg" className="w-full gap-2 rounded-full py-5 text-sm shadow-md">
                          <PencilSimple weight="bold" className="h-4 w-4" />
                          <span>Edit Product Listing</span>
                        </Button>
                      </Link>
                      <Link href="/admin/orders">
                        <Button variant="outline" size="lg" className="w-full gap-2 rounded-full py-5 text-sm">
                          <span>View Orders Dashboard</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : profile ? (
                  /* Authenticated Member View */
                  <div className="rounded-[2.5rem] bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-2xl shadow-[#e0a861]/10 overflow-hidden">
                    <ProductOrderForm product={product} user={profile} paymentSettings={paymentSettings} />
                  </div>
                ) : (
                  /* Guest View */
                  <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-xl text-center space-y-6">
                    <div className="h-16 w-16 rounded-2xl bg-[#2c3324] text-[#e0a861] mx-auto flex items-center justify-center shadow-lg">
                      <Tote weight="duotone" className="h-8 w-8" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#2c3324] dark:text-[#fefcf1]">
                        Member Checkout
                      </h3>
                      <p className="text-xs text-[#5a634e] dark:text-[#a3ab98] max-w-sm mx-auto leading-relaxed">
                        Sign in with your PCYC account to select sizes, choose camp pickup or courier delivery, and complete your order.
                      </p>
                    </div>

                    {/* Quick Features List */}
                    <div className="p-4 rounded-2xl bg-[#f8f4e3] dark:bg-[#20271c] border border-[#e6dfcb] dark:border-[#323d2b] text-left text-xs space-y-2">
                      <div className="flex items-center gap-2 text-[#2c3324] dark:text-[#fefcf1]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#e0a861]" />
                        <span>Secure {paymentSettings.platform} receipt verification by treasury</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#2c3324] dark:text-[#fefcf1]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#e0a861]" />
                        <span>Live status updates in your member portal</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#2c3324] dark:text-[#fefcf1]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#e0a861]" />
                        <span>100% proceeds directly fund youth camp travel</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <Link href={`/login?redirectTo=/merch/${product.slug}`} className="w-full">
                        <Button variant="primary" size="lg" className="w-full gap-2 rounded-full py-5 shadow-md bg-[#2c3324] text-white hover:bg-[#3d4632] dark:bg-[#e0a861] dark:text-[#131710]">
                          <SignIn weight="bold" className="h-4 w-4" />
                          <span className="text-sm font-semibold">Sign In to Order</span>
                        </Button>
                      </Link>

                      <Link href="/register" className="w-full">
                        <Button variant="outline" size="lg" className="w-full gap-2 rounded-full py-5 border-[#e6dfcb] dark:border-[#323d2b]">
                          <UserCirclePlus weight="bold" className="h-4 w-4" />
                          <span className="text-sm font-semibold">Register New Account</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Description Markdown */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2c3324] dark:text-[#fefcf1]">
                  Product Story & Specifications
                </h3>
                <div className="prose prose-sm sm:prose-base dark:prose-invert prose-p:leading-relaxed prose-li:my-1 text-[#5a634e] dark:text-[#a3ab98] font-serif">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {product.description}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>

          {/* Product Ratings & Verified Customer Reviews Section */}
          <ProductReviewsSection
            productId={product.id}
            productName={product.name}
            ratingSummary={ratingSummary}
            reviews={reviews}
            isAuthenticated={!!profile}
          />
        </div>
      </section>
    </div>
  );
}

