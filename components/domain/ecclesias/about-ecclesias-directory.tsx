'use client';

import React, { useState, useMemo } from 'react';
import type { Ecclesia } from '@/lib/db/schema/ecclesias';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Compass,
  MagnifyingGlass,
  MapTrifold,
  Buildings,
  MapPin,
  Clock,
  UserCheck,
  X,
  Copy,
  Check,
  ArrowSquareOut,
} from '@phosphor-icons/react/dist/ssr';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface AboutEcclesiasDirectoryProps {
  ecclesias: Ecclesia[];
}

type RegionKey = 'ALL' | 'Luzon' | 'Visayas' | 'Mindanao';

const REGIONS: {
  key: 'Luzon' | 'Visayas' | 'Mindanao';
  title: string;
  subtitle: string;
  description: string;
  badgeVariant: 'forest' | 'gold' | 'outline';
}[] = [
  {
    key: 'Luzon',
    title: 'Luzon Ecclesias',
    subtitle: 'Northern, Central, Southern Luzon & Metro Manila',
    description: 'Fellowship assemblies meeting across the National Capital Region and Luzon provinces.',
    badgeVariant: 'forest',
  },
  {
    key: 'Visayas',
    title: 'Visayas Ecclesias',
    subtitle: 'Central, Western & Eastern Visayas',
    description: 'Fellowship circles and ecclesial gatherings across the central Philippine islands.',
    badgeVariant: 'gold',
  },
  {
    key: 'Mindanao',
    title: 'Mindanao Ecclesias',
    subtitle: 'Southern Philippines & Mindanao Provinces',
    description: 'Active youth circles and meeting places across Davao, Cotabato, and Mindanao communities.',
    badgeVariant: 'forest',
  },
];

