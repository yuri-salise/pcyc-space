'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { InteractiveCard } from '@/components/ui/interactive-card';

interface ProductImageShowcaseProps {
  imageUrls: string[];
  productName: string;
  isPreorder?: boolean;
  category?: string;
}

const FALLBACK_IMAGE = '/images/logo/pcyc-transparent-logo.png';

export function ProductImageShowcase({
  imageUrls,
  productName,
  isPreorder,
}: ProductImageShowcaseProps) {
  // Sanitize image URLs list
  const validImages = Array.isArray(imageUrls)
    ? imageUrls.filter((url) => typeof url === 'string' && url.trim().length > 0)
    : [];

  const images = validImages.length > 0 ? validImages : [FALLBACK_IMAGE];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  // Derive bounded image index
  const safeIndex = selectedImageIndex >= images.length ? 0 : selectedImageIndex;

  const currentImage = failedImages[safeIndex]
    ? FALLBACK_IMAGE
    : images[safeIndex] || FALLBACK_IMAGE;

  const isDataOrBlob = currentImage.startsWith('data:') || currentImage.startsWith('blob:');

  const handleImageError = (index: number) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="space-y-4">
      {/* Main 3D Interactive Card Showcase */}
      <InteractiveCard className="relative aspect-square w-full rounded-[2.5rem] bg-[#f8f4e3] dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] overflow-hidden shadow-2xl group">
        {/* Atmospheric Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,168,97,0.18),transparent_70%)] pointer-events-none" />

        {/* Floating Pre-Order Status Badge (if active) */}
        {isPreorder && (
          <div className="absolute top-6 left-6 z-20">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fbf1e2] dark:bg-[#2b2315] text-[#9a6423] dark:text-[#f0be7c] border border-[#e0a861]/40 shadow-md backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#e0a861] animate-ping" />
              <span>Pre-Order Batch</span>
            </span>
          </div>
        )}

        {/* Main Image Container (Clean True Centering) */}
        <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
          <div className="relative w-full h-full flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
            <Image
              key={`${currentImage}-${selectedImageIndex}`}
              src={currentImage}
              alt={productName}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized={currentImage.startsWith('http') || isDataOrBlob}
              onError={() => handleImageError(selectedImageIndex)}
              className="object-contain object-center drop-shadow-xl rounded-2xl"
              priority
            />
          </div>
        </div>
      </InteractiveCard>

      {/* Multi-angle Thumbnails Carousel (if > 1 image) */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => {
            const isSelected = selectedImageIndex === idx;
            const thumbSrc = failedImages[idx] ? FALLBACK_IMAGE : img;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative h-20 w-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-[#f8f4e3] dark:bg-[#1b2117] p-2 ${
                  isSelected
                    ? 'border-[#e0a861] ring-2 ring-[#e0a861]/40 scale-105 shadow-md'
                    : 'border-[#e6dfcb] dark:border-[#323d2b] opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={thumbSrc}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  unoptimized={thumbSrc.startsWith('data:') || thumbSrc.startsWith('blob:')}
                  onError={() => handleImageError(idx)}
                  className="object-contain p-2"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
