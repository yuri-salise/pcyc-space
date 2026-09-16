'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import dynamic from 'next/dynamic';
import { cancelOrderAction } from '@/app/actions/orders';
import { formatCurrency } from '@/lib/utils';
import type { OrderWithDetails } from '@/lib/db/queries/orders';
import type { ProductReview } from '@/lib/db/schema/reviews';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  AlertCircle,
  Upload,
  Eye,
  Star,
  MapPin,
  Calendar,
} from 'lucide-react';

const ReviewModal = dynamic(
  () => import('@/components/domain/reviews/review-modal').then((mod) => mod.ReviewModal),
  { ssr: false }
);

const ReceiptUploadModal = dynamic(
  () => import('@/components/domain/orders/receipt-upload-modal').then((mod) => mod.ReceiptUploadModal),
  { ssr: false }
);

interface OrderCardProps {
  order: OrderWithDetails;
  userReviews?: Record<string, ProductReview>; // Keyed by `${orderId}:${productId}`
  paymentSettings: {
    platform: string;
    accountName: string;
    accountNumber: string;
    qrUrl: string;
  };
}

export function OrderCard({ order, userReviews = {}, paymentSettings }: OrderCardProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isViewReceiptOpen, setIsViewReceiptOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Review modal state
  const [reviewTarget, setReviewTarget] = useState<{
    productId: string;
    productName: string;
    productImageUrl?: string;
  } | null>(null);

  const isUnpaid = order.status === 'PENDING_PAYMENT';
  const isVerificationQueued = order.status === 'VERIFICATION_QUEUED';
  const isPaidOrPreparing = order.status === 'PAID' || order.status === 'PREPARING';
  const isShipped = order.status === 'SHIPPED';
  const isCompleted = order.status === 'COMPLETED';
  const isCancelled = order.status === 'CANCELLED';

  const handleCancelSubmit = async () => {
    setIsCancelling(true);
    setCancelError(null);
    const formData = new FormData();
    formData.set('orderId', order.id);

    const result = await cancelOrderAction(formData);
    setIsCancelling(false);
    if (result.success) {
      setIsCancelModalOpen(false);
    } else {
      setCancelError(result.error || 'Failed to cancel order.');
    }
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case 'PENDING_PAYMENT':
        return (
          <Badge variant="destructive" size="sm" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>Unpaid / Action Needed</span>
          </Badge>
        );
      case 'VERIFICATION_QUEUED':
        return (
          <Badge variant="gold" size="sm" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending Verification</span>
          </Badge>
        );
      case 'PAID':
      case 'PREPARING':
        return (
          <Badge variant="forest" size="sm" className="gap-1">
            <Package className="h-3 w-3" />
            <span>Preparing Order</span>
          </Badge>
        );
      case 'SHIPPED':
        return (
          <Badge variant="forest" size="sm" className="gap-1">
            <Truck className="h-3 w-3" />
            <span>In Transit / Shipped</span>
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive" size="sm" className="gap-1">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </Badge>
        );
      default:
        return <Badge size="sm">{order.status}</Badge>;
    }
  };

  // Stepper progress level (0: Placed, 1: Verified, 2: In Transit, 3: Completed)
  const getStepperIndex = () => {
    if (isCompleted) return 3;
    if (isShipped) return 2;
    if (isPaidOrPreparing) return 1;
    if (isVerificationQueued) return 0.5;
    return 0;
  };

  const stepIndex = getStepperIndex();

  return (
    <>
      <Card className="overflow-hidden bg-white dark:bg-[#1b2117] border-[#e6dfcb] dark:border-[#323d2b] shadow-xs">
        {/* Top Header Strip */}
        <div className="p-4 sm:p-5 bg-[#f8f4e3] dark:bg-[#161c12] border-b border-[#e6dfcb] dark:border-[#323d2b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#707666] dark:text-[#a3ab98] block">
                Order Number
              </span>
              <span className="font-mono font-bold text-sm sm:text-base text-[#2c3324] dark:text-[#fefcf1]">
                #{order.orderNumber}
              </span>
            </div>
            <div className="h-6 w-px bg-[#e6dfcb] dark:bg-[#323d2b] hidden sm:block" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#707666] dark:text-[#a3ab98] block">
                Order Date
              </span>
              <span className="text-xs sm:text-sm text-[#505748] dark:text-[#a3ab98]">
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="h-6 w-px bg-[#e6dfcb] dark:bg-[#323d2b] hidden sm:block" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#707666] dark:text-[#a3ab98] block">
                Total Amount
              </span>
              <span className="font-bold text-sm sm:text-base text-[#9a6423] dark:text-[#e0a861]">
                {formatCurrency(Number(order.totalAmount))}
              </span>
            </div>
          </div>

          <div>{getStatusBadge()}</div>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Visual Fulfillment Tracker (Hidden if Cancelled) */}
          {!isCancelled && (
            <div className="py-2 border-b border-[#e6dfcb]/60 dark:border-[#323d2b]/60">
              <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4">
                {/* Connecting Track Line */}
                <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-[#e6dfcb] dark:bg-[#323d2b] -z-0" />
                <div
                  className="absolute left-6 top-3.5 h-0.5 bg-[#e0a861] transition-all duration-500 -z-0"
                  style={{
                    width: `${Math.min(100, Math.max(0, (stepIndex / 3) * 100))}%`,
                  }}
                />

                {/* Step 1: Placed */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      stepIndex >= 0
                        ? 'bg-[#2c3324] text-[#e0a861] dark:bg-[#e0a861] dark:text-[#131710] ring-4 ring-white dark:ring-[#1b2117]'
                        : 'bg-[#e6dfcb] text-[#707666]'
                    }`}
                  >
                    1
                  </div>
                  <span className="text-[11px] font-semibold text-[#2c3324] dark:text-[#fefcf1]">
                    Placed
                  </span>
                </div>

                {/* Step 2: Payment Verified */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      stepIndex >= 1
                        ? 'bg-[#2c3324] text-[#e0a861] dark:bg-[#e0a861] dark:text-[#131710] ring-4 ring-white dark:ring-[#1b2117]'
                        : stepIndex === 0.5
                        ? 'bg-[#e0a861] text-white ring-4 ring-white dark:ring-[#1b2117] animate-pulse'
                        : 'bg-[#e6dfcb] text-[#707666] dark:bg-[#323d2b] ring-4 ring-white dark:ring-[#1b2117]'
                    }`}
                  >
                    2
                  </div>
                  <span className="text-[11px] font-semibold text-[#505748] dark:text-[#a3ab98] text-center">
                    {isVerificationQueued ? 'Verifying...' : 'Paid'}
                  </span>
                </div>

                {/* Step 3: In Transit */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      stepIndex >= 2
                        ? 'bg-[#2c3324] text-[#e0a861] dark:bg-[#e0a861] dark:text-[#131710] ring-4 ring-white dark:ring-[#1b2117]'
                        : 'bg-[#e6dfcb] text-[#707666] dark:bg-[#323d2b] ring-4 ring-white dark:ring-[#1b2117]'
                    }`}
                  >
                    3
                  </div>
                  <span className="text-[11px] font-semibold text-[#505748] dark:text-[#a3ab98]">
                    In Transit
                  </span>
                </div>

                {/* Step 4: Completed */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      stepIndex >= 3
                        ? 'bg-[#2e7d32] text-white ring-4 ring-white dark:ring-[#1b2117]'
                        : 'bg-[#e6dfcb] text-[#707666] dark:bg-[#323d2b] ring-4 ring-white dark:ring-[#1b2117]'
                    }`}
                  >
                    4
                  </div>
                  <span className="text-[11px] font-semibold text-[#505748] dark:text-[#a3ab98]">
                    Completed
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Purchased Items List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#707666] dark:text-[#a3ab98]">
              Ordered Merchandise ({order.items.length} Item{order.items.length > 1 ? 's' : ''})
            </h4>

            <div className="divide-y divide-[#e6dfcb]/60 dark:divide-[#323d2b]/60">
              {order.items.map((item) => {
                const product = item.product;
                const reviewKey = `${order.id}:${item.productId}`;
                const existingReview = userReviews[reviewKey];

                const thumb =
                  product?.imageUrls && product.imageUrls.length > 0
                    ? product.imageUrls[0]
                    : '/images/logo/pcyc-transparent-logo.png';

                return (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-14 w-14 rounded-2xl bg-[#f8f4e3] dark:bg-[#131710] overflow-hidden shrink-0 border border-[#e6dfcb] dark:border-[#323d2b]">
                        <Image
                          src={thumb}
                          alt={product?.name || 'Product'}
                          fill
                          className="object-contain p-1.5"
                        />
                      </div>
                      <div>
                        <Link
                          href={product ? `/merch/${product.slug}` : '/merch'}
                          className="font-serif font-bold text-sm text-[#2c3324] dark:text-[#fefcf1] hover:text-[#e0a861] transition-colors"
                        >
                          {product?.name || 'PCYC Merchandise Item'}
                        </Link>
                        <div className="text-xs text-[#707666] dark:text-[#a3ab98] flex items-center gap-2 mt-0.5">
                          {item.selectedSize && (
                            <span className="font-semibold bg-[#f8f4e3] dark:bg-[#131710] px-1.5 py-0.5 rounded text-[11px] border border-[#e6dfcb] dark:border-[#323d2b]">
                              Size: {item.selectedSize}
                            </span>
                          )}
                          <span>Qty: {item.quantity}</span>
                          <span>&bull;</span>
                          <span>₱{Number(item.unitPrice).toFixed(2)} each</span>
                        </div>
                      </div>
                    </div>

                    {/* Review Button if Completed */}
                    {isCompleted && product && (
                      <div className="self-end sm:self-center">
                        <Button
                          variant={existingReview ? 'outline' : 'primary'}
                          size="sm"
                          className="gap-1.5 text-xs shadow-xs"
                          onClick={() =>
                            setReviewTarget({
                              productId: product.id,
                              productName: product.name,
                              productImageUrl: thumb,
                            })
                          }
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              existingReview
                                ? 'fill-[#e0a861] text-[#e0a861]'
                                : 'text-current'
                            }`}
                          />
                          <span>
                            {existingReview
                              ? `Edit Review (${existingReview.rating}★)`
                              : 'Leave Review'}
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-[#e6dfcb] dark:border-[#323d2b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Delivery address snippet */}
            <div className="flex items-center gap-1.5 text-[#707666] dark:text-[#a3ab98]">
              <MapPin className="h-3.5 w-3.5 text-[#e0a861] shrink-0" />
              <span className="line-clamp-1">
                Ship to: {order.shippingInfo.recipientName} &bull; {order.shippingInfo.deliveryAddress},{' '}
                {order.shippingInfo.city}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              {/* Unpaid Action: Upload Receipt or Cancel */}
              {isUnpaid && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setIsCancelModalOpen(true);
                      setCancelError(null);
                    }}
                  >
                    Cancel Order
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setIsReceiptModalOpen(true)}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Payment Receipt</span>
                  </Button>
                </>
              )}

              {/* View Receipt modal if proof exists */}
              {order.receipt?.receiptImageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setIsViewReceiptOpen(true)}
                >
                  <Eye className="h-3.5 w-3.5 text-[#e0a861]" />
                  <span>View Submitted Receipt</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Order Confirmation Modal */}
      {isCancelModalOpen && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Cancel Merchandise Order"
        >
          <div className="space-y-4 text-xs">
            <p className="text-[#505748] dark:text-[#a3ab98]">
              Are you sure you want to cancel Order <strong>#{order.orderNumber}</strong>? This action cannot be undone.
            </p>

            {cancelError && (
              <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
              >
                Keep Order
              </Button>
              <Button
                variant="destructive"
                size="md"
                onClick={handleCancelSubmit}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload payment receipt modal */}
      {isReceiptModalOpen && (
        <ReceiptUploadModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          orderId={order.id}
          orderNumber={order.orderNumber}
          amount={order.totalAmount}
          paymentSettings={paymentSettings}
        />
      )}

      {/* View Uploaded Receipt Modal */}
      {isViewReceiptOpen && order.receipt && (
        <Modal
          isOpen={isViewReceiptOpen}
          onClose={() => setIsViewReceiptOpen(false)}
          title={`Payment Receipt — #${order.orderNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="relative aspect-[3/4] w-full max-w-sm mx-auto rounded-2xl bg-[#f8f4e3] dark:bg-[#131710] overflow-hidden border border-[#e6dfcb] dark:border-[#323d2b]">
              <Image
                src={order.receipt.receiptImageUrl}
                alt="Payment Receipt"
                fill
                className="object-contain"
              />
            </div>
            <div className="p-3 bg-[#f8f4e3] dark:bg-[#131710] rounded-xl space-y-1 text-xs">
              <div>
                <strong>Payment Method:</strong> {order.receipt.paymentMethod}
              </div>
              {order.receipt.referenceNumber && (
                <div>
                  <strong>Reference No.:</strong> {order.receipt.referenceNumber}
                </div>
              )}
              <div>
                <strong>Verification Status:</strong>{' '}
                <Badge size="sm">{order.receipt.verificationStatus}</Badge>
              </div>
              {order.receipt.verificationNotes && (
                <div>
                  <strong>Notes:</strong> {order.receipt.verificationNotes}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Product Review Modal */}
      {reviewTarget && (
        <ReviewModal
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          productId={reviewTarget.productId}
          productName={reviewTarget.productName}
          productImageUrl={reviewTarget.productImageUrl}
          orderId={order.id}
          orderNumber={order.orderNumber}
          existingReview={userReviews[`${order.id}:${reviewTarget.productId}`]}
        />
      )}
    </>
  );
}
