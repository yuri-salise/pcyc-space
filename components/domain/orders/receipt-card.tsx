'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import dynamic from 'next/dynamic';
import { formatCurrency, formatDate } from '@/lib/utils';
import { QrCode, Eye, UploadCloud, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const ReceiptUploadModal = dynamic(
  () => import('@/components/domain/orders/receipt-upload-modal').then((mod) => mod.ReceiptUploadModal),
  { ssr: false }
);

export interface ReceiptCardProps {
  orderId: string;
  orderNumber: string;
  amount: string | number;
  status: string;
  paymentMethod?: string;
  referenceNumber?: string;
  receiptUrl?: string;
  verificationNotes?: string;
  createdAt: string | Date;
  itemsSummary?: string;
  paymentSettings: {
    platform: string;
    accountName: string;
    accountNumber: string;
    qrUrl: string;
  };
}

export function ReceiptCard({
  orderId,
  orderNumber,
  amount,
  status,
  paymentMethod,
  referenceNumber,
  receiptUrl,
  verificationNotes,
  createdAt,
  itemsSummary,
  paymentSettings,
}: ReceiptCardProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const getStatusBadge = () => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
        return <Badge variant="success" size="sm">PAID & VERIFIED</Badge>;
      case 'VERIFICATION_QUEUED':
        return <Badge variant="warning" size="sm">VERIFYING PAYMENT</Badge>;
      case 'CANCELLED':
        return <Badge variant="error" size="sm">CANCELLED</Badge>;
      case 'PENDING_PAYMENT':
      default:
        return <Badge variant="gold" size="sm">AWAITING PAYMENT</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] space-y-3.5 shadow-2xs hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-sm text-[#2c3324] dark:text-[#fefcf1]">
          {orderNumber}
        </span>
        {getStatusBadge()}
      </div>

      {itemsSummary && (
        <p className="text-xs text-[#2c3324] dark:text-[#fefcf1] font-medium line-clamp-1">
          {itemsSummary}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-[#707666] dark:text-[#a3ab98]">
        <span>Total: <strong className="text-[#2c3324] dark:text-[#fefcf1]">{formatCurrency(Number(amount))}</strong></span>
        <span>Placed: {formatDate(createdAt)}</span>
      </div>

      {/* Verification Notes / Feedback from Admin */}
      {verificationNotes && (
        <div className="p-2.5 rounded-xl bg-[#fdf2f2] dark:bg-[#2d1815] border border-[#f5c6cb] dark:border-[#4d201b] text-[11px] text-[#c0392b] dark:text-[#ef5350] flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>Note: {verificationNotes}</span>
        </div>
      )}

      {/* Proof of Payment Details */}
      {receiptUrl ? (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8f4e3] dark:bg-[#20271c] border border-[#e6dfcb] dark:border-[#323d2b]">
          <div className="flex items-center gap-2 text-xs">
            <QrCode className="h-4 w-4 text-[#e0a861]" />
            <span className="font-semibold text-[#2c3324] dark:text-[#fefcf1]">
              {paymentMethod || paymentSettings.platform}
            </span>
            {referenceNumber && <span className="font-mono text-xs text-[#707666] dark:text-[#a3ab98]">({referenceNumber})</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="text-xs text-[#9a6423] dark:text-[#f0be7c] font-semibold hover:underline flex items-center gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>View</span>
            </button>
            {status !== 'PAID' && (
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="text-xs text-[#2c3324] dark:text-[#fefcf1] font-semibold hover:underline flex items-center gap-1 ml-2"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Re-Upload</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8f4e3]/60 dark:bg-[#20271c]/60 border border-[#e6dfcb] dark:border-[#323d2b] border-dashed">
          <div className="flex items-center gap-2 text-xs text-[#8a9180] dark:text-[#a3ab98]">
            <Clock className="h-3.5 w-3.5 text-[#e0a861]" />
            <span>No proof of payment attached yet</span>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="gap-1 text-xs h-8"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload Receipt</span>
          </Button>
        </div>
      )}

      {/* Modal Zoom Preview */}
      {receiptUrl && (
        <Modal
          isOpen={isZoomOpen}
          onClose={() => setIsZoomOpen(false)}
          title={`Proof of Payment — Order ${orderNumber}`}
        >
          <div className="space-y-4">
            <div className="relative aspect-[3/4] max-h-[70vh] w-full rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
              <Image
                src={receiptUrl}
                alt={`Receipt screenshot for order ${orderNumber}`}
                fill
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#707666] dark:text-[#a3ab98] pt-2 border-t border-[#e6dfcb] dark:border-[#323d2b]">
              <span>Method: {paymentMethod}</span>
              <span>Ref: {referenceNumber || 'N/A'}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Receipt Upload Modal */}
      <ReceiptUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
        amount={amount}
        paymentSettings={paymentSettings}
      />
    </div>
  );
}
