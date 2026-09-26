import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/molecules/price-tag';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { OrderWithDetails } from '@/lib/db/queries/orders';
import { User, Package, Truck, Receipt } from 'lucide-react';

interface AdminOrderDetailsModalProps {
  order: OrderWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminOrderDetailsModal({ order, isOpen, onClose }: AdminOrderDetailsModalProps) {
  if (!order) return null;

  const shipping = order.shippingInfo;
  const isEventPickup =
    !shipping?.deliveryAddress ||
    shipping.deliveryAddress.toLowerCase().includes('event') ||
    shipping.deliveryAddress.toLowerCase().includes('pickup') ||
    shipping.city?.toLowerCase() === 'n/a';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details: ${order.orderNumber}`}
      description={`Placed on ${formatDate(order.createdAt)}`}
      className="max-w-3xl"
    >
      <div className="space-y-6 pt-4">
        {/* Status Row */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#e6dfcb] dark:border-[#323d2b]">
          <Badge
            variant={
              order.status === 'PAID'
                ? 'success'
                : order.status === 'COMPLETED'
                ? 'forest'
                : order.status === 'CANCELLED'
                ? 'destructive'
                : 'gold'
            }
          >
            Order Status: {order.status}
          </Badge>
          {order.receipt && (
            <Badge
              variant={
                order.receipt.verificationStatus === 'APPROVED'
                  ? 'success'
                  : order.receipt.verificationStatus === 'REJECTED'
                  ? 'destructive'
                  : 'gold'
              }
            >
              Payment: {order.receipt.verificationStatus}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div className="space-y-3 p-4 rounded-xl bg-[#f8f4e3] dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b]">
            <div className="flex items-center gap-2 text-[#2c3324] dark:text-[#fefcf1] font-bold">
              <User className="h-4 w-4 text-[#e0a861]" />
              <h4>Customer Info</h4>
            </div>
            <div className="text-sm text-[#505748] dark:text-[#a3ab98] space-y-1">
              <p><strong className="text-[#2c3324] dark:text-[#fefcf1]">Name:</strong> {shipping?.recipientName || order.user?.firstName + ' ' + order.user?.lastName}</p>
              <p><strong className="text-[#2c3324] dark:text-[#fefcf1]">Contact:</strong> {shipping?.contactNumber || order.user?.phoneNumber || 'N/A'}</p>
              <p><strong className="text-[#2c3324] dark:text-[#fefcf1]">Email:</strong> {order.user?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="space-y-3 p-4 rounded-xl bg-[#f8f4e3] dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b]">
            <div className="flex items-center gap-2 text-[#2c3324] dark:text-[#fefcf1] font-bold">
              {isEventPickup ? <Package className="h-4 w-4 text-[#e0a861]" /> : <Truck className="h-4 w-4 text-[#e0a861]" />}
              <h4>Fulfillment Details</h4>
            </div>
            <div className="text-sm text-[#505748] dark:text-[#a3ab98] space-y-1">
              <p><strong className="text-[#2c3324] dark:text-[#fefcf1]">Method:</strong> {isEventPickup ? 'Event Desk Pickup' : 'Courier Delivery'}</p>
              {!isEventPickup && (
                <>
                  <p><strong className="text-[#2c3324] dark:text-[#fefcf1]">Address:</strong> {shipping?.deliveryAddress}</p>
                  <p><strong className="text-[#2c3324] dark:text-[#fefcf1]">City:</strong> {shipping?.city}, {shipping?.province} {shipping?.zipCode}</p>
                </>
              )}
              {shipping?.notes && (
                <p><strong className="text-[#2c3324] dark:text-[#fefcf1]">Notes:</strong> {shipping.notes}</p>
              )}
            </div>
          </div>
        </div>

        {/* Itemized List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#2c3324] dark:text-[#fefcf1] font-bold pb-2 border-b border-[#e6dfcb] dark:border-[#323d2b]">
            <Receipt className="h-4 w-4 text-[#e0a861]" />
            <h4>Order Items</h4>
          </div>
          <div className="divide-y divide-[#e6dfcb] dark:divide-[#323d2b]">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-semibold text-[#2c3324] dark:text-[#fefcf1]">{item.product?.name || 'Unknown Product'}</span>
                  <span className="text-xs text-[#707666] dark:text-[#a3ab98]">Size: {item.selectedSize || 'One Size'} • Qty: {item.quantity}</span>
                </div>
                <div className="font-mono font-medium text-[#2c3324] dark:text-[#fefcf1]">
                  {formatCurrency(Number(item.unitPrice) * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 flex justify-between items-center border-t border-[#e6dfcb] dark:border-[#323d2b]">
            <span className="font-bold text-[#2c3324] dark:text-[#fefcf1]">Total Amount</span>
            <PriceTag price={order.totalAmount} className="text-lg" />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close Details</Button>
        </div>
      </div>
    </Modal>
  );
}
