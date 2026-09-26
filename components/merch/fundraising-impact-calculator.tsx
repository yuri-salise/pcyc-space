'use client';

import React, { useState } from 'react';
import { HandHeart, BookOpen } from '@phosphor-icons/react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';

export function FundraisingImpactCalculator() {
  const [itemsCount, setItemsCount] = useState(3);

  // Each merch item averages ~₱450 gross, ~₱250 net subsidy pool
  const totalFundRaised = itemsCount * 450;
  const delegatesSubsidized = Math.max(1, Math.floor(itemsCount * 0.75));
  const studyPacksFunded = itemsCount;

  return (
    <InteractiveCard className="rounded-[2.5rem] bg-gradient-to-br from-[#2c3324] via-[#35402c] to-[#1e2518] text-[#fefcf1] p-8 sm:p-12 border border-[#526344]/50 shadow-2xl relative overflow-hidden">
      {/* Background Radiance */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(224,168,97,0.18),transparent_60%)] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        
        {/* Left Interactive Control */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e0a861]/20 border border-[#e0a861]/40 text-xs font-bold text-[#e0a861]">
            <HandHeart weight="fill" className="h-4 w-4" />
            <span>100% Volunteer Managed Youth Mission</span>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#fefcf1] leading-tight">
              See Your Impact in Action
            </h3>
            <p className="text-sm sm:text-base text-[#f8f4e3]/80 leading-relaxed">
              Every merchandise item purchased directly funds travel subsidies, study binders, and lodging for youth delegates from remote island ecclesias.
            </p>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-3 pt-2 bg-black/20 p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#f8f4e3]/80 uppercase tracking-wider">Select Item Quantity:</span>
              <span className="text-[#e0a861] text-base font-mono">{itemsCount} Item{itemsCount > 1 ? 's' : ''}</span>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              value={itemsCount}
              onChange={(e) => setItemsCount(Number(e.target.value))}
              className="w-full accent-[#e0a861] h-2 bg-white/20 rounded-lg cursor-pointer transition-all"
            />

            <div className="flex justify-between text-[10px] font-mono text-[#f8f4e3]/60 px-0.5">
              <span>1 item (₱450)</span>
              <span>5 items (₱2,250)</span>
              <span>10 items (₱4,500)</span>
            </div>
          </div>
        </div>

        {/* Right Dynamic Impact Cards */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Fund Raised */}
          <div className="p-6 rounded-2xl bg-white/10 dark:bg-black/30 border border-white/15 backdrop-blur-md space-y-2 text-center flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#e0a861]">
              Mission Fund Generated
            </span>
            <div className="font-serif font-bold text-3xl sm:text-4xl text-[#fefcf1]">
              ₱<AnimatedCounter value={totalFundRaised} />
            </div>
            <span className="text-[11px] text-[#f8f4e3]/70">Zero platform overhead fees</span>
          </div>

          {/* Card 2: Delegates Assisted */}
          <div className="p-6 rounded-2xl bg-[#e0a861]/15 border border-[#e0a861]/40 backdrop-blur-md space-y-2 text-center flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#e0a861]">
              Island Delegates Aided
            </span>
            <div className="font-serif font-bold text-3xl sm:text-4xl text-[#fefcf1]">
              <AnimatedCounter value={delegatesSubsidized} suffix=" Youth" />
            </div>
            <span className="text-[11px] text-[#f8f4e3]/70">Ferry & bus fare subsidies</span>
          </div>

          {/* Card 3: Study Packs */}
          <div className="sm:col-span-2 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#e0a861]/20 text-[#e0a861] flex items-center justify-center shrink-0">
              <BookOpen weight="duotone" className="h-5 w-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <span className="font-bold text-[#fefcf1] block">
                Includes {studyPacksFunded} Youth Camp Study Pack{studyPacksFunded > 1 ? 's' : ''}
              </span>
              <span className="text-[#f8f4e3]/70 leading-relaxed">
                Supplies camp scripture manuals, devotional notebooks, and study accessories.
              </span>
            </div>
          </div>
        </div>

      </div>
    </InteractiveCard>
  );
}
