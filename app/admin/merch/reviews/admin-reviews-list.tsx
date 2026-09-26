'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  adminToggleHideReviewAction,
  adminDeleteReviewAction,
} from '@/app/actions/reviews';
import type { getAdminAllReviews } from '@/lib/db/queries/reviews';
import {
  Search,
  Star,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

type AdminReviewItem = Awaited<ReturnType<typeof getAdminAllReviews>>[number];

interface AdminReviewsListProps {
  initialReviews: AdminReviewItem[];
}

export function AdminReviewsList({ initialReviews }: AdminReviewsListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<AdminReviewItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredReviews = initialReviews.filter((rev) => {
    if (ratingFilter !== 'ALL' && String(rev.rating) !== ratingFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProd = rev.product.name.toLowerCase().includes(q);
      const matchName = `${rev.user.firstName} ${rev.user.lastName}`.toLowerCase().includes(q);
      const matchComment = rev.comment.toLowerCase().includes(q);
      return matchProd || matchName || matchComment;
    }

    return true;
  });

  const handleToggleHide = async (review: AdminReviewItem) => {
    const formData = new FormData();
    formData.set('reviewId', review.id);
    formData.set('isHidden', String(!review.isHidden));

    const result = await adminToggleHideReviewAction(formData);
    if (result.success) {
      startTransition(() => {
        router.refresh();
      });
    } else {
      alert(result.error || 'Failed to update visibility.');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    setActionError(null);

    const formData = new FormData();
    formData.set('reviewId', deleteTarget.id);

    const result = await adminDeleteReviewAction(formData);
    if (result.success) {
      setDeleteTarget(null);
      startTransition(() => {
        router.refresh();
      });
    } else {
      setActionError(result.error || 'Failed to delete review.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <Card className="bg-white dark:bg-[#1b2117] border-[#e6dfcb] dark:border-[#323d2b]">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9180]" />
            <Input
              type="text"
              placeholder="Search reviewer name, product, or comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-[#f8f4e3]/60 dark:bg-[#131710] border-[#e6dfcb] dark:border-[#323d2b]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-[#f8f4e3]/70 dark:bg-[#131710] border border-[#e6dfcb] dark:border-[#323d2b] text-xs font-semibold text-[#2c3324] dark:text-[#fefcf1]"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden bg-white dark:bg-[#1b2117] border-[#e6dfcb] dark:border-[#323d2b]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#f8f4e3] dark:bg-[#161c12] border-b border-[#e6dfcb] dark:border-[#323d2b] text-[#707666] dark:text-[#a3ab98] font-semibold">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">Rating & Feedback</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6dfcb]/60 dark:divide-[#323d2b]/60">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#707666] dark:text-[#a3ab98]">
                    No customer reviews found matching your search.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => {
                  const thumb =
                    rev.product.imageUrls && rev.product.imageUrls.length > 0
                      ? rev.product.imageUrls[0]
                      : '/images/logo/pcyc-transparent-logo.png';

                  return (
                    <tr
                      key={rev.id}
                      className="hover:bg-[#f8f4e3]/40 dark:hover:bg-[#20271b] transition-colors"
                    >
                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-lg bg-[#f8f4e3] dark:bg-[#131710] overflow-hidden shrink-0 border border-[#e6dfcb]/60 dark:border-[#323d2b]">
                            <Image
                              src={thumb}
                              alt={rev.product.name}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/merch/${rev.product.slug}`}
                              target="_blank"
                              className="font-bold text-xs text-[#2c3324] dark:text-[#fefcf1] hover:text-[#e0a861] flex items-center gap-1"
                            >
                              <span>{rev.product.name}</span>
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Reviewer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-[#2c3324] dark:text-[#fefcf1]">
                          {rev.user.firstName} {rev.user.lastName}
                        </div>
                        <div className="text-[10px] text-[#8a9180]">
                          {rev.user.designation} &bull; {rev.user.ecclesia || 'Independent'}
                        </div>
                      </td>

                      {/* Rating & Feedback */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= rev.rating
                                  ? 'fill-[#e0a861] text-[#e0a861]'
                                  : 'text-[#d6ceb8] dark:text-[#3d4632]'
                              }`}
                            />
                          ))}
                          <span className="font-bold text-xs ml-1">{rev.rating} / 5</span>
                        </div>
                        <p className="text-xs text-[#505748] dark:text-[#c4cbb8] line-clamp-2 italic">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-[#707666] dark:text-[#a3ab98] whitespace-nowrap">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={rev.isHidden ? 'destructive' : 'success'}
                          size="sm"
                        >
                          {rev.isHidden ? 'Hidden' : 'Visible'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Hide / Unhide Toggle */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleToggleHide(rev)}
                            title={rev.isHidden ? 'Make review visible' : 'Hide from store'}
                          >
                            {rev.isHidden ? (
                              <>
                                <Eye className="h-3 w-3 mr-1 text-[#2e7d32]" />
                                <span>Unhide</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1 text-[#e0a861]" />
                                <span>Hide</span>
                              </>
                            )}
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => setDeleteTarget(rev)}
                            title="Permanently remove review"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Customer Review"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl text-red-800 dark:text-red-300">
              <p>
                Are you sure you want to permanently delete this review for{' '}
                <strong>{deleteTarget.product.name}</strong> by{' '}
                <strong>
                  {deleteTarget.user.firstName} {deleteTarget.user.lastName}
                </strong>?
              </p>
              <p className="mt-1 italic text-[11px]">&ldquo;{deleteTarget.comment}&rdquo;</p>
            </div>

            {actionError && (
              <div className="p-2.5 rounded-lg bg-red-100 text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="md"
                onClick={handleDeleteSubmit}
              >
                Confirm Deletion
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
