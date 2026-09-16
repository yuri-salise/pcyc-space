import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Mail, MapPin } from 'lucide-react';
import { getCachedDisplayedEcclesias } from '@/lib/db/queries/cached';

export async function Footer() {
  const ecclesiasList = await getCachedDisplayedEcclesias();

  // Dynamically build location summary from live database ecclesias (Zero Mock Data)
  const placeNames = ecclesiasList
    .slice(0, 4)
    .map((e) => e.city || e.name.replace(/\s*Ecclesia$/i, ''))
    .filter(Boolean);

  const placeSummary =
    placeNames.length > 0
      ? `${placeNames.join(' • ')} • Nationwide Ecclesias`
      : 'Nationwide Philippine Ecclesias';

  return (
    <footer className="bg-[#2c3324] text-[#fefcf1] border-t border-[#3d4632] mt-auto">
      {/* Top Banner / Scripture Inspiration */}
      <div className="border-b border-[#3d4632] bg-[#22281c] py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#e0a861] animate-pulse" />
            <p className="text-sm font-serif italic text-[#f8f4e3]/90">
              &ldquo;Remember now thy Creator in the days of thy youth...&rdquo;
            </p>
          </div>
          <span className="text-xs tracking-wider uppercase text-[#e0a861] font-semibold">
            Ecclesiastes 12:1
          </span>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-white/10 p-1 flex items-center justify-center border border-[#e0a861]/30">
                <Image
                  src="/images/logo/pcyc-transparent-logo.png"
                  alt="PCYC Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="font-serif font-bold text-xl text-[#fefcf1]">
                PCYC Space
              </span>
            </div>
            <p className="text-sm text-[#f8f4e3]/75 max-w-md leading-relaxed">
              Philippine Christadelphian Youth Circle is the united fellowship of
              brothers, sisters, and friends across the Philippine ecclesias. We gather
              to study the Scriptures, build lifelong friendships, and serve in Christ.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#e0a861]">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{placeSummary}</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-serif font-semibold text-sm uppercase tracking-wider text-[#e0a861]">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-[#f8f4e3]/80">
              <li>
                <Link href="/" className="hover:text-[#e0a861] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#e0a861] transition-colors">
                  About PCYC & History
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-[#e0a861] transition-colors">
                  Youth Camps & Events
                </Link>
              </li>
              <li>
                <Link href="/merch" className="hover:text-[#e0a861] transition-colors">
                  Fundraising Merch
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Community & Connect */}
          <div className="space-y-3">
            <h4 className="font-serif font-semibold text-sm uppercase tracking-wider text-[#e0a861]">
              Community
            </h4>
            <ul className="space-y-2 text-sm text-[#f8f4e3]/80">
              <li>
                <Link href="/register" className="hover:text-[#e0a861] transition-colors">
                  Join as Member / Friend
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#e0a861] transition-colors">
                  Member Portal Login
                </Link>
              </li>
              <li className="pt-2">
                <a
                  href="mailto:bumadillal@gmail.com"
                  className="inline-flex items-center gap-1.5 text-xs text-[#e0a861] hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>bumadillal@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#3d4632] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#f8f4e3]/60">
          <p>© {new Date().getFullYear()} Philippine Christadelphian Youth Circle. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="h-3 w-3 text-[#e0a861] fill-current" /> for the brotherhood
          </p>
        </div>
      </div>
    </footer>
  );
}
