import React from 'react';

export default function PortalLoading() {
  return (
    <div className="flex flex-col w-full pb-16 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="bg-[#2c3324] py-12 sm:py-16 border-b border-[#3d4632]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="h-5 w-32 bg-[#3d4632] rounded-full" />
          <div className="h-10 w-64 bg-[#3d4632] rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-[#3d4632]/60 rounded-md" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Event Registrations Card Skeleton */}
            <div className="rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-6 w-44 bg-[#e6dfcb]/70 dark:bg-[#252e1f] rounded-lg" />
                <div className="h-4 w-20 bg-[#e6dfcb]/50 dark:bg-[#20271b] rounded-md" />
              </div>
              <div className="h-28 rounded-2xl bg-[#f8f4e3] dark:bg-[#20271b]" />
            </div>

            {/* Merchandise Orders Card Skeleton */}
            <div className="rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-6 w-40 bg-[#e6dfcb]/70 dark:bg-[#252e1f] rounded-lg" />
                <div className="h-4 w-24 bg-[#e6dfcb]/50 dark:bg-[#20271b] rounded-md" />
              </div>
              <div className="h-28 rounded-2xl bg-[#f8f4e3] dark:bg-[#20271b]" />
            </div>
          </div>

          {/* Right Notifications / Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] p-6 space-y-4">
              <div className="h-6 w-32 bg-[#e6dfcb]/70 dark:bg-[#252e1f] rounded-lg" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-[#f8f4e3] dark:bg-[#20271b]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
