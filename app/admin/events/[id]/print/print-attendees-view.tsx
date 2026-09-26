'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPHP, formatEventSchedule } from '@/lib/utils';
import type { Event } from '@/lib/db/schema/events';
import type { AttendeeWithProfile } from '@/lib/db/queries/events';
import { Printer, ArrowLeft, Search, MapPin, Calendar } from 'lucide-react';

interface PrintAttendeesViewProps {
  event: Event;
  attendees: AttendeeWithProfile[];
}

export function PrintAttendeesView({ event, attendees }: PrintAttendeesViewProps) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [selectedEcclesia, setSelectedEcclesia] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const feeNum = Number(event.registrationFee || 0);
  const isPaidRegistration = (paymentOption: string, paymentStatus: string) =>
    paymentOption === 'FREE' || paymentStatus === 'PAID';

  // Extract unique sorted ecclesias from attendees
  const distinctEcclesias = Array.from(
    new Set(attendees.map((a) => (a.profile.ecclesia || 'Unspecified').trim()).filter(Boolean))
  ).sort();

  // Filter list by Payment Status, Ecclesia, and Search Query
  const filteredAttendees = attendees.filter(({ registration: reg, profile }) => {
    const isPaid = isPaidRegistration(reg.paymentOption, reg.paymentStatus);

    if (filterMode === 'PAID' && !isPaid) return false;
    if (filterMode === 'UNPAID' && isPaid) return false;

    if (selectedEcclesia !== 'ALL') {
      const userEcc = (profile.ecclesia || 'Unspecified').trim();
      if (userEcc !== selectedEcclesia) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = `${profile.firstName} ${profile.lastName}`.toLowerCase();
      const ecclesia = (profile.ecclesia || '').toLowerCase();
      const email = profile.email.toLowerCase();
      const ref = (reg.referenceNumber || '').toLowerCase();
      return name.includes(q) || ecclesia.includes(q) || email.includes(q) || ref.includes(q);
    }

    return true;
  });

  // Calculate statistics based on current active ecclesia filter
  const totalCount = attendees.length;
  const filteredTotalCount = filteredAttendees.length;
  const paidCount = filteredAttendees.filter(
    (a) => isPaidRegistration(a.registration.paymentOption, a.registration.paymentStatus)
  ).length;
  const unpaidCount = filteredTotalCount - paidCount;

  const totalCollected = paidCount * feeNum;
  const totalToCollect = unpaidCount * feeNum;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* High-Fidelity Multi-Page Print Rules */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm 10mm 10mm 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 9.5pt !important;
          }
          nav, header, footer, aside, .no-print, [data-sidebar], .print\\:hidden {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-border {
            border-color: #333333 !important;
          }
        }
      `}} />

      {/* Screen-Only Controls */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1b2117] p-5 rounded-2xl border border-[#e6dfcb] dark:border-[#323d2b] shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/events/${event.id}/attendees`}
                className="text-xs text-[#707666] dark:text-[#a3ab98] hover:text-[#2c3324] dark:hover:text-[#fefcf1] inline-flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Attendees List</span>
              </Link>
            </div>
            <h1 className="font-serif text-xl font-bold text-[#2c3324] dark:text-[#fefcf1]">
              Printable Event Attendee & Signature Sheet
            </h1>
            <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
              Multi-page print roster for on-site registration desk validation and physical signature signing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handlePrint}
              className="gap-2 shadow-sm font-bold bg-[#2c3324] dark:bg-[#e0a861] text-[#fefcf1] dark:text-[#1b2117]"
            >
              <Printer className="h-4 w-4" />
              <span>Print Sheet (A4 Landscape)</span>
            </Button>
          </div>
        </div>

        {/* Filter Pills, Ecclesia Dropdown & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'ALL'
                  ? 'bg-[#2c3324] dark:bg-[#e0a861] text-[#fefcf1] dark:text-[#1b2117]'
                  : 'bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] text-[#505748] dark:text-[#a3ab98] hover:bg-[#f8f4e3] dark:hover:bg-[#252e1f]'
              }`}
            >
              📋 All ({filteredTotalCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('PAID')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'PAID'
                  ? 'bg-[#2c3324] dark:bg-[#e0a861] text-[#fefcf1] dark:text-[#1b2117]'
                  : 'bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] text-[#505748] dark:text-[#a3ab98] hover:bg-[#f8f4e3] dark:hover:bg-[#252e1f]'
              }`}
            >
              💳 Paid Online / Free ({paidCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('UNPAID')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'UNPAID'
                  ? 'bg-[#2c3324] dark:bg-[#e0a861] text-[#fefcf1] dark:text-[#1b2117]'
                  : 'bg-white dark:bg-[#1b2117] border border-[#e6dfcb] dark:border-[#323d2b] text-[#505748] dark:text-[#a3ab98] hover:bg-[#f8f4e3] dark:hover:bg-[#252e1f]'
              }`}
            >
              🏢 Venue Collection ({unpaidCount})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Ecclesia Filter Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="ecclesia-filter" className="text-xs font-semibold text-[#505748] dark:text-[#a3ab98] whitespace-nowrap">
                Ecclesia:
              </label>
              <select
                id="ecclesia-filter"
                value={selectedEcclesia}
                onChange={(e) => setSelectedEcclesia(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#131710] dark:text-[#fefcf1] font-semibold focus:outline-none focus:ring-1 focus:ring-[#2c3324] dark:focus:ring-[#e0a861] cursor-pointer"
              >
                <option value="ALL">All Ecclesias ({totalCount})</option>
                {distinctEcclesias.map((ecc) => {
                  const count = attendees.filter((a) => (a.profile.ecclesia || 'Unspecified').trim() === ecc).length;
                  return (
                    <option key={ecc} value={ecc}>
                      {ecc} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Name/Email Search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#707666] dark:text-[#a3ab98]" />
              <input
                type="text"
                placeholder="Search name, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#131710] dark:text-[#fefcf1] focus:outline-none focus:ring-1 focus:ring-[#2c3324] dark:focus:ring-[#e0a861]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="print-container bg-white dark:bg-[#1b2117] p-8 rounded-2xl border border-[#e6dfcb] dark:border-[#323d2b] shadow-sm print:shadow-none print:border-none print:p-0 space-y-5">
        {/* Printable Header */}
        <div className="border-b-2 border-[#2c3324] dark:border-[#e0a861] print:border-black pb-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#9a6423] dark:text-[#f0be7c] print:text-black tracking-widest uppercase block">
                PHILIPPINE CHRISTADELPHIAN YOUTH CIRCLE (PCYC) &bull; OFFICIAL EVENT ROSTER
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2c3324] dark:text-[#fefcf1] print:text-black">
                {event.title}
              </h2>
              {event.theme && (
                <p className="text-xs italic text-[#505748] dark:text-[#a3ab98] print:text-gray-700 font-serif">
                  &ldquo;{event.theme}&rdquo;
                </p>
              )}
            </div>
            <div className="text-right text-xs text-[#707666] dark:text-[#a3ab98] print:text-black font-mono">
              <span className="block font-bold text-[#2c3324] dark:text-[#fefcf1] print:text-black">REGISTRATION DESK MANIFEST</span>
              <span>Generated: {new Date().toLocaleDateString('en-PH', { dateStyle: 'medium' })}</span>
              {selectedEcclesia !== 'ALL' && (
                <span className="block font-bold text-[#9a6423] print:text-black uppercase text-[10px] mt-0.5">
                  Filter: {selectedEcclesia}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#505748] dark:text-[#a3ab98] print:text-black pt-2 border-t border-[#e6dfcb] dark:border-[#323d2b] print:border-gray-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#2c3324] dark:text-[#e0a861] print:text-black" />
                <strong>{formatEventSchedule(event.startDate, event.endDate)}</strong>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#2c3324] dark:text-[#e0a861] print:text-black" />
                <strong>{event.location}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Standard Fee: <strong>{feeNum === 0 ? 'Free Admission' : formatPHP(feeNum)}</strong>
              </span>
              {selectedEcclesia !== 'ALL' && (
                <>
                  <span>&bull;</span>
                  <span className="font-bold text-[#2c3324] dark:text-[#e0a861] print:text-black uppercase">
                    Ecclesia: {selectedEcclesia}
                  </span>
                </>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-3 font-semibold text-xs">
              <span className="px-2 py-0.5 rounded bg-[#f8f4e3] dark:bg-[#252e1f] border border-[#e6dfcb] dark:border-[#323d2b] text-[#2c3324] dark:text-[#fefcf1] print:bg-gray-100 print:text-black print:border-black">
                Attendees: <strong>{filteredAttendees.length}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#e8f5e9] dark:bg-[#1f3a23] border border-[#c8e6c9] dark:border-[#2e7d32]/40 text-[#2e7d32] dark:text-[#81c784] print:bg-gray-100 print:text-black print:border-black">
                Paid: <strong>{paidCount}</strong> ({formatCurrency(totalCollected)})
              </span>
              {unpaidCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-[#fff8e1] dark:bg-[#3d2e08] border border-[#ffe082] dark:border-[#b78103]/40 text-[#b78103] dark:text-[#ffd54f] print:bg-gray-100 print:text-black print:border-black">
                  To Collect: <strong>{unpaidCount}</strong> ({formatCurrency(totalToCollect)})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Table of Attendees */}
        {filteredAttendees.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#707666] dark:text-[#a3ab98]">
            No attendees found matching the selected filter criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#2c3324] dark:border-[#e0a861] print:border-black text-[#2c3324] dark:text-[#fefcf1] print:text-black uppercase tracking-wider font-bold text-[10px] bg-[#faf7ec] dark:bg-[#252e1f] print:bg-gray-100">
                <th className="py-2 px-1.5 w-8 text-center border-r border-gray-200 print:border-black">#</th>
                <th className="py-2 px-2 w-28 text-center border-r border-gray-200 print:border-black">Signature / Check-in</th>
                <th className="py-2 px-2 border-r border-gray-200 print:border-black">Attendee Name & Designation</th>
                <th className="py-2 px-2 border-r border-gray-200 print:border-black">Ecclesia & Contact</th>
                <th className="py-2 px-2 border-r border-gray-200 print:border-black">Payment Option</th>
                <th className="py-2 px-2 text-center border-r border-gray-200 print:border-black">Payment Status</th>
                <th className="py-2 px-2 text-right border-r border-gray-200 print:border-black">Fee Due</th>
                <th className="py-2 px-2">Dietary / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6dfcb] dark:divide-[#323d2b] print:divide-gray-400">
              {filteredAttendees.map(({ registration: reg, profile }, idx) => {
                const isPaid = isPaidRegistration(reg.paymentOption, reg.paymentStatus);
                const isGcash = reg.paymentOption === 'GCASH';
                const isFree = reg.paymentOption === 'FREE';

                return (
                  <tr
                    key={reg.id}
                    className={
                      idx % 2 === 0
                        ? 'bg-white dark:bg-[#1b2117] print:bg-white'
                        : 'bg-[#faf7ec]/60 dark:bg-[#20271b] print:bg-gray-50'
                    }
                  >
                    {/* Index Number */}
                    <td className="py-2.5 px-1.5 text-center font-mono text-[#707666] dark:text-[#a3ab98] print:text-black align-middle border-r border-gray-100 print:border-gray-300">
                      {idx + 1}
                    </td>

                    {/* Signature Box */}
                    <td className="py-1 px-2 text-center align-middle border-r border-gray-100 print:border-gray-300">
                      <div className="h-7 w-24 border border-dashed border-gray-400 print:border-black print:border-solid rounded mx-auto" />
                    </td>

                    {/* Name & Designation */}
                    <td className="py-2.5 px-2 align-middle border-r border-gray-100 print:border-gray-300">
                      <strong className="text-[#2c3324] dark:text-[#fefcf1] print:text-black block text-[11px] font-bold">
                        {profile.firstName} {profile.lastName}
                      </strong>
                      <span className="text-[9px] text-[#707666] dark:text-[#a3ab98] print:text-gray-600 font-semibold uppercase">
                        {profile.designation}
                      </span>
                    </td>

                    {/* Ecclesia & Contact Number */}
                    <td className="py-2.5 px-2 align-middle text-[#505748] dark:text-[#a3ab98] print:text-gray-800 border-r border-gray-100 print:border-gray-300">
                      <div className="font-medium text-[11px] text-[#2c3324] dark:text-[#fefcf1] print:text-black">
                        {profile.ecclesia || 'Philippine Ecclesia'}
                      </div>
                      <div className="text-[9px] text-[#707666] dark:text-[#a3ab98] print:text-gray-600 font-mono">
                        {profile.phoneNumber || profile.email}
                      </div>
                    </td>

                    {/* Payment Details */}
                    <td className="py-2.5 px-2 align-middle font-mono text-[10px] border-r border-gray-100 print:border-gray-300">
                      <div className="font-semibold text-[#2c3324] dark:text-[#fefcf1] print:text-black">
                        {isFree ? 'FREE' : isGcash ? 'GCash' : 'Venue Desk'}
                      </div>
                      {reg.referenceNumber && (
                        <div className="text-[9px] text-[#2e7d32] dark:text-[#81c784] print:text-black font-bold truncate max-w-[100px]">
                          Ref: {reg.referenceNumber}
                        </div>
                      )}
                    </td>

                    {/* Payment Status / Checkbox on Print */}
                    <td className="py-2.5 px-2 text-center align-middle whitespace-nowrap border-r border-gray-100 print:border-gray-300">
                      {isPaid ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#e8f5e9] dark:bg-[#1f3a23] text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/40 print:border-black print:text-black print:bg-transparent">
                          ✓ PAID
                        </span>
                      ) : (
                        <div>
                          {/* Screen UI Badge */}
                          <span className="print:hidden inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#fff8e1] dark:bg-[#3d2e08] text-[#b78103] dark:text-[#ffd54f] border border-[#ffe082] dark:border-[#b78103]/40">
                            ⚠ Pay in Venue (Unpaid)
                          </span>
                          {/* Printed checkbox lets the receiving committee mark venue payment received. */}
                          <div className="hidden print:flex items-center justify-center gap-1.5 text-black">
                            <span className="h-3.5 w-3.5 border-2 border-black inline-block rounded-xs shrink-0" />
                            <span className="text-[8.5px] font-bold font-mono">
                              [ ] PAID AT DESK {feeNum > 0 ? formatPHP(feeNum) : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Amount Due */}
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-[#2c3324] dark:text-[#fefcf1] print:text-black align-middle whitespace-nowrap border-r border-gray-100 print:border-gray-300">
                      {feeNum === 0 ? 'FREE' : formatPHP(feeNum)}
                    </td>

                    {/* Notes & Special Diet */}
                    <td className="py-2.5 px-2 align-middle text-[9px] text-[#707666] dark:text-[#a3ab98] print:text-gray-700 max-w-[140px] truncate">
                      {reg.specialRequirements || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Printable Footer / Sign-off */}
        <div className="avoid-break pt-6 border-t-2 border-[#2c3324] dark:border-[#e0a861] print:border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-[#707666] dark:text-[#a3ab98] print:text-black">
          <div className="space-y-1">
            <span className="font-bold text-[#2c3324] dark:text-[#fefcf1] print:text-black">
              PCYC Event Registration & Finance Team
            </span>
            <p className="text-[10px] print:text-gray-700">
              Verified on-site check-in roster. Retain this signed document for ecclesial accounting records.
            </p>
          </div>

          <div className="flex items-center gap-8 text-right">
            <div className="border-t border-[#707666] dark:border-[#5a6350] print:border-black pt-1 w-44 text-center">
              <span className="text-[10px] block">Registration Desk Officer</span>
              <span className="text-[9px] text-[#8a9180] dark:text-[#a3ab98] print:text-gray-600">Signature over Printed Name</span>
            </div>
            <div className="border-t border-[#707666] dark:border-[#5a6350] print:border-black pt-1 w-44 text-center">
              <span className="text-[10px] block">Event Treasurer / Auditor</span>
              <span className="text-[9px] text-[#8a9180] dark:text-[#a3ab98] print:text-gray-600">Signature over Printed Name</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
