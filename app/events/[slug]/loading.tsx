import React from 'react';

export default function EventDetailLoading() {
  return (
    <div className="w-full flex flex-col min-h-screen bg-cream animate-pulse">
      {/* Top Breadcrumb Skeleton */}
      <div className="bg-[#1b2117] py-4 border-b border-[#2c3324]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-36 bg-[#2c3324] rounded-md" />
        </div>
      </div>

      {/* Cinematic Event Hero Skeleton */}
      <div className="bg-[#2c3324] py-16 sm:py-24 border-b border-[#3d4632]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-6 w-32 bg-[#3d4632] rounded-full" />
                <div className="h-6 w-20 bg-[#3d4632] rounded-full" />
              </div>
              <div className="h-14 w-4/5 bg-[#3d4632] rounded-2xl" />
              <div className="h-24 w-full bg-[#3d4632]/60 rounded-2xl" />
            </div>
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="h-48 w-full max-w-sm rounded-3xl bg-[#3d4632]/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Columns Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Details */}
          <div className="lg:col-span-7 space-y-10">
            <div className="rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] p-8 space-y-4">
              <div className="h-7 w-48 bg-[#e6dfcb]/70 dark:bg-[#252e1f] rounded-lg" />
              <div className="h-4 w-full bg-[#e6dfcb]/40 dark:bg-[#20271b] rounded-lg" />
              <div className="h-4 w-5/6 bg-[#e6dfcb]/40 dark:bg-[#20271b] rounded-lg" />
              <div className="h-4 w-4/6 bg-[#e6dfcb]/40 dark:bg-[#20271b] rounded-lg" />
            </div>
            <div className="rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] p-8 space-y-4">
              <div className="h-7 w-40 bg-[#e6dfcb]/70 dark:bg-[#252e1f] rounded-lg" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 w-full bg-[#e6dfcb]/30 dark:bg-[#20271b] rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Registration Sidebar */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] p-8 space-y-6 sticky top-24">
              <div className="h-8 w-3/4 bg-[#e6dfcb]/70 dark:bg-[#252e1f] rounded-xl" />
              <div className="h-10 w-1/2 bg-[#e6dfcb]/50 dark:bg-[#20271b] rounded-lg" />
              <div className="space-y-3">
                <div className="h-12 w-full bg-[#e6dfcb]/30 dark:bg-[#20271b] rounded-xl" />
                <div className="h-12 w-full bg-[#e6dfcb]/30 dark:bg-[#20271b] rounded-xl" />
              </div>
              <div className="h-12 w-full bg-[#2c3324]/60 dark:bg-[#e0a861]/60 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
