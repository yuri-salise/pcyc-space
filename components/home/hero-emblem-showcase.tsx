'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Sparkle, Compass, BookOpen } from '@phosphor-icons/react';
import { springs } from '@/lib/motion';

export function HeroEmblemShowcase() {
  return (
    <div className="relative w-full max-w-lg aspect-[4/5] sm:aspect-square flex items-center justify-center">
      {/* Outer Rotating Glowing Sunburst Halo */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-2 sm:inset-6 rounded-full border border-dashed border-[#e0a861]/30 dark:border-[#e0a861]/25 pointer-events-none"
      />

      {/* Inner Pulsing Aura Ring */}
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-8 sm:inset-14 rounded-full bg-radial from-[#e0a861]/25 via-[#e0a861]/5 to-transparent blur-xl pointer-events-none"
      />

      {/* Main Glassmorphic Emblem Card Container */}
      <motion.div
        whileHover={{ scale: 1.02, transition: springs.default }}
        className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-b from-[#38432e]/90 to-[#1e2518]/95 dark:from-[#252e1f]/90 dark:to-[#12160f]/95 border border-[#526344]/50 dark:border-[#3d4933]/60 shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-8 sm:p-12 flex flex-col items-center justify-center text-center overflow-hidden group backdrop-blur-md"
      >
        {/* Subtle Radial Gradient Sheen */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(224,168,97,0.22),transparent_70%)] pointer-events-none" />

        {/* Central Logo with Float Physics */}
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative h-56 w-56 sm:h-64 sm:w-64 drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)] transition-transform duration-700 ease-out group-hover:scale-105"
        >
          <Image
            src="/images/logo/pcyc-transparent-logo.png"
            alt="PCYC Emblem"
            fill
            className="object-contain"
            priority
          />
        </motion.div>

        {/* Floating Glass Tag 1: Top-Left (Island Fellowship) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, ...springs.default }}
          className="absolute top-6 left-4 sm:left-6 px-3.5 py-1.5 rounded-2xl bg-white/10 dark:bg-[#131710]/60 backdrop-blur-md border border-white/20 dark:border-white/10 text-[#fefcf1] text-[11px] font-bold flex items-center gap-1.5 shadow-lg shadow-black/20"
        >
          <Compass weight="fill" className="h-3.5 w-3.5 text-[#e0a861]" />
          <span>Luzon • Visayas • Mindanao</span>
        </motion.div>

        {/* Floating Glass Tag 2: Top-Right (Bible Camps) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45, ...springs.default }}
          className="absolute top-6 right-4 sm:right-6 px-3.5 py-1.5 rounded-2xl bg-[#e0a861]/20 dark:bg-[#e0a861]/15 backdrop-blur-md border border-[#e0a861]/40 text-[#fefcf1] text-[11px] font-bold flex items-center gap-1.5 shadow-lg shadow-black/20"
        >
          <BookOpen weight="fill" className="h-3.5 w-3.5 text-[#e0a861]" />
          <span>Scripture-Rooted</span>
        </motion.div>

        {/* Floating Glass Tag 3: Bottom-Center (Youth Ministry) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, ...springs.default }}
          className="absolute bottom-6 px-4 py-2 rounded-2xl bg-[#2c3324]/80 dark:bg-[#131710]/80 backdrop-blur-md border border-[#e0a861]/30 text-[#f8f4e3] text-xs font-semibold flex items-center gap-2 shadow-xl shadow-black/30"
        >
          <Sparkle weight="fill" className="h-4 w-4 text-[#e0a861] animate-pulse" />
          <span>Philippine Christadelphian Youth Circle</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
