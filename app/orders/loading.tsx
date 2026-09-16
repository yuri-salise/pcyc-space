import React from 'react';

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-cream py-10 sm:py-16 animate-pulse">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e6dfcb] dark:border-[#323d2b] pb-6">
          <div className="space-y-2">
            <div className="h-4 w-36 bg-[#e6dfcb]/60 dark:bg-[#252e1f] rounded-md" />
            <div className="h-10 w-64 bg-[#e6dfcb]/80 dark:bg-[#252e1f] rounded-xl" />
            <div className="h-4 w-80 bg-[#e6dfcb]/40 dark:bg-[#20271b] rounded-lg" />
          </div>
          <div className="h-10 w-36 bg-[#e6dfcb]/60 dark:bg-[#252e1f] rounded-xl" />
        </div>

        {/* Tab Filters Skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-24 rounded-xl bg-[#e6dfcb]/50 dark:bg-[#252e1f]" />
          ))}
        </div>

        {/* Order Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[#e6dfcb]/60 dark:border-[#323d2b]">
                <div className="h-5 w-32 bg-[#e6dfcb]/60 dark:bg-[#252e1f] rounded-md" />
                <div className="h-6 w-20 bg-[#e6dfcb]/60 dark:bg-[#252e1f] rounded-full" />
              </div>
              <div className="h-4 w-1/2 bg-[#e6dfcb]/40 dark:bg-[#20271b] rounded-lg" />
              <div className="h-4 w-1/3 bg-[#e6dfcb]/40 dark:bg-[#20271b] rounded-lg" />
              <div className="h-12 w-full bg-[#f8f4e3] dark:bg-[#20271b] rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
