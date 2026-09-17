import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUserProfile, getUserProfileById, getUserAuditHistory } from '@/lib/db/queries/users';
import { getUserOrders } from '@/lib/db/queries/orders';
import { getUserEventRegistrations } from '@/lib/db/queries/events';
import { getAllEcclesias } from '@/lib/db/queries/ecclesias';
import { EditUserForm } from './edit-user-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { maskEmail } from '@/lib/security/privacy';
import { formatDateOnly } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  ShoppingBag,
  Shield,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Member Profile & Audit Trail | PCYC Admin',
  description: 'Inspect member activity, orders, event registrations, and security audit log.',
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentAdmin = await getCurrentUserProfile();
  if (!currentAdmin || (currentAdmin.role !== 'ADMIN' && currentAdmin.role !== 'SUPERADMIN')) {
    redirect('/portal');
  }

  const { id: userId } = await params;
  const targetUser = await getUserProfileById(userId);

  if (!targetUser) {
    notFound();
  }

  const [ordersList, registrationsList, auditHistory, ecclesias] = await Promise.all([
    getUserOrders(userId),
    getUserEventRegistrations(userId),
    getUserAuditHistory(userId, 15),
    getAllEcclesias(),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#e0a861] hover:text-[#f0be7c] transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to User Directory</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-bold text-[#2c3324] dark:text-[#fefcf1]">
                {targetUser.firstName} {targetUser.middleName ? `${targetUser.middleName} ` : ''}
                {targetUser.lastName}
              </h1>
              <Badge
                variant={
                  targetUser.role === 'SUPERADMIN'
                    ? 'gold'
                    : targetUser.role === 'ADMIN'
                    ? 'forest'
                    : 'cream'
                }
                size="md"
              >
                {targetUser.role}
              </Badge>
              <Badge
                variant={
                  targetUser.status === 'ACTIVE'
                    ? 'success'
                    : targetUser.status === 'SUSPENDED'
                    ? 'destructive'
                    : 'cream'
                }
                size="md"
              >
                {targetUser.status}
              </Badge>
            </div>
            <p className="text-xs text-[#707666] dark:text-[#a3ab98] mt-1 font-mono">
              Account ID: {targetUser.id} &bull; Member since{' '}
              {new Date(targetUser.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <EditUserForm
            user={targetUser}
            ecclesiasList={ecclesias}
            isSuperAdmin={currentAdmin.role === 'SUPERADMIN'}
          />

          {/* Event Registrations */}
          <Card className="bg-white dark:bg-[#1b2117] border-[#e6dfcb] dark:border-[#323d2b]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-[#2c3324] dark:text-[#fefcf1]">
                <Calendar className="h-5 w-5 text-[#e0a861]" />
                <CardTitle className="text-lg">Event & Camp Registrations ({registrationsList.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {registrationsList.length === 0 ? (
                <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
                  No camp registrations found for this user.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {registrationsList.map(({ registration, event }) => (
                    <div
                      key={registration.id}
                      className="p-3 rounded-xl bg-[#f8f4e3] dark:bg-[#131710] border border-[#e6dfcb] dark:border-[#323d2b] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#2c3324] dark:text-[#fefcf1]">{event.title}</p>
                        <p className="text-[11px] text-[#707666] dark:text-[#a3ab98] mt-0.5">
                          {event.location} &bull; {formatDateOnly(event.startDate)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          registration.paymentStatus === 'CONFIRMED' || registration.paymentStatus === 'FREE'
                            ? 'success'
                            : 'cream'
                        }
                        size="sm"
                      >
                        {registration.paymentOption} ({registration.paymentStatus})
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Merchandise Orders */}
          <Card className="bg-white dark:bg-[#1b2117] border-[#e6dfcb] dark:border-[#323d2b]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-[#2c3324] dark:text-[#fefcf1]">
                <ShoppingBag className="h-5 w-5 text-[#e0a861]" />
                <CardTitle className="text-lg">Merchandise Orders ({ordersList.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {ordersList.length === 0 ? (
                <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
                  No merchandise orders placed by this user.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {ordersList.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 rounded-xl bg-[#f8f4e3] dark:bg-[#131710] border border-[#e6dfcb] dark:border-[#323d2b] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#2c3324] dark:text-[#fefcf1]">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-[11px] text-[#707666] dark:text-[#a3ab98] mt-0.5">
                          {order.items.length} item(s) &bull; Total: ₱{Number(order.totalAmount).toFixed(2)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          order.status === 'PAID'
                            ? 'success'
                            : order.status === 'VERIFICATION_QUEUED'
                            ? 'gold'
                            : 'cream'
                        }
                        size="sm"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security & Audit History */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-[#1b2117] border-[#e6dfcb] dark:border-[#323d2b]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-[#2c3324] dark:text-[#fefcf1]">
                <Shield className="h-5 w-5 text-[#e0a861]" />
                <CardTitle className="text-lg">Privacy & Audit Log</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Non-repudiable log of administrative actions regarding this user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditHistory.length === 0 ? (
                <p className="text-xs text-[#707666] dark:text-[#a3ab98]">
                  No audit trail recorded yet.
                </p>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e6dfcb] dark:before:bg-[#323d2b]">
                  {auditHistory.map((log) => (
                    <div key={log.id} className="relative pl-7 text-xs space-y-0.5">
                      <div className="absolute left-2 top-1 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[#e0a861] ring-4 ring-white dark:ring-[#1b2117]" />
                      <p className="font-bold text-[#2c3324] dark:text-[#fefcf1]">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-[#707666] dark:text-[#a3ab98]">
                        By: <span className="font-mono">{maskEmail(log.actorEmail)}</span>
                      </p>
                      <p className="text-[10px] text-[#8a9180]">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
