'use client';

import React, { useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { Modal } from '@/components/ui/modal';
import { PriceTag } from '@/components/molecules/price-tag';
import { Pagination } from '@/components/ui/pagination';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { verifyReceiptAction, adminBulkUpdateOrderStatusAction } from '@/app/actions/orders';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { OrderWithDetails } from '@/lib/db/queries/orders';
import type { OrderStatus } from '@/lib/db/schema/orders';
import {
  Receipt,
  CheckCircle,
  XCircle,
  QrCode,
  Search,
  Eye,
  ExternalLink,
  MapPin,
  Package,
  Truck,
  Copy,
  Check,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

const AdminOrderDetailsModal = dynamic(
  () => import('@/components/domain/orders/admin-order-details-modal').then((mod) => mod.AdminOrderDetailsModal),
  { ssr: false }
);

interface AdminOrdersListProps {
  orders: OrderWithDetails[];
  paymentSettings: {
    platform: string;
    accountName: string;
    accountNumber: string;
    qrUrl: string;
  };
}

const PAGE_SIZE = 8;

function VerifyButton({ children, variant = 'primary', size = 'sm', className = '' }: any) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending}
      isLoading={pending}
      className={className}
    >
      {children}
    </Button>
  );
}

export function AdminOrdersList({ orders, paymentSettings }: AdminOrdersListProps) {
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Order for Receipt Lightbox Modal
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<OrderWithDetails | null>(null);
  
  // Selected Order for Full Details Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderWithDetails | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>(`Reference number did not match ${paymentSettings.platform} account transaction.`);
  const [copiedRef, setCopiedRef] = useState(false);

  // Multi-Selection State for Bulk Operations
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  // Compute counts
  const totalCount = orders.length;
  const pendingCount = orders.filter(
    (o) => o.receipt?.verificationStatus === 'PENDING'
  ).length;
  const approvedCount = orders.filter(
    (o) => o.status === 'PAID' || o.receipt?.verificationStatus === 'APPROVED'
  ).length;
  const rejectedCount = orders.filter(
    (o) => o.receipt?.verificationStatus === 'REJECTED'
  ).length;

  // Filter list with debounced search query and memoization to avoid re-renders on row selection
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const vStatus = ord.receipt?.verificationStatus;

      if (filterTab === 'PENDING' && vStatus !== 'PENDING') return false;
      if (filterTab === 'APPROVED' && ord.status !== 'PAID' && vStatus !== 'APPROVED') return false;
      if (filterTab === 'REJECTED' && vStatus !== 'REJECTED') return false;

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const orderNum = (ord.orderNumber || '').toLowerCase();
        const name = (ord.shippingInfo?.recipientName || `${ord.user?.firstName || ''} ${ord.user?.lastName || ''}`).toLowerCase();
        const contact = (ord.shippingInfo?.contactNumber || ord.user?.phoneNumber || '').toLowerCase();
        const ref = (ord.receipt?.referenceNumber || '').toLowerCase();
        const addr = (ord.shippingInfo?.deliveryAddress || '').toLowerCase();
        return orderNum.includes(q) || name.includes(q) || contact.includes(q) || ref.includes(q) || addr.includes(q);
      }

      return true;
    });
  }, [orders, filterTab, debouncedSearch]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);

  const handleTabChange = (tab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') => {
    setFilterTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const isAllOnPageSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((ord) => selectedOrderIds.includes(ord.id));

  const toggleSelectAllOnPage = () => {
    if (isAllOnPageSelected) {
      // Unselect current page orders
      const pageIds = new Set(paginatedOrders.map((o) => o.id));
      setSelectedOrderIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      // Add all current page orders
      const newIds = new Set([...selectedOrderIds, ...paginatedOrders.map((o) => o.id)]);
      setSelectedOrderIds(Array.from(newIds));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleBulkStatusChange = async (targetStatus: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkProcessing(true);
    setBulkMessage(null);

    const result = await adminBulkUpdateOrderStatusAction(selectedOrderIds, targetStatus);
    setIsBulkProcessing(false);

    if (result.success) {
      setBulkMessage(`Successfully updated ${result.count} order(s) to ${targetStatus.replace(/_/g, ' ')}!`);
      setSelectedOrderIds([]);
      setTimeout(() => setBulkMessage(null), 4000);
    } else {
      alert(result.error || 'Failed to perform bulk update.');
    }
  };

  // Helper to format clean, professional fulfillment logistics
  const formatLogistics = (ord: OrderWithDetails) => {
    const shipping = ord.shippingInfo;
    const addr = (shipping?.deliveryAddress || '').toLowerCase();
    const city = (shipping?.city || '').toLowerCase();
    const notesStr = (shipping?.notes || ord.notes || '').toLowerCase();

    const isEventPickup =
      addr.includes('event') ||
      addr.includes('pickup') ||
      addr.includes('desk') ||
      city === 'n/a' ||
      city.includes('event') ||
      notesStr.includes('event pickup') ||
      !shipping?.deliveryAddress;

    const recipientName =
      shipping?.recipientName || (ord.user ? `${ord.user.firstName} ${ord.user.lastName}` : 'PCYC Member');
    const contactNumber = shipping?.contactNumber || ord.user?.phoneNumber || 'Not provided';

    if (isEventPickup) {
      return {
        isEventPickup: true,
        typeLabel: 'Event Registration Desk Claim',
        recipientName,
        contactNumber,
        locationLabel: 'PCYC Youth Camp Venue • On-site Registration Desk Claim',
        notes: shipping?.notes || ord.notes,
      };
    }

    // Standard Courier Delivery
    const addressParts = [shipping?.deliveryAddress, shipping?.city, shipping?.province, shipping?.zipCode]
      .filter(Boolean)
      .filter((p) => p !== 'N/A' && p !== 'n/a' && p?.trim() !== '');

    return {
      isEventPickup: false,
      typeLabel: 'Standard Courier Delivery',
      recipientName,
      contactNumber,
      locationLabel: addressParts.join(', ') || 'Courier Address on File',
      notes: shipping?.notes || ord.notes,
    };
  };

  return (
    <div className="space-y-4">
      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#1b2117] p-2.5 rounded-2xl border border-[#e6dfcb] dark:border-[#323d2b] shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-[#f8f4e3] dark:bg-[#252e1f] rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterTab === 'ALL'
                ? 'bg-[#2c3324] dark:bg-[#e0a861] text-white dark:text-[#1b2117] shadow-xs'
                : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1] hover:bg-[#e6dfcb]/50 dark:hover:bg-[#323d2b]'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterTab === 'PENDING'
                ? 'bg-[#2c3324] dark:bg-[#e0a861] text-white dark:text-[#1b2117] shadow-xs'
                : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1] hover:bg-[#e6dfcb]/50 dark:hover:bg-[#323d2b]'
            }`}
          >
            Pending Verification ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterTab === 'APPROVED'
                ? 'bg-[#2c3324] dark:bg-[#e0a861] text-white dark:text-[#1b2117] shadow-xs'
                : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1] hover:bg-[#e6dfcb]/50 dark:hover:bg-[#323d2b]'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterTab === 'REJECTED'
                ? 'bg-[#2c3324] dark:bg-[#e0a861] text-white dark:text-[#1b2117] shadow-xs'
                : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1] hover:bg-[#e6dfcb]/50 dark:hover:bg-[#323d2b]'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#707666] dark:text-[#a3ab98]" />
          <input
            type="text"
            placeholder="Search orders, ref, name..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/50 dark:bg-[#131710] focus:bg-white dark:focus:bg-[#1b2117] dark:text-[#fefcf1] focus:outline-none focus:ring-1 focus:ring-[#2c3324] dark:focus:ring-[#e0a861]"
          />
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedOrderIds.length > 0 && (
        <div className="sticky top-20 z-30 p-3 rounded-2xl bg-[#2c3324] dark:bg-[#1f271a] text-[#fefcf1] border border-[#e0a861]/40 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="h-6 px-2.5 rounded-full bg-[#e0a861] text-[#131710] font-bold text-xs flex items-center justify-center">
              {selectedOrderIds.length}
            </span>
            <span className="text-xs font-semibold">Orders Selected</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] text-[#e0a861] border-[#e0a861]/40 hover:bg-white/10"
              onClick={() => setSelectedOrderIds([])}
            >
              Clear
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="h-8 text-xs bg-[#2e7d32] hover:bg-[#256629] text-white border-0"
              disabled={isBulkProcessing}
              onClick={() => handleBulkStatusChange('PAID')}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              <span>Bulk Accept & Verify</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-white/10 hover:bg-white/20 text-[#fefcf1] border-white/20"
              disabled={isBulkProcessing}
              onClick={() => handleBulkStatusChange('SHIPPED')}
            >
              <Truck className="h-3.5 w-3.5 mr-1 text-[#e0a861]" />
              <span>Bulk In Transit</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-white/10 hover:bg-white/20 text-[#fefcf1] border-white/20"
              disabled={isBulkProcessing}
              onClick={() => handleBulkStatusChange('COMPLETED')}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1 text-[#81c784]" />
              <span>Bulk Complete</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-red-900/40 hover:bg-red-900/60 text-red-300 border-red-800/50"
              disabled={isBulkProcessing}
              onClick={() => handleBulkStatusChange('CANCELLED')}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              <span>Bulk Cancel</span>
            </Button>
          </div>
        </div>
      )}

      {bulkMessage && (
        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-300 text-xs flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-green-600" />
          <span>{bulkMessage}</span>
        </div>
      )}

      {/* Orders List Card */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">
              Merchandise Transactions ({filteredOrders.length})
            </CardTitle>
            <CardDescription>
              Live database records of merchandise transactions, {paymentSettings.platform} payment verification, and fulfillment logistics.
            </CardDescription>
          </div>

          {filteredOrders.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5 shrink-0"
              onClick={toggleSelectAllOnPage}
            >
              {isAllOnPageSelected ? (
                <>
                  <CheckSquare className="h-3.5 w-3.5 text-[#e0a861]" />
                  <span>Deselect Page ({paginatedOrders.length})</span>
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5 text-[#8a9180]" />
                  <span>Select Page ({paginatedOrders.length})</span>
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Receipt className="h-10 w-10 text-[#8a9180] mx-auto opacity-70" />
              <p className="text-sm font-semibold text-[#2c3324] dark:text-[#fefcf1]">
                {searchQuery ? 'No orders match your search criteria' : 'No orders in this category'}
              </p>
              <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
                {searchQuery ? 'Try modifying your search keywords.' : 'Orders submitted by members will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4">
                {paginatedOrders.map((ord) => {
                  const receipt = ord.receipt;
                  const logistics = formatLogistics(ord);
                  const isSelected = selectedOrderIds.includes(ord.id);

                  return (
                    <div
                      key={ord.id}
                      className={`p-5 rounded-2xl bg-white dark:bg-[#1b2117] border transition-colors shadow-xs space-y-4 ${
                        isSelected
                          ? 'border-[#e0a861] ring-2 ring-[#e0a861]/20 bg-[#faf7ec]/40 dark:bg-[#20271c]'
                          : 'border-[#e6dfcb] dark:border-[#323d2b] hover:border-[#e0a861]/60'
                      }`}
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f0ebd3] dark:border-[#323d2b] pb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOrder(ord.id)}
                            className="h-4 w-4 rounded border-[#e6dfcb] text-[#2c3324] focus:ring-[#e0a861] cursor-pointer"
                            aria-label={`Select order ${ord.orderNumber}`}
                          />
                          <span className="font-mono text-sm font-bold text-[#2c3324] dark:text-[#fefcf1]">
                            {ord.orderNumber}
                          </span>
                          <Badge
                            variant={
                              ord.status === 'PAID'
                                ? 'success'
                                : ord.status === 'COMPLETED'
                                ? 'forest'
                                : ord.status === 'CANCELLED'
                                ? 'destructive'
                                : 'gold'
                            }
                            size="sm"
                          >
                            {ord.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#707666] dark:text-[#a3ab98]">
                          <span>Placed on: {formatDate(ord.createdAt)}</span>
                          <span>•</span>
                          <PriceTag price={ord.totalAmount} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 ml-2 text-[10px]"
                            onClick={() => setSelectedOrderDetails(ord)}
                          >
                            View Full Details
                          </Button>
                        </div>
                      </div>

                      {/* Customer & Fulfillment Logistics Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#505748] dark:text-[#a3ab98] p-3.5 rounded-xl bg-[#faf7ec]/60 dark:bg-[#161c13] border border-[#f0ebd3] dark:border-[#273220]">
                        {/* Recipient */}
                        <div className="space-y-1">
                          <strong className="block text-[#2c3324] dark:text-[#fefcf1] font-semibold">
                            Recipient Contact:
                          </strong>
                          <div className="text-sm font-serif font-bold text-[#2c3324] dark:text-[#fefcf1]">
                            {logistics.recipientName}
                          </div>
                          <div className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                            Phone / {paymentSettings.platform}: <span className="font-mono font-semibold">{logistics.contactNumber}</span>
                          </div>
                        </div>

                        {/* Fulfillment Mode */}
                        <div className="space-y-1">
                          <strong className="block text-[#2c3324] dark:text-[#fefcf1] font-semibold">
                            Fulfillment Logistics:
                          </strong>
                          <div className="flex items-center gap-1.5">
                            {logistics.isEventPickup ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e0a861]/20 text-[#85531b] dark:text-[#f0be7c] border border-[#e0a861]/40">
                                <Package className="h-3 w-3" />
                                {logistics.typeLabel}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2e7d32]/15 text-[#2e7d32] dark:text-[#81c784] border border-[#2e7d32]/30">
                                <Truck className="h-3 w-3" />
                                {logistics.typeLabel}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#505748] dark:text-[#a3ab98] flex items-start gap-1 pt-0.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#8a9180] mt-0.5" />
                            <span>{logistics.locationLabel}</span>
                          </div>
                          {logistics.notes && (
                            <div className="text-[10px] text-[#707666] dark:text-[#a3ab98] italic pt-1">
                              Note: &ldquo;{logistics.notes}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Receipt Info & Action Box */}
                      {receipt ? (
                        <div className="p-4 rounded-xl bg-[#f8f4e3] dark:bg-[#252e1f] border border-[#e6dfcb] dark:border-[#323d2b] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-3">
                            {/* Receipt Thumbnail (if uploaded) */}
                            {receipt.receiptImageUrl ? (
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptOrder(ord)}
                                className="relative group shrink-0 h-14 w-14 rounded-lg overflow-hidden border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#131710] shadow-2xs hover:ring-2 hover:ring-[#e0a861] transition-all cursor-pointer"
                                title="Click to inspect receipt proof"
                              >
                                <img
                                  src={receipt.receiptImageUrl}
                                  alt="Receipt thumbnail"
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="h-4 w-4 text-white" />
                                </div>
                              </button>
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-[#e0a861]/15 text-[#9a6423] dark:text-[#f0be7c] flex items-center justify-center shrink-0">
                                <QrCode className="h-6 w-6" />
                              </div>
                            )}

                            {/* Payment Meta */}
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[#2c3324] dark:text-[#fefcf1]">
                                  {paymentSettings.platform} Payment Proof
                                </span>
                                <Badge
                                  variant={
                                    receipt.verificationStatus === 'APPROVED'
                                      ? 'success'
                                      : receipt.verificationStatus === 'REJECTED'
                                      ? 'destructive'
                                      : 'gold'
                                  }
                                  size="sm"
                                >
                                  {receipt.verificationStatus}
                                </Badge>
                              </div>

                              {receipt.referenceNumber && (
                                <div className="dark:text-[#a3ab98]">
                                  {paymentSettings.platform} Ref No:{' '}
                                  <span className="font-mono font-bold text-[#2c3324] dark:text-[#fefcf1]">
                                    {receipt.referenceNumber}
                                  </span>
                                </div>
                              )}

                              <div className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                                Amount Claimed: <strong className="font-mono text-[#2c3324] dark:text-[#fefcf1]">{formatCurrency(Number(receipt.amountPaid || ord.totalAmount))}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                            {/* Inspect Proof Button */}
                            {receipt.receiptImageUrl && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReceiptOrder(ord)}
                                className="gap-1.5 text-xs bg-white dark:bg-[#1b2117]"
                              >
                                <Eye className="h-3.5 w-3.5 text-[#e0a861]" />
                                <span>Inspect Receipt</span>
                              </Button>
                            )}

                            {/* Inline Approval & Rejection Forms */}
                            {receipt.verificationStatus === 'PENDING' && (
                              <>
                                <form action={verifyReceiptAction}>
                                  <input type="hidden" name="orderId" value={ord.id} />
                                  <input type="hidden" name="receiptId" value={receipt.id} />
                                  <input type="hidden" name="decision" value="APPROVED" />
                                  <VerifyButton
                                    variant="primary"
                                    size="sm"
                                    className="gap-1.5 shadow-xs"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    <span>Approve</span>
                                  </VerifyButton>
                                </form>

                                <form action={verifyReceiptAction}>
                                  <input type="hidden" name="orderId" value={ord.id} />
                                  <input type="hidden" name="receiptId" value={receipt.id} />
                                  <input type="hidden" name="decision" value="REJECTED" />
                                  <input
                                    type="hidden"
                                    name="adminNotes"
                                    value={`Payment screenshot reference did not match ${paymentSettings.platform} account record.`}
                                  />
                                  <VerifyButton
                                    variant="destructive"
                                    size="sm"
                                    className="gap-1.5"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>Reject</span>
                                  </VerifyButton>
                                </form>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-[#f8f4e3]/50 dark:bg-[#1b2117]/50 border border-dashed border-[#e6dfcb] dark:border-[#323d2b] text-xs text-[#8a9180] flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-[#e0a861]" />
                          <span>No payment receipt screenshot uploaded yet by member.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Universal Pagination */}
              <Pagination
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredOrders.length}
                pageSize={PAGE_SIZE}
                showCount={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* High-Resolution Receipt Proof Inspection Lightbox Modal */}
      {/* ================================================================= */}
      <Modal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        title={`${paymentSettings.platform} Payment Verification Proof`}
        description={`Order #${selectedReceiptOrder?.orderNumber} • Placed by ${selectedReceiptOrder?.shippingInfo?.recipientName || 'Member'}`}
        className="max-w-4xl"
      >
        {selectedReceiptOrder && selectedReceiptOrder.receipt && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Receipt Screenshot Viewer (7 columns) */}
              <div className="md:col-span-7 bg-[#131710] rounded-2xl p-3 flex flex-col items-center justify-center border border-[#323d2b] min-h-[380px]">
                {selectedReceiptOrder.receipt.receiptImageUrl ? (
                  <div className="space-y-3 w-full flex flex-col items-center">
                    <div className="relative max-h-[460px] overflow-auto rounded-xl border border-white/10 shadow-inner bg-black/40">
                      <img
                        src={selectedReceiptOrder.receipt.receiptImageUrl}
                        alt={`${paymentSettings.platform} Payment Proof Full Resolution`}
                        className="w-full object-contain max-h-[460px] mx-auto rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <a
                        href={selectedReceiptOrder.receipt.receiptImageUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 text-xs text-[#f0be7c] hover:underline font-semibold"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open Original Image in Full Tab</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-[#a3ab98] py-12 space-y-2">
                    <QrCode className="h-10 w-10 mx-auto text-[#e0a861] opacity-60" />
                    <p>No receipt image file available for this transaction.</p>
                  </div>
                )}
              </div>

              {/* Transaction Inspection Panel (5 columns) */}
              <div className="md:col-span-5 space-y-4 text-xs">
                {/* Meta details */}
                <div className="p-4 rounded-xl bg-[#f8f4e3] dark:bg-[#252e1f] border border-[#e6dfcb] dark:border-[#323d2b] space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#707666] dark:text-[#a3ab98] tracking-wider block">
                      Transaction Ref Number
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="font-mono text-sm font-extrabold text-[#2c3324] dark:text-[#fefcf1]">
                        {selectedReceiptOrder.receipt.referenceNumber || 'N/A'}
                      </span>
                      {selectedReceiptOrder.receipt.referenceNumber && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedReceiptOrder.receipt?.referenceNumber || '')}
                          className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-[#707666] dark:text-[#a3ab98] transition-colors"
                          title="Copy reference number"
                        >
                          {copiedRef ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e6dfcb] dark:border-[#323d2b]">
                    <div>
                      <span className="text-[10px] text-[#707666] dark:text-[#a3ab98] block">Amount Paid</span>
                      <span className="font-mono font-bold text-sm text-[#2c3324] dark:text-[#fefcf1]">
                        {formatCurrency(Number(selectedReceiptOrder.receipt.amountPaid || selectedReceiptOrder.totalAmount))}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#707666] dark:text-[#a3ab98] block">Payment Channel</span>
                      <span className="font-semibold text-[#2c3324] dark:text-[#fefcf1]">{paymentSettings.platform}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#e6dfcb] dark:border-[#323d2b] flex items-center justify-between">
                    <span className="text-[10px] text-[#707666] dark:text-[#a3ab98]">Current Status:</span>
                    <Badge
                      variant={
                        selectedReceiptOrder.receipt.verificationStatus === 'APPROVED'
                          ? 'success'
                          : selectedReceiptOrder.receipt.verificationStatus === 'REJECTED'
                          ? 'destructive'
                          : 'gold'
                      }
                      size="sm"
                    >
                      {selectedReceiptOrder.receipt.verificationStatus}
                    </Badge>
                  </div>
                </div>

                {/* Verification Decision Form */}
                {selectedReceiptOrder.receipt.verificationStatus === 'PENDING' ? (
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] font-bold text-[#2c3324] dark:text-[#fefcf1] block">
                      Admin Verification Action:
                    </span>

                    {/* Approve Action */}
                    <form
                      action={async (formData) => {
                        await verifyReceiptAction(formData);
                        setSelectedReceiptOrder(null);
                      }}
                    >
                      <input type="hidden" name="orderId" value={selectedReceiptOrder.id} />
                      <input type="hidden" name="receiptId" value={selectedReceiptOrder.receipt?.id} />
                      <input type="hidden" name="decision" value="APPROVED" />
                      <VerifyButton
                        variant="primary"
                        size="md"
                        className="w-full gap-2 shadow-sm font-bold bg-[#2e7d32] hover:bg-[#1b5e20] text-white"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Confirm & Approve Payment</span>
                      </VerifyButton>
                    </form>

                    {/* Reject Action with Reason */}
                    <div className="pt-3 border-t border-[#e6dfcb] dark:border-[#323d2b] space-y-2">
                      <label className="text-[10px] font-semibold text-[#707666] dark:text-[#a3ab98] block">
                        Rejection Reason (Sent to Member):
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {[
                          `Reference did not match ${paymentSettings.platform} record`,
                          'Screenshot unreadable or cut off',
                          'Incorrect payment amount',
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setRejectionReason(preset)}
                            className="text-[9px] px-2 py-0.5 rounded bg-[#f8f4e3] dark:bg-[#252e1f] text-[#707666] dark:text-[#a3ab98] hover:text-[#2c3324] border border-[#e6dfcb] dark:border-[#323d2b]"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#131710] dark:text-[#fefcf1]"
                      />

                      <form
                        action={async (formData) => {
                          await verifyReceiptAction(formData);
                          setSelectedReceiptOrder(null);
                        }}
                      >
                        <input type="hidden" name="orderId" value={selectedReceiptOrder.id} />
                        <input type="hidden" name="receiptId" value={selectedReceiptOrder.receipt?.id} />
                        <input type="hidden" name="decision" value="REJECTED" />
                        <input type="hidden" name="adminNotes" value={rejectionReason} />
                        <VerifyButton
                          variant="destructive"
                          size="sm"
                          className="w-full gap-2 mt-1"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject Receipt</span>
                        </VerifyButton>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#e8f5e9]/50 dark:bg-[#1f3a23]/50 border border-[#c8e6c9] dark:border-[#2e7d32]/40 text-xs text-[#2e7d32] dark:text-[#81c784] flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>
                      This transaction was already {selectedReceiptOrder.receipt.verificationStatus.toLowerCase()} by an admin.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#e6dfcb] dark:border-[#323d2b] flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setSelectedReceiptOrder(null)}
              >
                Close Inspection
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================================================================= */}
      {/* Full Order Details Modal */}
      {/* ================================================================= */}
      <AdminOrderDetailsModal
        isOpen={!!selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
        order={selectedOrderDetails}
      />
    </div>
  );
}