export function AboutEcclesiasDirectory({ ecclesias }: AboutEcclesiasDirectoryProps) {
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate counts per region
  const counts = useMemo(() => {
    return {
      ALL: ecclesias.length,
      Luzon: ecclesias.filter((e) => e.region === 'Luzon').length,
      Visayas: ecclesias.filter((e) => e.region === 'Visayas').length,
      Mindanao: ecclesias.filter((e) => e.region === 'Mindanao').length,
    };
  }, [ecclesias]);

  // Sort and group ecclesias deterministically by City, then Name
  const groupedEcclesias = useMemo(() => {
    const filterQuery = debouncedSearch.trim().toLowerCase();

    const filterFn = (ecc: Ecclesia) => {
      if (!filterQuery) return true;
      const name = (ecc.name || '').toLowerCase();
      const city = (ecc.city || '').toLowerCase();
      const address = (ecc.address || '').toLowerCase();
      const contact = (ecc.contactPerson || '').toLowerCase();
      return (
        name.includes(filterQuery) ||
        city.includes(filterQuery) ||
        address.includes(filterQuery) ||
        contact.includes(filterQuery)
      );
    };

    const sortFn = (a: Ecclesia, b: Ecclesia) => {
      const cityCompare = (a.city || '').localeCompare(b.city || '');
      if (cityCompare !== 0) return cityCompare;
      return (a.name || '').localeCompare(b.name || '');
    };

    return {
      Luzon: ecclesias.filter((e) => e.region === 'Luzon' && filterFn(e)).sort(sortFn),
      Visayas: ecclesias.filter((e) => e.region === 'Visayas' && filterFn(e)).sort(sortFn),
      Mindanao: ecclesias.filter((e) => e.region === 'Mindanao' && filterFn(e)).sort(sortFn),
    };
  }, [ecclesias, debouncedSearch]);

  const totalFilteredCount =
    groupedEcclesias.Luzon.length + groupedEcclesias.Visayas.length + groupedEcclesias.Mindanao.length;

  const activeRegions = useMemo(() => {
    if (selectedRegion === 'ALL') {
      return REGIONS;
    }
    return REGIONS.filter((r) => r.key === selectedRegion);
  }, [selectedRegion]);

  return (
    <div className="space-y-12">
      {/* Search & Dynamic Filter Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-sm">
        {/* Region Filter Tabs with spring sliding pill */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#f8f4e3] dark:bg-[#131710] rounded-2xl w-full md:w-auto">
          <button
            type="button"
            onClick={() => setSelectedRegion('ALL')}
            className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center gap-2 z-10 ${
              selectedRegion === 'ALL'
                ? 'text-[#fefcf1] dark:text-[#131710]'
                : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1]'
            }`}
          >
            {selectedRegion === 'ALL' && (
              <motion.div
                layoutId="activeEcclesiaTab"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-[#2c3324] dark:bg-[#e0a861] rounded-xl z-[-1] shadow-sm"
              />
            )}
            <Compass weight="duotone" className="h-4 w-4 shrink-0" />
            <span>All Regions</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                selectedRegion === 'ALL'
                  ? 'bg-white/20 dark:bg-black/20'
                  : 'bg-black/5 dark:bg-white/10'
              }`}
            >
              {counts.ALL}
            </span>
          </button>

          {REGIONS.map((reg) => (
            <button
              key={reg.key}
              type="button"
              onClick={() => setSelectedRegion(reg.key)}
              className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center gap-2 z-10 ${
                selectedRegion === reg.key
                  ? 'text-[#fefcf1] dark:text-[#131710]'
                  : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1]'
              }`}
            >
              {selectedRegion === reg.key && (
                <motion.div
                  layoutId="activeEcclesiaTab"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-[#2c3324] dark:bg-[#e0a861] rounded-xl z-[-1] shadow-sm"
                />
              )}
              <span>{reg.key}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                  selectedRegion === reg.key
                    ? 'bg-white/20 dark:bg-black/20'
                    : 'bg-black/5 dark:bg-white/10'
                }`}
              >
                {counts[reg.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-80">
          <MagnifyingGlass
            weight="bold"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707666] dark:text-[#a3ab98]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city, name, or address..."
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-[#fefcf1] dark:bg-[#131710] border border-[#e6dfcb] dark:border-[#323d2b] rounded-2xl text-[#2c3324] dark:text-[#fefcf1] placeholder-[#707666] dark:placeholder-[#8a9180] focus:outline-none focus:border-[#e0a861] focus:ring-2 focus:ring-[#e0a861]/20 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#707666] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Clear Search"
            >
              <X weight="bold" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* No Results Fallback */}
      {totalFilteredCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] text-center space-y-4 shadow-sm"
        >
          <div className="h-14 w-14 rounded-2xl bg-[#f8f4e3] dark:bg-[#252e1f] flex items-center justify-center mx-auto text-[#9a6423] dark:text-[#e0a861]">
            <Buildings weight="duotone" className="h-7 w-7" />
          </div>
          <h3 className="font-serif font-bold text-2xl text-[#2c3324] dark:text-[#fefcf1]">
            No Ecclesias Found
          </h3>
          <p className="text-sm text-[#707666] dark:text-[#a3ab98] max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? `No ecclesias match "${searchQuery}". Please check the spelling or select a different island region.`
              : 'There are currently no published ecclesias listed in this category.'}
          </p>
        </motion.div>
      )}

      {/* Structured Island Group Sections */}
      <div className="space-y-16">
        {activeRegions.map((region) => {
          const list = groupedEcclesias[region.key];
          if (list.length === 0 && searchQuery) return null;

          return (
            <section
              key={region.key}
              id={`region-${region.key.toLowerCase()}`}
              className="space-y-8 scroll-mt-24"
            >
              {/* Region Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[#e6dfcb] dark:border-[#323d2b]">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <MapTrifold weight="duotone" className="h-4 w-4 text-[#9a6423] dark:text-[#e0a861]" />
                    <span className="text-xs font-bold text-[#9a6423] dark:text-[#f0be7c] uppercase tracking-widest">
                      {region.subtitle}
                    </span>
                  </div>
                  <h3 className="font-serif text-3xl font-bold text-[#2c3324] dark:text-[#fefcf1]">
                    {region.title}
                  </h3>
                  <p className="text-sm text-[#707666] dark:text-[#a3ab98] max-w-2xl">{region.description}</p>
                </div>
                <div className="shrink-0">
                  <Badge variant={region.badgeVariant} size="md" className="rounded-full">
                    {list.length} {list.length === 1 ? 'Ecclesia' : 'Ecclesias'}
                  </Badge>
                </div>
              </div>

              {/* Ecclesias Grid */}
              {list.length === 0 ? (
                <div className="p-10 rounded-3xl bg-white/60 dark:bg-[#1b2117]/60 border border-dashed border-[#e6dfcb] dark:border-[#323d2b] text-center space-y-2">
                  <p className="text-sm text-[#707666] dark:text-[#a3ab98]">
                    No verified ecclesias are listed in {region.key} yet. New meeting circles will be published as verified.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {list.map((ecc) => (
                      <motion.div
                        key={ecc.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="h-full"
                      >
                        <InteractiveCard className="group h-full flex flex-col justify-between hover:shadow-2xl hover:border-[#e0a861]/60 transition-all duration-300 bg-white dark:bg-[#1b2117] rounded-3xl border border-[#e6dfcb] dark:border-[#323d2b] p-6 sm:p-7">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-[#f8f4e3] dark:bg-[#252e1f] text-[#9a6423] dark:text-[#f0be7c] border border-[#e6dfcb] dark:border-[#323d2b]">
                                {ecc.city || ecc.region}
                              </span>
                              <span className="text-[11px] text-[#707666] dark:text-[#a3ab98] font-semibold">
                                {ecc.region}
                              </span>
                            </div>
                            <h4 className="font-serif text-2xl text-[#2c3324] dark:text-[#fefcf1] leading-snug group-hover:text-[#9a6423] dark:group-hover:text-[#e0a861] transition-colors">
                              {ecc.name}
                            </h4>

                            <div className="space-y-3.5 text-xs sm:text-sm text-[#505748] dark:text-[#a3ab98]">
                              {/* Address */}
                              <div className="flex items-start gap-3">
                                <MapPin weight="duotone" className="h-4 w-4 text-[#9a6423] dark:text-[#e0a861] shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{ecc.address}</span>
                              </div>

                              {/* Meeting Schedule */}
                              <div className="flex items-start gap-3">
                                <Clock weight="duotone" className="h-4 w-4 text-[#9a6423] dark:text-[#e0a861] shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-[#2c3324] dark:text-[#fefcf1] block">
                                    Meeting Schedule:
                                  </span>
                                  <span className="leading-relaxed text-xs">{ecc.meetingSchedule}</span>
                                </div>
                              </div>

                              {/* Contact Person */}
                              {ecc.contactPerson && (
                                <div className="flex items-start gap-3 pt-3 border-t border-[#f4efe0] dark:border-[#323d2b]">
                                  <UserCheck weight="duotone" className="h-4 w-4 text-[#707666] dark:text-[#a3ab98] shrink-0 mt-0.5" />
                                  <span className="text-xs text-[#707666] dark:text-[#a3ab98]">
                                    Coordinator:{' '}
                                    <strong className="text-[#2c3324] dark:text-[#fefcf1] font-semibold">
                                      {ecc.contactPerson}
                                    </strong>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Bar: Copy Address & Map Search */}
                          <div className="pt-5 mt-4 border-t border-[#f4efe0] dark:border-[#323d2b] flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopy(ecc.id, `${ecc.name}, ${ecc.address}`)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#707666] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1] transition-colors p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                              title="Copy Address"
                            >
                              {copiedId === ecc.id ? (
                                <>
                                  <Check weight="bold" className="h-3.5 w-3.5 text-green-600" />
                                  <span className="text-green-600 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy weight="bold" className="h-3.5 w-3.5" />
                                  <span>Copy Info</span>
                                </>
                              )}
                            </button>

                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${ecc.name} ${ecc.address} Philippines`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#9a6423] dark:text-[#f0be7c] hover:underline"
                            >
                              <span>View Map</span>
                              <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </InteractiveCard>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

