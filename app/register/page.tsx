import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RegisterForm } from '@/components/domain/auth/register-form';
import { getCachedDisplayedEcclesias } from '@/lib/db/queries/cached';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Register Member Account',
  description: 'Join the Philippine Christadelphian Youth Circle community platform.',
};

export default async function RegisterPage() {
  const displayedEcclesias = await getCachedDisplayedEcclesias();

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cream">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center">
            <div className="h-14 w-14 rounded-2xl bg-[#2c3324] p-2 flex items-center justify-center shadow-md">
              <Image
                src="/images/logo/pcyc-transparent-logo.png"
                alt="PCYC Logo"
                width={44}
                height={44}
                className="object-contain"
              />
            </div>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2c3324] dark:text-[#fefcf1]">
            Join PCYC Fellowship
          </h1>
          <p className="text-xs sm:text-sm text-[#707666] dark:text-[#a3ab98]">
            Create your account to register for camps, study circles, and stay connected.
          </p>
        </div>

        {/* Dynamic Registration Form with live DB ecclesias */}
        <RegisterForm ecclesias={displayedEcclesias} />
      </div>
    </div>
  );
}
