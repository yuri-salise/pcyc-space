import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/db/queries/users';
import { getAdminAllReviews } from '@/lib/db/queries/reviews';
import { AdminReviewsList } from './admin-reviews-list';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Customer Reviews Moderation — PCYC Space Admin',
  description: 'Moderate merchandise product ratings, hide inappropriate comments, and manage customer reviews.',
};

export default async function AdminReviewsPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN')) {
    redirect('/portal');
  }

  const reviewsList = await getAdminAllReviews();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/merch"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#e0a861] hover:text-[#f0be7c] transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Merchandise Inventory</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2c3324] dark:text-[#fefcf1] flex items-center gap-2.5">
              <MessageSquare className="h-7 w-7 text-[#e0a861]" />
              <span>Customer Ratings & Reviews Moderation</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#707666] dark:text-[#a3ab98] mt-1">
              Review verified buyer ratings, moderate feedback comments, and maintain community standards.
            </p>
          </div>
        </div>
      </div>

      {/* Main Reviews Moderation List */}
      <AdminReviewsList initialReviews={reviewsList} />
    </div>
  );
}
