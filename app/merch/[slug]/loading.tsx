import React from 'react';

export default function ProductDetailLoading() {
  return (
    <div className="w-full flex flex-col min-h-screen bg-cream animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="bg-[#f8f4e3] dark:bg-[#1b2117] py-3.5 border-b border-[#e6dfcb] dark:border-[#323d2b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-48 bg-[#e6dfcb]/60 dark:bg-[#252e1f] rounded-md" />
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left: Showcase Skeleton */}
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-square w-full rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] p-8 flex items-center justify-center">
              <div className="h-4/5 w-4/5 bg-[#f8f4e3] dark:bg-[#252e1f] rounded-2xl" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-2xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] p-2">
                  <div className="h-full w-full bg-[#f8f4e3] dark:bg-[#252e1f] rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order Form Skeleton */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="h-6 w-28 bg-[#e6dfcb]/70 dark:bg-[#252e1f] rounded-full" />
              <div className="h-10 w-3/4 bg-[#e6dfcb]/80 dark:bg-[#252e1f] rounded-2xl" />
              <div className="h-8 w-36 bg-[#e6dfcb]/60 dark:bg-[#252e1f] rounded-xl" />
            </div>

            <div className="space-y-2 py-4 border-y border-[#e6dfcb] dark:border-[#323d2b]">
              <div className="h-4 w-full bg-[#e6dfcb]/40 dark:bg-[#20271b] rounded-lg" />
              <div className="h-4 w-5/6 bg-[#e6dfcb]/40 dark:bg-[#20271b] rounded-lg" />
              <div className="h-4 w-2/3 bg-[#e6dfcb]/40 dark:bg-[#20271b] rounded-lg" />
            </div>

            <div className="space-y-4">
              <div className="h-5 w-24 bg-[#e6dfcb]/60 dark:bg-[#252e1f] rounded-md" />
              <div className="flex gap-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 w-12 rounded-xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b]" />
                ))}
              </div>
            </div>

            <div className="h-14 w-full rounded-2xl bg-[#2c3324]/60 dark:bg-[#e0a861]/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
