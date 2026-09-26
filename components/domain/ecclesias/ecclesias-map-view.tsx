'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Ecclesia } from '@/lib/db/schema/ecclesias';
import { getEcclesiaCoordinates, REGION_CENTERS } from '@/lib/geo/ecclesia-coordinates';
import {
  MapPin,
  Compass,
  MagnifyingGlass,
  Clock,
  User,
  Check,
  NavigationArrow,
  ArrowSquareOut,
  X,
  ListDashes,
  MapTrifold,
  Copy,
} from '@phosphor-icons/react';
import { useToast } from '@/components/ui/toast';
import 'leaflet/dist/leaflet.css';

interface EcclesiasMapViewProps {
  ecclesias: Ecclesia[];
}

export function EcclesiasMapView({ ecclesias }: EcclesiasMapViewProps) {
  const { success } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const sidebarItemsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'Luzon' | 'Visayas' | 'Mindanao'>('ALL');
  const [selectedEcclesiaId, setSelectedEcclesiaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');

  // Count by region
  const regionCounts = useMemo(() => {
    return {
      ALL: ecclesias.length,
      Luzon: ecclesias.filter((e) => e.region.toLowerCase() === 'luzon').length,
      Visayas: ecclesias.filter((e) => e.region.toLowerCase() === 'visayas').length,
      Mindanao: ecclesias.filter((e) => e.region.toLowerCase() === 'mindanao').length,
    };
  }, [ecclesias]);

  // Filter ecclesias based on region and search query
  const filteredEcclesias = useMemo(() => {
    return ecclesias.filter((ecc) => {
      const matchesRegion = selectedRegion === 'ALL' || ecc.region.toLowerCase() === selectedRegion.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        ecc.name.toLowerCase().includes(query) ||
        ecc.city.toLowerCase().includes(query) ||
        ecc.address.toLowerCase().includes(query) ||
        (ecc.contactPerson && ecc.contactPerson.toLowerCase().includes(query));
      return matchesRegion && matchesSearch;
    });
  }, [ecclesias, selectedRegion, searchQuery]);

  const copyEcclesiaDetails = (ecc: Ecclesia) => {
    const textToCopy = `${ecc.name} (${ecc.region})\nAddress: ${ecc.address}, ${ecc.city}\nSchedule: ${ecc.meetingSchedule}${ecc.contactPerson ? `\nContact: ${ecc.contactPerson}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(ecc.id);
    success(`${ecc.name} details copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const renderMarkers = (L: any, map: any) => {
    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const regionColors: Record<string, { bg: string; ring: string }> = {
      luzon: { bg: '#e0a861', ring: 'rgba(224, 168, 97, 0.45)' },
      visayas: { bg: '#d97706', ring: 'rgba(217, 119, 6, 0.45)' },
      mindanao: { bg: '#059669', ring: 'rgba(5, 150, 105, 0.45)' },
    };

    filteredEcclesias.forEach((ecc, index) => {
      const coords = getEcclesiaCoordinates(ecc.city, ecc.name, ecc.address, ecc.region, index);
      const colorScheme = regionColors[ecc.region.toLowerCase()] || regionColors.luzon;

      // Custom Glowing DivIcon
      const customIcon = L.divIcon({
        className: 'custom-pcyc-icon',
        html: `
          <div class="pcyc-marker-pin" style="width: 36px; height: 36px;">
            <div class="pcyc-marker-pulse" style="background-color: ${colorScheme.ring};"></div>
            <div style="
              width: 32px;
              height: 32px;
              background-color: ${colorScheme.bg};
              border: 2px solid #2c3324;
              border-radius: 9999px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              position: relative;
              z-index: 2;
            ">
              <svg width="15" height="15" viewBox="0 0 256 256" fill="#2c3324">
                <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,116a28,28,0,1,1,28-28A28,28,0,0,1,128,132Z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map);

      // Popup Content HTML
      const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${ecc.name} ${ecc.address} ${ecc.city} Philippines`
      )}`;

      const popupHtml = `
        <div style="padding: 16px; min-width: 250px; max-width: 300px; font-family: inherit;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              background: rgba(224, 168, 97, 0.2);
              color: #9a6423;
              padding: 2px 8px;
              border-radius: 9999px;
              border: 1px solid rgba(224, 168, 97, 0.4);
            ">${ecc.region}</span>
            <span style="font-size: 11px; font-weight: 600; opacity: 0.7;">${ecc.city}</span>
          </div>
          <h4 style="font-family: Georgia, serif; font-size: 16px; font-weight: 700; margin: 0 0 6px 0; line-height: 1.3;">
            ${ecc.name}
          </h4>
          <p style="font-size: 12px; margin: 0 0 10px 0; opacity: 0.85; line-height: 1.4;">
            📍 ${ecc.address}
          </p>
          <div style="padding: 8px 10px; background: rgba(0,0,0,0.04); border-radius: 8px; font-size: 11px; margin-bottom: 10px;">
            <strong>🕒 Schedule:</strong> ${ecc.meetingSchedule}
          </div>
          ${ecc.contactPerson ? `<div style="font-size: 11px; opacity: 0.8; margin-bottom: 10px;">👤 <strong>Contact:</strong> ${ecc.contactPerson}</div>` : ''}
          <div style="display: flex; gap: 6px;">
            <button 
              id="copy-popup-${ecc.id}" 
              style="
                flex: 1;
                font-size: 11px;
                font-weight: 700;
                padding: 6px 10px;
                background: #2c3324;
                color: #fefcf1;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                text-align: center;
              "
            >
              Copy Info
            </button>
            <a 
              href="${mapSearchUrl}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="
                font-size: 11px;
                font-weight: 700;
                padding: 6px 10px;
                background: #e0a861;
                color: #2c3324;
                text-decoration: none;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 4px;
              "
            >
              Directions ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: true, autoPan: true });

      marker.on('popupopen', () => {
        setSelectedEcclesiaId(ecc.id);
        const copyBtn = document.getElementById(`copy-popup-${ecc.id}`);
        if (copyBtn) {
          copyBtn.onclick = () => copyEcclesiaDetails(ecc);
        }

        // Scroll sidebar item into view
        const sidebarEl = sidebarItemsRef.current.get(ecc.id);
        if (sidebarEl) {
          sidebarEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      marker.on('click', () => {
        setSelectedEcclesiaId(ecc.id);
      });

      markersRef.current.set(ecc.id, marker);
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = await import('leaflet');

      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

      // Fix default Leaflet asset URLs
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Create Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: [REGION_CENTERS.ALL.lat, REGION_CENTERS.ALL.lng],
        zoom: REGION_CENTERS.ALL.zoom,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: true,
      });

      // Zoom Controls at Bottom Right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Standard OpenStreetMap Tiles (100% Free, No API Key Required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size immediately and with small delays to ensure all tiles render
      map.invalidateSize();
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 400);

      renderMarkers(L, map);
    }

    initMap();

    // Handle container resize
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate map size when mobile tab changes
  useEffect(() => {
    if (mobileTab === 'map' && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }
  }, [mobileTab]);

  // Re-render markers when filter changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      renderMarkers(L, mapInstanceRef.current);
    });
  }, [filteredEcclesias]);

  const handleFlyToRegion = (region: 'ALL' | 'Luzon' | 'Visayas' | 'Mindanao') => {
    setSelectedRegion(region);
    if (!mapInstanceRef.current) return;
    const target = REGION_CENTERS[region];
    mapInstanceRef.current.flyTo([target.lat, target.lng], target.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  };

  const handleSelectEcclesia = (ecc: Ecclesia, index: number) => {
    setSelectedEcclesiaId(ecc.id);
    if (mobileTab === 'list') {
      setMobileTab('map');
    }

    if (!mapInstanceRef.current) return;

    const coords = getEcclesiaCoordinates(ecc.city, ecc.name, ecc.address, ecc.region, index);
    mapInstanceRef.current.flyTo([coords.lat, coords.lng], 13, {
      duration: 1.2,
    });

    const marker = markersRef.current.get(ecc.id);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 700);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Region Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-sm">
        
        {/* Region Filter Pills with Live Counter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#f8f4e3] dark:bg-[#131710] rounded-2xl">
          {(['ALL', 'Luzon', 'Visayas', 'Mindanao'] as const).map((reg) => {
            const isSelected = selectedRegion === reg;
            const count = regionCounts[reg];
            return (
              <button
                key={reg}
                type="button"
                onClick={() => handleFlyToRegion(reg)}
                className={`relative px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 select-none ${
                  isSelected
                    ? 'bg-[#2c3324] dark:bg-[#e0a861] text-[#fefcf1] dark:text-[#1b2117] font-bold shadow-xs'
                    : 'text-[#505748] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1]'
                }`}
              >
                <span>{reg === 'ALL' ? 'All Archipelago' : reg}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isSelected
                      ? 'bg-white/20 dark:bg-black/20 text-inherit'
                      : 'bg-black/5 dark:bg-white/10 text-[#707666] dark:text-[#8a9180]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Mobile Tab Switcher */}
        <div className="flex items-center gap-3">
          {/* Mobile View Toggle (Map vs List) */}
          <div className="flex lg:hidden items-center p-1 bg-[#f8f4e3] dark:bg-[#131710] rounded-2xl border border-[#e6dfcb] dark:border-[#323d2b]">
            <button
              type="button"
              onClick={() => setMobileTab('map')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                mobileTab === 'map'
                  ? 'bg-[#2c3324] text-white'
                  : 'text-[#707666] hover:text-[#2c3324]'
              }`}
            >
              <MapTrifold weight="bold" className="h-4 w-4" />
              <span>Map</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('list')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                mobileTab === 'list'
                  ? 'bg-[#2c3324] text-white'
                  : 'text-[#707666] hover:text-[#2c3324]'
              }`}
            >
              <ListDashes weight="bold" className="h-4 w-4" />
              <span>List ({filteredEcclesias.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 lg:w-80">
            <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707666] dark:text-[#a3ab98]" />
            <input
              type="text"
              placeholder="Search by ecclesia, city, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-[#fefcf1] dark:bg-[#131710] border border-[#e6dfcb] dark:border-[#323d2b] rounded-2xl text-[#2c3324] dark:text-[#fefcf1] placeholder-[#707666] dark:placeholder-[#8a9180] focus:outline-none focus:border-[#e0a861] focus:ring-2 focus:ring-[#e0a861]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#707666] hover:text-[#2c3324] rounded-full hover:bg-black/5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Map & Directory Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Interactive Leaflet Map Canvas */}
        <div
          className={`lg:col-span-7 xl:col-span-8 rounded-3xl overflow-hidden border border-[#e6dfcb] dark:border-[#323d2b] shadow-xl relative bg-[#f8f4e3] dark:bg-[#131710] h-[550px] sm:h-[640px] ${
            mobileTab === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div ref={mapContainerRef} className="w-full h-full pcyc-map-container z-0" />

          {/* Map Top-Left Overlay Badge */}
          <div className="absolute top-4 left-4 z-[400] bg-white/95 dark:bg-[#1b2117]/95 backdrop-blur-md px-4 py-2 rounded-full border border-[#e6dfcb] dark:border-[#323d2b] shadow-lg flex items-center gap-2.5 text-xs font-bold text-[#2c3324] dark:text-[#fefcf1]">
            <Compass weight="duotone" className="h-4 w-4 text-[#e0a861]" />
            <span>{filteredEcclesias.length} Gathering{filteredEcclesias.length !== 1 ? 's' : ''} Pinned</span>
          </div>

          {/* Map Bottom-Left Legend */}
          <div className="absolute bottom-4 left-4 z-[400] bg-white/95 dark:bg-[#1b2117]/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#e6dfcb] dark:border-[#323d2b] shadow-lg hidden sm:flex items-center gap-4 text-[11px] font-semibold text-[#505748] dark:text-[#a3ab98]">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e0a861] border border-[#2c3324]" />
              <span>Luzon</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d97706] border border-[#2c3324]" />
              <span>Visayas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#059669] border border-[#2c3324]" />
              <span>Mindanao</span>
            </div>
          </div>
        </div>

        {/* Right Scrollable Directory Cards Sidebar */}
        <div
          className={`lg:col-span-5 xl:col-span-4 space-y-4 max-h-[640px] flex flex-col ${
            mobileTab === 'map' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Header Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] shadow-sm space-y-1">
            <h3 className="font-serif font-bold text-xl text-[#2c3324] dark:text-[#fefcf1] flex items-center justify-between">
              <span>Ecclesia Directory</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#e0a861]/20 text-[#9a6423] dark:text-[#f0be7c]">
                {filteredEcclesias.length} Active
              </span>
            </h3>
            <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
              Select any ecclesia to center on the map and view fellowship schedules.
            </p>
          </div>

          {/* Scrollable Ecclesias Cards */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[540px]">
            {filteredEcclesias.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#1b2117] rounded-3xl border border-[#e6dfcb] dark:border-[#323d2b] space-y-2 shadow-sm">
                <MapPin className="h-8 w-8 text-[#9a6423] dark:text-[#f0be7c] mx-auto opacity-70" />
                <h4 className="font-serif font-bold text-base text-[#2c3324] dark:text-[#fefcf1]">
                  No gatherings found
                </h4>
                <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
                  No ecclesias match &ldquo;{searchQuery}&rdquo;. Try clearing filters.
                </p>
              </div>
            ) : (
              filteredEcclesias.map((ecc, idx) => {
                const isSelected = selectedEcclesiaId === ecc.id;
                const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${ecc.name} ${ecc.address} ${ecc.city} Philippines`
                )}`;

                return (
                  <div
                    key={ecc.id}
                    ref={(el) => {
                      if (el) sidebarItemsRef.current.set(ecc.id, el);
                    }}
                    onClick={() => handleSelectEcclesia(ecc, idx)}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer select-none space-y-3 ${
                      isSelected
                        ? 'bg-[#fbf1e2] dark:bg-[#252e1f] border-[#e0a861] shadow-md ring-2 ring-[#e0a861]/30'
                        : 'bg-white dark:bg-[#1b2117] border-[#e6dfcb] dark:border-[#323d2b] hover:border-[#e0a861]/60 hover:shadow-sm'
                    }`}
                  >
                    {/* Top Row: Region & City */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#e0a861]/15 text-[#9a6423] dark:text-[#f0be7c] border border-[#e0a861]/30">
                        {ecc.region}
                      </span>
                      <span className="text-xs font-semibold text-[#707666] dark:text-[#a3ab98]">
                        {ecc.city}
                      </span>
                    </div>

                    {/* Ecclesia Title */}
                    <h4 className="font-serif font-bold text-base text-[#2c3324] dark:text-[#fefcf1] leading-snug">
                      {ecc.name}
                    </h4>

                    {/* Address & Meeting Time */}
                    <div className="space-y-1.5 text-xs text-[#707666] dark:text-[#a3ab98]">
                      <div className="flex items-start gap-2">
                        <MapPin weight="duotone" className="h-4 w-4 text-[#e0a861] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{ecc.address}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock weight="duotone" className="h-4 w-4 text-[#e0a861] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{ecc.meetingSchedule}</span>
                      </div>
                      {ecc.contactPerson && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <User weight="duotone" className="h-3.5 w-3.5 text-[#e0a861] shrink-0" />
                          <span>Contact: {ecc.contactPerson}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2.5 flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/5 text-xs font-bold">
                      <span className="text-[#9a6423] dark:text-[#f0be7c] flex items-center gap-1.5">
                        <NavigationArrow weight="bold" className="h-3.5 w-3.5" />
                        <span>Focus on Map</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyEcclesiaDetails(ecc);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#2c3324] dark:text-[#fefcf1] flex items-center gap-1 transition-colors"
                        >
                          {copiedId === ecc.id ? (
                            <>
                              <Check weight="bold" className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-green-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy weight="bold" className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <a
                          href={mapSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded-xl bg-[#2c3324] dark:bg-[#e0a861] text-[#fefcf1] dark:text-[#131710] hover:opacity-90 flex items-center gap-1 transition-opacity"
                        >
                          <span>Directions</span>
                          <ArrowSquareOut weight="bold" className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
