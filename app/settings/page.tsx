import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/db/queries/users';
import { getCachedDisplayedEcclesias } from '@/lib/db/queries/cached';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsClientView } from '@/components/domain/settings/settings-client-view';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Account Settings',
  description: 'Manage your PCYC profile, password, contact details, and appearance preferences.',
};

export default async function SettingsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/login?redirectTo=/settings');
  }

  const ecclesias = await getCachedDisplayedEcclesias();

  return (
    <div className="flex flex-col w-full pb-16">
      <PageHeader
        badge="Account & Preferences"
        title="Settings & Profile"
        description="Manage your Christadelphian brotherhood information, password, and app appearance."
      />

      <section className="py-8 sm:py-12 bg-cream flex-1 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SettingsClientView profile={profile} ecclesias={ecclesias} />
        </div>
      </section>
    </div>
  );
}
