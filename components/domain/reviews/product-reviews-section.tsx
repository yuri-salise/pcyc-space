'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { UserAvatar } from '@/components/molecules/user-avatar';
import type { ProductReviewWithAuthor, ProductRatingSummary } from '@/lib/db/queries/reviews';
import {
  Star,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  ratingSummary: ProductRatingSummary;
  reviews: ProductReviewWithAuthor[];
  isAuthenticated: boolean;
}

const PAGE_SIZE = 6;

export function ProductReviewsSection({
  productId,
  productName,
  ratingSummary,
  reviews,
  isAuthenticated,
}: ProductReviewsSectionProps) {
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { averageRating, totalReviews, distribution } = ratingSummary;

  const filteredReviews = filterRating
    ? reviews.filter((r) => r.rating === filterRating)
    : reviews;

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + PAGE_SIZE);

  const handleRatingFilterChange = (rating: number | null) => {
    setFilterRating(rating);
    setCurrentPage(1);
  };

  return (
    <section className="space-y-8 pt-12 border-t border-[#e6dfcb] dark:border-[#323d2b]">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#e0a861]">
            Brethren Feedback
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2c3324] dark:text-[#fefcf1] mt-1">
            Ratings & Reviews
          </h2>
        </div>

        <Link href={isAuthenticated ? '/orders' : '/login?redirectTo=/orders'}>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ShoppingBag className="h-3.5 w-3.5 text-[#e0a861]" />
            <span>Manage My Orders & Reviews</span>
          </Button>
        </Link>
      </div>

      {/* Ratings Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Big Average Score */}
        <div className="md:col-span-5 p-6 rounded-3xl bg-[#f8f4e3] dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] flex flex-col items-center justify-center text-center space-y-3">
          <div className="font-serif font-bold text-5xl sm:text-6xl text-[#2c3324] dark:text-[#fefcf1]">
            {averageRating > 0 ? averageRating.toFixed(1) : '—'}
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(averageRating)
                    ? 'fill-[#e0a861] text-[#e0a861]'
                    : 'text-[#d6ceb8] dark:text-[#3d4632]'
                }`}
              />
            ))}
          </div>

          <p className="text-xs font-semibold text-[#707666] dark:text-[#a3ab98]">
            {totalReviews > 0
              ? `Based on ${totalReviews} verified ${totalReviews === 1 ? 'review' : 'reviews'}`
              : 'No reviews yet for this product'}
          </p>
        </div>

        {/* Right Column: Star Breakdown Bars */}
        <div className="md:col-span-7 p-6 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] flex flex-col justify-center space-y-2.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars as keyof typeof distribution] || 0;
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            const isSelected = filterRating === stars;

            return (
              <button
                key={stars}
                type="button"
                onClick={() => handleRatingFilterChange(isSelected ? null : stars)}
                className={`w-full flex items-center gap-3 text-xs group transition-opacity ${
                  filterRating && !isSelected ? 'opacity-40 hover:opacity-100' : 'opacity-100'
                }`}
              >
                <span className="w-8 font-bold text-right text-[#2c3324] dark:text-[#fefcf1]">
                  {stars}★
                </span>

                <div className="flex-1 h-3 rounded-full bg-[#f8f4e3] dark:bg-[#131710] overflow-hidden border border-[#e6dfcb]/60 dark:border-[#323d2b]">
                  <div
                    className="h-full bg-[#e0a861] transition-all duration-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-12 text-left font-mono text-[11px] text-[#707666] dark:text-[#a3ab98]">
                  {count} ({percentage}%)
                </span>
              </button>
            );
          })}

          {filterRating && (
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => handleRatingFilterChange(null)}
                className="text-[11px] font-bold text-[#9a6423] dark:text-[#f0be7c] hover:underline"
              >
                Clear {filterRating}★ filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews List */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-lg text-[#2c3324] dark:text-[#fefcf1] flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#e0a861]" />
          <span>
            {filterRating
              ? `${filterRating}-Star Reviews (${filteredReviews.length})`
              : `All Reviews (${reviews.length})`}
          </span>
        </h3>

        {filteredReviews.length === 0 ? (
          <Card className="bg-[#f8f4e3]/50 dark:bg-[#1b2117]/50 border-dashed border-[#e6dfcb] dark:border-[#323d2b] p-8 text-center">
            <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
              {totalReviews === 0
                ? 'No reviews yet. Brethren who order and receive this item will be able to share their thoughts!'
                : 'No reviews found matching the selected star filter.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedReviews.map((rev) => {
                const prefix =
                  rev.user.designation === 'BROTHER'
                    ? 'Bro.'
                    : rev.user.designation === 'SISTER'
                    ? 'Sis.'
                    : 'Friend';

                return (
                  <Card
                    key={rev.id}
                    className="bg-white dark:bg-[#1b2117] border-[#e6dfcb] dark:border-[#323d2b] p-5 space-y-3.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          firstName={rev.user.firstName}
                          lastName={rev.user.lastName}
                          designation={rev.user.designation}
                          size="sm"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-xs text-[#2c3324] dark:text-[#fefcf1]">
                            <span>
                              {prefix} {rev.user.firstName} {rev.user.lastName.charAt(0)}.
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-[#2e7d32] font-semibold">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Verified Buyer</span>
                            </span>
                          </div>
                          <p className="text-[10px] text-[#707666] dark:text-[#a3ab98]">
                            {rev.user.ecclesia || 'Philippine Ecclesias'} &bull;{' '}
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= rev.rating
                                ? 'fill-[#e0a861] text-[#e0a861]'
                                : 'text-[#d6ceb8] dark:text-[#3d4632]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review Text */}
                    <p className="text-xs text-[#505748] dark:text-[#c4cbb8] leading-relaxed italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </Card>
                );
              })}
            </div>

            {filteredReviews.length > PAGE_SIZE && (
              <div className="pt-2 flex justify-center">
                <Pagination
                  currentPage={activePage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                  totalItems={filteredReviews.length}
                  pageSize={PAGE_SIZE}
                  showCount={true}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
