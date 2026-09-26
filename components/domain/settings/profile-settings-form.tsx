'use client';

import React, { useActionState, useState } from 'react';
import { updateProfileAction, type ProfileActionState } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/molecules/user-avatar';
import { Mail, Phone, Church, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { Profile } from '@/lib/db/schema/users';
import type { Ecclesia } from '@/lib/db/schema/ecclesias';
import { formatDateForDateInput } from '@/lib/utils';

export interface ProfileSettingsFormProps {
  profile: Profile;
  ecclesias: Ecclesia[];
}

const initialState: ProfileActionState = {
  success: false,
};

export function ProfileSettingsForm({ profile, ecclesias }: ProfileSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);
  const [designation, setDesignation] = useState<'BROTHER' | 'SISTER' | 'FRIEND'>(
    profile.designation || 'FRIEND'
  );

  const isBaptized = designation === 'BROTHER' || designation === 'SISTER';

  return (
    <form action={formAction} className="space-y-6">
      {/* Alert Messages */}
      {state.success && state.message && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {state.error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Header Avatar Summary */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8f4e3] dark:bg-[#1d2419] border border-[#e6dfcb] dark:border-[#323d2b]">
        <UserAvatar
          firstName={profile.firstName}
          lastName={profile.lastName}
          designation={profile.designation}
          size="lg"
        />
        <div className="space-y-0.5">
          <h3 className="font-serif font-bold text-base text-[#2c3324] dark:text-[#fefcf1]">
            {profile.firstName} {profile.lastName}
          </h3>
          <p className="text-xs text-[#707666] dark:text-[#a3ab98] flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            <span>{profile.email}</span>
          </p>
          <div className="pt-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2c3324] text-[#e0a861] dark:bg-[#e0a861] dark:text-[#131710]">
              {profile.role}
            </span>
          </div>
        </div>
      </div>

      {/* Name Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* First Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="firstName"
            className="block text-xs font-bold uppercase tracking-wider text-[#505748] dark:text-[#a3ab98]"
          >
            First Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            defaultValue={profile.firstName}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#1b2117] text-[#2c3324] dark:text-[#fefcf1] focus:outline-none focus:ring-2 focus:ring-[#2c3324]/20 dark:focus:ring-[#e0a861]/30 focus:border-[#2c3324] dark:focus:border-[#e0a861]"
          />
          {state.fieldErrors?.firstName && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{state.fieldErrors.firstName[0]}</p>
          )}
        </div>

        {/* Middle Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="middleName"
            className="block text-xs font-bold uppercase tracking-wider text-[#505748] dark:text-[#a3ab98]"
          >
            Middle Name
          </label>
          <input
            id="middleName"
            name="middleName"
            type="text"
            defaultValue={profile.middleName || ''}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#1b2117] text-[#2c3324] dark:text-[#fefcf1] focus:outline-none focus:ring-2 focus:ring-[#2c3324]/20 dark:focus:ring-[#e0a861]/30 focus:border-[#2c3324] dark:focus:border-[#e0a861]"
          />
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="lastName"
            className="block text-xs font-bold uppercase tracking-wider text-[#505748] dark:text-[#a3ab98]"
          >
            Last Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            defaultValue={profile.lastName}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#1b2117] text-[#2c3324] dark:text-[#fefcf1] focus:outline-none focus:ring-2 focus:ring-[#2c3324]/20 dark:focus:ring-[#e0a861]/30 focus:border-[#2c3324] dark:focus:border-[#e0a861]"
          />
          {state.fieldErrors?.lastName && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{state.fieldErrors.lastName[0]}</p>
          )}
        </div>
      </div>

      {/* Designation Selector */}
      <div className="space-y-1.5">
        <label
          htmlFor="designation"
          className="block text-xs font-bold uppercase tracking-wider text-[#505748] dark:text-[#a3ab98]"
        >
          Designation <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['BROTHER', 'SISTER', 'FRIEND'] as const).map((des) => {
            const isSelected = designation === des;
            return (
              <label
                key={des}
                className={`flex items-center justify-center p-3 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#2c3324] text-[#e0a861] border-[#2c3324] dark:bg-[#e0a861] dark:text-[#131710] dark:border-[#e0a861] shadow-xs'
                    : 'bg-white dark:bg-[#1b2117] text-[#505748] dark:text-[#a3ab98] border-[#e6dfcb] dark:border-[#323d2b] hover:bg-[#f8f4e3] dark:hover:bg-[#20271c]'
                }`}
              >
                <input
                  type="radio"
                  name="designation"
                  value={des}
                  checked={isSelected}
                  onChange={() => setDesignation(des)}
                  className="sr-only"
                />
                <span>
                  {des === 'BROTHER' ? 'Brother' : des === 'SISTER' ? 'Sister' : 'Friend / Contact'}
                </span>
              </label>
            );
          })}
        </div>
        {state.fieldErrors?.designation && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{state.fieldErrors.designation[0]}</p>
        )}
      </div>

      {/* Ecclesia and Baptism Date Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ecclesia */}
        <div className="space-y-1.5">
          <label
            htmlFor="ecclesia"
            className="block text-xs font-bold uppercase tracking-wider text-[#505748] dark:text-[#a3ab98]"
          >
            Christadelphian Ecclesia
          </label>
          <div className="relative">
            <Church className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707666] dark:text-[#a3ab98]" />
            <select
              id="ecclesia"
              name="ecclesia"
              defaultValue={profile.ecclesia || ''}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#1b2117] text-[#2c3324] dark:text-[#fefcf1] focus:outline-none focus:ring-2 focus:ring-[#2c3324]/20 dark:focus:ring-[#e0a861]/30 focus:border-[#2c3324] dark:focus:border-[#e0a861]"
            >
              <option value="">Select your home Ecclesia...</option>
              {ecclesias.map((ecc) => (
                <option key={ecc.id} value={ecc.name}>
                  {ecc.name} {ecc.city ? `(${ecc.city}, ${ecc.region})` : ''}
                </option>
              ))}
              <option value="Other Ecclesia / International">Other Ecclesia / International</option>
            </select>
          </div>
          {state.fieldErrors?.ecclesia && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{state.fieldErrors.ecclesia[0]}</p>
          )}
        </div>

        {/* Baptism Date */}
        <div className="space-y-1.5">
          <label
            htmlFor="baptismDate"
            className="block text-xs font-bold uppercase tracking-wider text-[#505748] dark:text-[#a3ab98]"
          >
            Baptism Date {isBaptized && <span className="text-rose-500">*</span>}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707666] dark:text-[#a3ab98]" />
            <input
              id="baptismDate"
              name="baptismDate"
              type="date"
              required={isBaptized}
              defaultValue={profile.baptismDate ? formatDateForDateInput(profile.baptismDate) : ''}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#1b2117] text-[#2c3324] dark:text-[#fefcf1] focus:outline-none focus:ring-2 focus:ring-[#2c3324]/20 dark:focus:ring-[#e0a861]/30 focus:border-[#2c3324] dark:focus:border-[#e0a861]"
            />
          </div>
          {state.fieldErrors?.baptismDate && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{state.fieldErrors.baptismDate[0]}</p>
          )}
        </div>
      </div>

      {/* Contact Phone Number */}
      <div className="space-y-1.5">
        <label
          htmlFor="phoneNumber"
          className="block text-xs font-bold uppercase tracking-wider text-[#505748] dark:text-[#a3ab98]"
        >
          Contact Mobile Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707666] dark:text-[#a3ab98]" />
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="e.g. 09123456789 or +639123456789"
            defaultValue={profile.phoneNumber || ''}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#e6dfcb] dark:border-[#323d2b] bg-white dark:bg-[#1b2117] text-[#2c3324] dark:text-[#fefcf1] placeholder:text-[#8a9180] focus:outline-none focus:ring-2 focus:ring-[#2c3324]/20 dark:focus:ring-[#e0a861]/30 focus:border-[#2c3324] dark:focus:border-[#e0a861]"
          />
        </div>
        <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
          This phone number will be pre-filled automatically when you order merchandise or register for youth camps.
        </p>
        {state.fieldErrors?.phoneNumber && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{state.fieldErrors.phoneNumber[0]}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-[#e6dfcb] dark:border-[#323d2b] flex items-center justify-end">
        <Button
          type="submit"
          variant="secondary"
          disabled={isPending}
          className="gap-2 px-6"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <span>Save Profile Changes</span>
          )}
        </Button>
      </div>
    </form>
  );
}
