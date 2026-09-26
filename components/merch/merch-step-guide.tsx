'use client';

import React from 'react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { ShoppingBag, QrCode, Receipt, Package } from '@phosphor-icons/react';

interface MerchStepGuideProps {
  paymentSettings: {
    platform: string;
    accountName: string;
    accountNumber: string;
  };
}

export function MerchStepGuide({ paymentSettings }: MerchStepGuideProps) {
  const steps = [
  {
    step: '01',
    icon: ShoppingBag,
    title: 'Select Apparel & Size',
    description: 'Browse our curated camp shirts, hoodies, totes, and devotional stationery.',
  },
  {
    step: '02',
    icon: QrCode,
    title: 'Zero-Fee Online Payment',
    description: `Send exact order total via ${paymentSettings.platform} to ${paymentSettings.accountNumber} (${paymentSettings.accountName}) with no extra gateway fees.`,
  },
  {
    step: '03',
    icon: Receipt,
    title: 'Upload Receipt Screenshot',
    description: 'Attach your payment confirmation screenshot securely in the order form.',
  },
  {
    step: '04',
    icon: Package,
    title: 'Shipped to Your Ecclesia',
    description: 'Orders are packed with care and dispatched directly to your ecclesia coordinator.',
  },
  ];

  return (
    <div className="space-y-12">
      <ScrollReveal className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-[#9a6423] dark:text-[#f0be7c] px-3 py-1 rounded-full bg-[#e0a861]/15 border border-[#e0a861]/30">
          Simple & Fee-Free Ordering
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2c3324] dark:text-[#fefcf1]">
          How Ordering Works
        </h2>
        <p className="text-sm sm:text-base text-[#707666] dark:text-[#a3ab98]">
          To keep apparel prices accessible and eliminate credit card processing fees, our store operates on a trusted direct transfer process.
        </p>
      </ScrollReveal>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step) => {
          const StepIcon = step.icon;
          return (
            <StaggerItem key={step.step} className="h-full">
              <InteractiveCard className="h-full p-7 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] space-y-4 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-[#e0a861]/60 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-12 w-12 rounded-2xl bg-[#fbf1e2] dark:bg-[#252e1f] text-[#e0a861] flex items-center justify-center shadow-xs">
                      <StepIcon weight="duotone" className="h-6 w-6 text-[#9a6423] dark:text-[#f0be7c]" />
                    </div>
                    <span className="font-serif font-bold text-2xl text-[#e6dfcb] dark:text-[#323d2b]">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#2c3324] dark:text-[#fefcf1] leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#707666] dark:text-[#a3ab98] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </InteractiveCard>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
