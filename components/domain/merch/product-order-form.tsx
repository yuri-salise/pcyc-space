'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { QrZoom } from '@/components/ui/qr-zoom';
import { createOrderAction, OrderActionResult } from '@/app/actions/orders';
import { formatCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';
import type { Product } from '@/lib/db/schema/products';
import type { Profile } from '@/lib/db/schema/users';
import {
  ShoppingBag,
  Truck,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';

const ProductSizeGuideModal = dynamic(
  () => import('@/components/merch/product-size-guide-modal').then((mod) => mod.ProductSizeGuideModal),
  { ssr: false }
);

interface ProductOrderFormProps {
  product: Product;
  user: Profile;
  paymentSettings?: {
    platform: string;
    accountName: string;
    accountNumber: string;
    qrUrl: string;
  };
}

const initialState: OrderActionResult = {
  success: false,
};

const COURIER_FEE = 120;

export function ProductOrderForm({ 
  product, 
  user,
  paymentSettings = {
    platform: 'Online Payment',
    accountName: 'PCYC Official',
    accountNumber: '0917 000 0000',
    qrUrl: ''
  }
}: ProductOrderFormProps) {
  const [state, formAction, isPending] = useActionState(createOrderAction, initialState);

  const availableSizes = product.availableSizes && product.availableSizes.length > 0
    ? product.availableSizes
    : ['One Size'];

  const hasSizes = availableSizes.length > 1 || (availableSizes[0] && availableSizes[0] !== 'One Size' && availableSizes[0] !== 'N/A');

  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || 'M');
  const [quantity, setQuantity] = useState<number>(1);
  const [fulfillmentType, setFulfillmentType] = useState<'EVENT_PICKUP' | 'DELIVERY'>('EVENT_PICKUP');
  const [showReceiptUpload, setShowReceiptUpload] = useState<boolean>(false);

  const unitPrice = Number(product.price);
  const itemSubtotal = unitPrice * quantity;
  const shippingFee = fulfillmentType === 'DELIVERY' ? COURIER_FEE : 0;
  const totalAmount = itemSubtotal + shippingFee;

  // Order Success Screen
  if (state?.success && state.orderNumber) {
    return (
      <Card className="border-[#2e7d32]/30 bg-[#fefcf1] dark:bg-[#131710] shadow-xl overflow-hidden animate-fadeIn">
        <div className="bg-[#2e7d32] text-white p-6 text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-white/20 text-white mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="font-serif text-2xl font-bold">Order Received!</h3>
          <p className="text-xs text-white/90">
            Order Reference: <span className="font-mono font-bold tracking-wider">{state.orderNumber}</span>
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="p-4 rounded-xl bg-[#f8f4e3] dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-[#e6dfcb] dark:border-[#323d2b] pb-2">
              <span className="text-[#707666] dark:text-[#a3ab98]">Item</span>
              <strong className="text-[#2c3324] dark:text-[#fefcf1]">{product.name}</strong>
            </div>
            {hasSizes && (
              <div className="flex justify-between items-center text-sm border-b border-[#e6dfcb] dark:border-[#323d2b] pb-2">
                <span className="text-[#707666] dark:text-[#a3ab98]">Selected Size</span>
                <Badge variant="gold" size="sm">{selectedSize}</Badge>
              </div>
            )}
            <div className="flex justify-between items-center text-sm border-b border-[#e6dfcb] dark:border-[#323d2b] pb-2">
              <span className="text-[#707666] dark:text-[#a3ab98]">Quantity</span>
              <span className="font-bold text-[#2c3324] dark:text-[#fefcf1]">{quantity} pc(s)</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-[#e6dfcb] dark:border-[#323d2b] pb-2">
              <span className="text-[#707666] dark:text-[#a3ab98]">Fulfillment</span>
              <span className="font-medium text-[#2c3324] dark:text-[#fefcf1]">
                {fulfillmentType === 'EVENT_PICKUP' ? '🎪 Event Pickup (Upcoming Camp)' : '🚚 Courier Delivery'}
              </span>
            </div>
            <div className="flex justify-between items-center text-base font-serif font-bold text-[#2c3324] dark:text-[#fefcf1] pt-1">
              <span>Total Payable</span>
              <span className="text-[#9a6423] dark:text-[#f0be7c] text-lg">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#f0f4eb] dark:bg-[#1b2117] border border-[#d3dec2] dark:border-[#323d2b] space-y-3 text-xs text-[#505748] dark:text-[#a3ab98]">
            <div className="flex items-center gap-2 font-bold text-[#2c3324] dark:text-[#fefcf1]">
              <QrCode className="h-4 w-4 text-[#2e7d32] dark:text-[#66bb6a]" />
              <span>Next Step: {paymentSettings.platform} Payment</span>
            </div>
            <p>
              Please send <strong>{formatCurrency(totalAmount)}</strong> to the official PCYC {paymentSettings.platform}:
            </p>
            {paymentSettings.qrUrl && (
              <div className="flex justify-center my-3">
                <QrZoom src={paymentSettings.qrUrl} platform={paymentSettings.platform} />
              </div>
            )}
            <div className="p-3 rounded-xl bg-white dark:bg-[#1b2117] border border-[#d3dec2] font-mono text-center text-sm font-bold text-[#2c3324] dark:text-[#fefcf1]">
              {paymentSettings.accountNumber} ({paymentSettings.accountName})
            </div>
            <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
              Upload your receipt in the Member Portal to fast-track verification.
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
          <Link href="/portal" className="w-full">
            <Button variant="primary" size="lg" className="w-full gap-2 shadow-sm">
              <span>Open Member Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/merch" className="w-full">
            <Button variant="outline" size="lg" className="w-full">
              <span>Continue Shopping</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-[#e6dfcb] dark:border-[#323d2b] shadow-lg bg-[#fefcf1] dark:bg-[#131710]">
      <form action={formAction}>
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="selectedSize" value={selectedSize} />
        <input type="hidden" name="quantity" value={quantity} />
        <input type="hidden" name="fulfillmentType" value={fulfillmentType} />

        <CardHeader className="border-b border-[#e6dfcb] dark:border-[#323d2b] pb-4">
          <div className="flex items-center justify-between">
            <Badge variant="gold" size="sm">
              {product.isPreorder ? 'Pre-Order Open' : 'In Stock'}
            </Badge>
            <span className="font-serif text-xl font-bold text-[#9a6423] dark:text-[#f0be7c]">
              {formatCurrency(unitPrice)}
            </span>
          </div>
          <CardTitle className="text-lg sm:text-xl text-[#2c3324] dark:text-[#fefcf1] pt-1">
            Place Member Order
          </CardTitle>
          <CardDescription className="text-xs">
            Ordering as <strong className="text-[#2c3324] dark:text-[#fefcf1]">{user.firstName} {user.lastName}</strong> ({user.ecclesia || 'PCYC Youth'})
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {state?.error && (
            <div className="p-3.5 rounded-xl bg-[#fdf2f2] dark:bg-[#2d1815] border border-[#f5c6cb] dark:border-[#4d201b] text-[#c0392b] dark:text-[#ef5350] text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {/* 1. Size Selection (if applicable) */}
          {hasSizes && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#2c3324] dark:text-[#fefcf1] uppercase tracking-wider">
                  Select Size <span className="text-[#c0392b] dark:text-[#ef5350]">*</span>
                </label>
                <ProductSizeGuideModal />
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] h-11 px-4 rounded-2xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#2c3324] text-[#fefcf1] dark:bg-[#e0a861] dark:text-[#131710] shadow-md ring-2 ring-[#e0a861]/50 scale-105'
                          : 'bg-[#f8f4e3] dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] text-[#505748] dark:text-[#a3ab98] hover:border-[#e0a861]/60'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {state?.fieldErrors?.selectedSize?.[0] && (
                <p className="text-xs text-[#c0392b] dark:text-[#ef5350]">
                  {state.fieldErrors.selectedSize[0]}
                </p>
              )}
            </div>
          )}

          {/* 2. Quantity Selector & Mission Impact */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2c3324] dark:text-[#fefcf1] uppercase tracking-wider block">
              Quantity
            </label>
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#f8f4e3] dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b]">
              <div className="flex items-center border border-[#e6dfcb] dark:border-[#323d2b] rounded-xl overflow-hidden bg-white dark:bg-[#131710] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="px-3.5 py-1.5 text-[#505748] dark:text-[#a3ab98] hover:bg-[#f8f4e3] dark:hover:bg-[#1b2117] font-bold text-base transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-[#2c3324] dark:text-[#fefcf1] min-w-[40px] text-center font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(50, prev + 1))}
                  className="px-3.5 py-1.5 text-[#505748] dark:text-[#a3ab98] hover:bg-[#f8f4e3] dark:hover:bg-[#1b2117] font-bold text-base transition-colors"
                >
                  +
                </button>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#707666] dark:text-[#a3ab98] block">Item Subtotal:</span>
                <span className="font-serif font-bold text-base text-[#9a6423] dark:text-[#f0be7c]">
                  {formatCurrency(itemSubtotal)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#e0a861]/10 border border-[#e0a861]/30 flex items-center gap-2 text-[11px] text-[#9a6423] dark:text-[#f0be7c] font-semibold">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Includes ~₱{Math.round(quantity * (unitPrice * 0.55))} dedicated to youth travel subsidies.</span>
            </div>
          </div>

          {/* 3. Fulfillment Mode (Event Pickup vs Courier Delivery) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2c3324] dark:text-[#fefcf1] uppercase tracking-wider block">
              Fulfillment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentType('EVENT_PICKUP')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  fulfillmentType === 'EVENT_PICKUP'
                    ? 'border-[#2c3324] dark:border-[#fefcf1] bg-[#2c3324]/5 shadow-xs ring-1 ring-[#2c3324] dark:ring-[#fefcf1]'
                    : 'border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/50 dark:bg-[#1b2117]/50 hover:bg-[#f8f4e3] dark:hover:bg-[#1b2117]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-[#2c3324] dark:text-[#fefcf1]">
                  <Calendar className="h-4 w-4 text-[#e0a861]" />
                  <span>Event Pickup (Free)</span>
                </div>
                <p className="text-[11px] text-[#707666] dark:text-[#a3ab98] mt-1">
                  Claim at upcoming PCYC Youth Camp registration desk. Payment optional upon pickup.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('DELIVERY')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  fulfillmentType === 'DELIVERY'
                    ? 'border-[#2c3324] dark:border-[#fefcf1] bg-[#2c3324]/5 shadow-xs ring-1 ring-[#2c3324] dark:ring-[#fefcf1]'
                    : 'border-[#e6dfcb] dark:border-[#323d2b] bg-[#f8f4e3]/50 dark:bg-[#1b2117]/50 hover:bg-[#f8f4e3] dark:hover:bg-[#1b2117]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-[#2c3324] dark:text-[#fefcf1]">
                  <Truck className="h-4 w-4 text-[#e0a861]" />
                  <span>Door Delivery (+₱120)</span>
                </div>
                <p className="text-[11px] text-[#707666] dark:text-[#a3ab98] mt-1">
                  Shipped directly to your home address. Online payment is required upfront.
                </p>
              </button>
            </div>
          </div>

          {/* Conditional Delivery Form & Mandatory Payment */}
          {fulfillmentType === 'DELIVERY' ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-[#f8f4e3] dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2c3324] dark:text-[#fefcf1]">
                  <MapPin className="h-4 w-4 text-[#9a6423] dark:text-[#f0be7c]" />
                  <span>Courier Delivery Details</span>
                </div>

                <Input
                  label="Recipient Full Name"
                  name="recipientName"
                  defaultValue={`${user.firstName} ${user.lastName}`}
                  required
                  error={state?.fieldErrors?.recipientName?.[0]}
                />

                <Input
                  label="Contact Phone Number"
                  name="contactNumber"
                  defaultValue={user.phoneNumber || ''}
                  placeholder="09123456789"
                  required
                  error={state?.fieldErrors?.contactNumber?.[0]}
                />

                <Input
                  label="Street Address / Building / Unit"
                  name="deliveryAddress"
                  placeholder="Block 12 Lot 5, Sampaguita St., Brgy..."
                  required
                  error={state?.fieldErrors?.deliveryAddress?.[0]}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="City / Municipality"
                    name="city"
                    placeholder="e.g. Quezon City"
                    required
                    error={state?.fieldErrors?.city?.[0]}
                  />
                  <Input
                    label="Province / Region"
                    name="province"
                    placeholder="e.g. Metro Manila"
                    required
                    error={state?.fieldErrors?.province?.[0]}
                  />
                </div>

                <Input
                  label="Postal ZIP Code (Optional)"
                  name="zipCode"
                  placeholder="e.g. 1100"
                  error={state?.fieldErrors?.zipCode?.[0]}
                />
              </div>

              {/* Mandatory Payment Proof for Delivery */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#f8f4e3] dark:from-[#1b2117] to-[#fefcf1] dark:to-[#131710] border-2 border-[#e0a861] space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2c3324] dark:text-[#fefcf1]">
                    <QrCode className="h-4 w-4 text-[#9a6423] dark:text-[#f0be7c]" />
                    <span>{paymentSettings.platform} Payment (Required for Delivery)</span>
                  </div>
                  <Badge variant="gold" size="sm">Required</Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#707666] dark:text-[#a3ab98]">Official {paymentSettings.platform}:</span>
                    <span className="font-mono font-bold text-sm text-[#2c3324] dark:text-[#fefcf1]">{paymentSettings.accountNumber} ({paymentSettings.accountName})</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#f0f4eb] dark:border-[#323d2b] pt-2">
                    <span className="text-[#707666] dark:text-[#a3ab98]">Total Amount to Send:</span>
                    <strong className="text-sm text-[#9a6423] dark:text-[#f0be7c] font-serif">{formatCurrency(totalAmount)}</strong>
                  </div>
                </div>
                
                {paymentSettings.qrUrl && (
                  <div className="flex justify-center mt-2">
                    <QrZoom src={paymentSettings.qrUrl} platform={paymentSettings.platform} thumbClass="h-28 w-28" />
                  </div>
                )}

                <Input
                  label={`${paymentSettings.platform} Reference Number`}
                  name="referenceNumber"
                  placeholder="e.g. 1004 8920 1827"
                  required
                  error={state?.fieldErrors?.referenceNumber?.[0]}
                />

                <ImageUpload
                  label="Proof of Payment (Screenshot)"
                  name="receiptImage"
                  helperText={`Attach your ${paymentSettings.platform} transaction confirmation screenshot (PNG/JPG).`}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <input
                type="hidden"
                name="recipientName"
                value={`${user.firstName} ${user.lastName}`.trim()}
              />
              {/* Event Pickup Note */}
              <div className="p-3.5 rounded-xl bg-[#f0f4eb] dark:bg-[#1b2117] border border-[#d3dec2] dark:border-[#323d2b] text-xs text-[#505748] dark:text-[#a3ab98] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#2c3324] dark:text-[#fefcf1]">
                  <Info className="h-3.5 w-3.5 text-[#2e7d32] dark:text-[#66bb6a]" />
                  <span>Pre-Order Pickup Protocol</span>
                </div>
                <p>
                  Your order will be prepared for claiming at the official PCYC Registration Desk during the next fellowship camp. You may pay now via {paymentSettings.platform} or pay upon pickup.
                </p>
              </div>

              <Input
                label="Contact Phone Number (Optional)"
                name="contactNumber"
                defaultValue={user.phoneNumber || ''}
                placeholder="09123456789"
                error={state?.fieldErrors?.contactNumber?.[0]}
              />

              {/* Optional Payment Attachment for Event Pickup */}
              <div className="border-t border-[#e6dfcb] dark:border-[#323d2b] pt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowReceiptUpload(!showReceiptUpload)}
                  className="text-xs font-bold text-[#9a6423] dark:text-[#f0be7c] hover:underline flex items-center gap-1.5"
                >
                  <QrCode className="h-4 w-4" />
                  <span>{showReceiptUpload ? `- Hide ${paymentSettings.platform} Receipt Upload` : `+ Pay Now via ${paymentSettings.platform} & Attach Screenshot (Optional)`}</span>
                </button>

                {showReceiptUpload && (
                  <div className="p-4 rounded-xl bg-[#f8f4e3] dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] space-y-4 animate-fadeIn">
                    <div className="text-xs text-[#505748] dark:text-[#a3ab98] space-y-1">
                      <p className="font-bold text-[#2c3324] dark:text-[#fefcf1]">PCYC Official {paymentSettings.platform}:</p>
                      <p className="font-mono text-sm font-bold text-[#9a6423] dark:text-[#f0be7c]">{paymentSettings.accountNumber} ({paymentSettings.accountName})</p>
                      <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                        Amount to send: <strong>{formatCurrency(totalAmount)}</strong>
                      </p>
                    </div>

                    {paymentSettings.qrUrl && (
                      <div className="flex justify-center mt-2">
                        <QrZoom src={paymentSettings.qrUrl} platform={paymentSettings.platform} thumbClass="h-28 w-28" />
                      </div>
                    )}

                    <Input
                      label={`${paymentSettings.platform} Reference Number`}
                      name="referenceNumber"
                      placeholder="e.g. 1004 8920 1827"
                      error={state?.fieldErrors?.referenceNumber?.[0]}
                    />

                    <ImageUpload
                      label={`Screenshot of ${paymentSettings.platform} Receipt`}
                      name="receiptImage"
                      helperText={`Attach your ${paymentSettings.platform} payment confirmation screenshot (PNG/JPG).`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recipient Special Notes */}
          <Textarea
            label="Order Notes / Special Instructions (Optional)"
            name="notes"
            placeholder="e.g. Please inform brother John upon arrival, preferred packaging..."
            rows={2}
          />

          {/* Summary Calculation */}
          <div className="p-4 rounded-xl bg-[#2c3324] text-[#fefcf1] space-y-2">
            <div className="flex justify-between text-xs text-[#fefcf1]/70">
              <span>Items Subtotal ({quantity}x)</span>
              <span>{formatCurrency(itemSubtotal)}</span>
            </div>
            {fulfillmentType === 'DELIVERY' && (
              <div className="flex justify-between text-xs text-[#fefcf1]/70">
                <span>Courier Delivery Fee</span>
                <span>{formatCurrency(COURIER_FEE)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-[#fefcf1] border-t border-[#3d4632] pt-2">
              <span>Total Order Amount</span>
              <span className="text-[#e0a861] text-base">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-[#e6dfcb] dark:border-[#323d2b] pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full gap-2 shadow-md"
            isLoading={isPending}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Confirm & Place Order ({formatCurrency(totalAmount)})</span>
          </Button>

          <p className="text-center text-[11px] text-[#707666] dark:text-[#a3ab98]">
            By placing this order, you support PCYC youth fellowship and camp subsidies.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
