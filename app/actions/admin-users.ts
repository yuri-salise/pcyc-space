'use server';

import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { profiles, type UserRole, type UserStatus } from '@/lib/db/schema/users';
import { auditLogs } from '@/lib/db/schema/audit-logs';
import { getCurrentUserProfile, getUserProfileById } from '@/lib/db/queries/users';
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminChangeRoleSchema,
  adminToggleStatusSchema,
} from '@/lib/validators';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { CACHE_TAGS, invalidateCacheTag } from '@/lib/db/queries/cached';
import { eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';

export interface AdminUserActionResult {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Creates an authorized Supabase Admin client using the private Service Role Key.
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role configuration missing on server.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Extracts client IP and User Agent for audit trail non-repudiation.
 */
async function getAuditContext() {
  try {
    const headersList = await headers();
    const cfConnectingIp = headersList.get('cf-connecting-ip');
    const xForwardedFor = headersList.get('x-forwarded-for');
    const clientIp = cfConnectingIp || (xForwardedFor ? xForwardedFor.split(',')[0].trim() : '127.0.0.1');
    const userAgent = headersList.get('user-agent') || 'Unknown';
    return { clientIp, userAgent };
  } catch {
    return { clientIp: '127.0.0.1', userAgent: 'Server' };
  }
}

/**
 * Server Action for Admins to create and provision a new member or administrator.
 */
export async function adminCreateUserAction(
  prevState: AdminUserActionResult,
  formData: FormData
): Promise<AdminUserActionResult> {
  try {
    const admin = await getCurrentUserProfile();
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN')) {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }

    const requestedRole = (formData.get('role') as UserRole) || 'MEMBER';
    if ((requestedRole === 'ADMIN' || requestedRole === 'SUPERADMIN') && admin.role !== 'SUPERADMIN') {
      return { success: false, error: 'Only Superadministrators can create administrative accounts.' };
    }

    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
      firstName: formData.get('firstName'),
      middleName: formData.get('middleName') || undefined,
      lastName: formData.get('lastName'),
      designation: formData.get('designation'),
      ecclesia: formData.get('ecclesia') || undefined,
      baptismDate: formData.get('baptismDate') || undefined,
      phoneNumber: formData.get('phoneNumber') || undefined,
      role: requestedRole,
    };

    const parsed = adminCreateUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Please correct the errors in the form.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { data } = parsed;
    const supabaseAdmin = getSupabaseAdmin();
    const auditContext = await getAuditContext();

    // 1. Create user in Supabase Auth Admin
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        firstName: data.firstName,
        lastName: data.lastName,
        designation: data.designation,
        ecclesia: data.ecclesia,
        role: data.role,
      },
      app_metadata: {
        role: data.role,
      },
    });

    if (authError || !authUser?.user) {
      logger.warn({ error: authError?.message }, 'Failed to create user in Supabase Auth');
      return {
        success: false,
        error: authError?.message || 'Failed to create user account.',
      };
    }

    // 2. Insert Profile in Postgres DB
    try {
      await db.insert(profiles).values({
        id: authUser.user.id,
        email: data.email,
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        designation: data.designation,
        ecclesia: data.ecclesia || null,
        baptismDate: data.baptismDate || null,
        phoneNumber: data.phoneNumber || null,
        role: data.role,
        status: 'ACTIVE',
      });

      // 3. Log Audit Event
      await db.insert(auditLogs).values({
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'USER_CREATED',
        targetId: authUser.user.id,
        targetType: 'USER',
        details: {
          email: data.email,
          role: data.role,
          designation: data.designation,
          ecclesia: data.ecclesia,
        },
        ipAddress: auditContext.clientIp,
        userAgent: auditContext.userAgent,
      });

      logger.info(
        { targetUserId: authUser.user.id, adminId: admin.id, role: data.role },
        'User provisioned by administrator'
      );

      invalidateCacheTag(CACHE_TAGS.adminMetrics, CACHE_TAGS.users);
      revalidatePath('/admin/users');
      revalidatePath('/admin');

      return {
        success: true,
        message: `User ${data.firstName} ${data.lastName} (${data.email}) created successfully!`,
      };
    } catch (dbErr: any) {
      // Rollback Supabase user if DB insert fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      logger.error({ error: dbErr?.message }, 'Failed to insert profile record during admin creation');
      return {
        success: false,
        error: dbErr?.message?.includes('duplicate')
          ? 'A user with this email address already exists.'
          : 'Failed to save profile to database.',
      };
    }
  } catch (err: any) {
    logger.error({ error: err?.message || err }, 'Unhandled error in adminCreateUserAction');
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred.',
    };
  }
}

/**
 * Server Action for Admins to update user profile details.
 */
export async function adminUpdateUserAction(
  prevState: AdminUserActionResult,
  formData: FormData
): Promise<AdminUserActionResult> {
  try {
    const admin = await getCurrentUserProfile();
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN')) {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }

    const rawData = {
      userId: formData.get('userId'),
      firstName: formData.get('firstName'),
      middleName: formData.get('middleName') || undefined,
      lastName: formData.get('lastName'),
      designation: formData.get('designation'),
      ecclesia: formData.get('ecclesia') || undefined,
      baptismDate: formData.get('baptismDate') || undefined,
      phoneNumber: formData.get('phoneNumber') || undefined,
    };

    const parsed = adminUpdateUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Please correct the errors in the form.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { data } = parsed;
    const existing = await getUserProfileById(data.userId);
    if (!existing) {
      return { success: false, error: 'User not found.' };
    }

    const auditContext = await getAuditContext();

    // Atomic: profile update + audit log
    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({
          firstName: data.firstName,
          middleName: data.middleName || null,
          lastName: data.lastName,
          designation: data.designation,
          ecclesia: data.ecclesia || null,
          baptismDate: data.baptismDate || null,
          phoneNumber: data.phoneNumber || null,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, data.userId));

      await tx.insert(auditLogs).values({
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'USER_UPDATED',
        targetId: data.userId,
        targetType: 'USER',
        details: {
          before: {
            firstName: existing.firstName,
            lastName: existing.lastName,
            designation: existing.designation,
            ecclesia: existing.ecclesia,
          },
          after: {
            firstName: data.firstName,
            lastName: data.lastName,
            designation: data.designation,
            ecclesia: data.ecclesia,
          },
        },
        ipAddress: auditContext.clientIp,
        userAgent: auditContext.userAgent,
      });
    });

    // External service update (outside transaction)
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      user_metadata: {
        firstName: data.firstName,
        lastName: data.lastName,
        designation: data.designation,
        ecclesia: data.ecclesia,
      },
    });

    logger.info({ targetUserId: data.userId, adminId: admin.id }, 'User profile updated by admin');

    invalidateCacheTag(CACHE_TAGS.users, CACHE_TAGS.user(data.userId));
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${data.userId}`);

    return {
      success: true,
      message: `Profile for ${data.firstName} ${data.lastName} updated successfully.`,
    };
  } catch (err: any) {
    logger.error({ error: err?.message || err }, 'Unhandled error in adminUpdateUserAction');
    return {
      success: false,
      error: err?.message || 'Failed to update user profile.',
    };
  }
}

/**
 * Server Action for Superadmins to promote/demote user roles.
 */
export async function adminChangeUserRoleAction(
  prevState: AdminUserActionResult,
  formData: FormData
): Promise<AdminUserActionResult> {
  try {
    const admin = await getCurrentUserProfile();
    if (!admin || admin.role !== 'SUPERADMIN') {
      return { success: false, error: 'Unauthorized: Only Superadministrators can alter user roles.' };
    }

    const userId = formData.get('userId') as string;
    const newRole = formData.get('role') as UserRole;

    const parsed = adminChangeRoleSchema.safeParse({ userId, role: newRole });
    if (!parsed.success) {
      return { success: false, error: 'Invalid role selection.' };
    }

    const targetUser = await getUserProfileById(userId);
    if (!targetUser) {
      return { success: false, error: 'Target user does not exist.' };
    }

    const auditContext = await getAuditContext();

    // Atomic transaction: count check + role update + audit log
    // Prevents race where two superadmins demote each other simultaneously
    await db.transaction(async (tx) => {
      // Safety Guard: Cannot demote the last remaining Superadministrator
      if (targetUser.role === 'SUPERADMIN' && newRole !== 'SUPERADMIN') {
        const [superadminCountRes] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(profiles)
          .where(eq(profiles.role, 'SUPERADMIN'));

        if ((superadminCountRes?.count ?? 0) <= 1) {
          throw new Error('Security Lockout Protection: You cannot demote the only remaining Superadministrator.');
        }
      }

      // 1. Update DB Profile Role
      await tx
        .update(profiles)
        .set({ role: newRole, updatedAt: new Date() })
        .where(eq(profiles.id, userId));

      // 2. Log Audit Event
      await tx.insert(auditLogs).values({
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'USER_ROLE_CHANGED',
        targetId: userId,
        targetType: 'USER',
        details: {
          targetUserEmail: targetUser.email,
          oldRole: targetUser.role,
          newRole: newRole,
        },
        ipAddress: auditContext.clientIp,
        userAgent: auditContext.userAgent,
      });
    });

    // Update Supabase Auth App Metadata (external service, outside transaction)
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role: newRole },
      user_metadata: { role: newRole },
    });

    logger.info(
      { targetUserId: userId, oldRole: targetUser.role, newRole, adminId: admin.id },
      'User role modified by Superadmin'
    );

    invalidateCacheTag(CACHE_TAGS.adminMetrics, CACHE_TAGS.users, CACHE_TAGS.user(userId));
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);

    return {
      success: true,
      message: `Role for ${targetUser.firstName} ${targetUser.lastName} changed to ${newRole}.`,
    };
  } catch (err: any) {
    logger.error({ error: err?.message || err }, 'Unhandled error in adminChangeUserRoleAction');
    return {
      success: false,
      error: err?.message || 'Failed to update user role.',
    };
  }
}

/**
 * Server Action for Admins to suspend or activate a user account.
 */
export async function adminToggleUserStatusAction(
  prevState: AdminUserActionResult,
  formData: FormData
): Promise<AdminUserActionResult> {
  try {
    const admin = await getCurrentUserProfile();
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN')) {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }

    const userId = formData.get('userId') as string;
    const nextStatus = formData.get('status') as UserStatus;
    const reason = (formData.get('reason') as string) || '';

    const parsed = adminToggleStatusSchema.safeParse({ userId, status: nextStatus, reason });
    if (!parsed.success) {
      return { success: false, error: 'Invalid account status parameters.' };
    }

    const targetUser = await getUserProfileById(userId);
    if (!targetUser) {
      return { success: false, error: 'User does not exist.' };
    }

    // Safety: Admins cannot suspend Superadmins
    if (targetUser.role === 'SUPERADMIN' && admin.role !== 'SUPERADMIN') {
      return { success: false, error: 'Only Superadmins can modify Superadmin accounts.' };
    }

    const auditContext = await getAuditContext();

    // Atomic: status update + audit log
    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({ status: nextStatus, updatedAt: new Date() })
        .where(eq(profiles.id, userId));

      await tx.insert(auditLogs).values({
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'USER_STATUS_CHANGED',
        targetId: userId,
        targetType: 'USER',
        details: {
          targetUserEmail: targetUser.email,
          oldStatus: targetUser.status,
          newStatus: nextStatus,
          reason,
        },
        ipAddress: auditContext.clientIp,
        userAgent: auditContext.userAgent,
      });
    });

    // Ban or Unban in Supabase Auth (external service, outside transaction)
    const supabaseAdmin = getSupabaseAdmin();
    if (nextStatus === 'SUSPENDED') {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '876000h',
      });
    } else if (nextStatus === 'ACTIVE') {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      });
    }

    logger.info(
      { targetUserId: userId, newStatus: nextStatus, adminId: admin.id },
      'User account status changed by admin'
    );

    invalidateCacheTag(CACHE_TAGS.users, CACHE_TAGS.user(userId));
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);

    return {
      success: true,
      message: `User status changed to ${nextStatus}.`,
    };
  } catch (err: any) {
    logger.error({ error: err?.message || err }, 'Unhandled error in adminToggleUserStatusAction');
    return {
      success: false,
      error: err?.message || 'Failed to change user account status.',
    };
  }
}

/**
 * Server Action for GDPR / RA 10173 Right to Erasure.
 * Anonymizes PII data while preserving non-repudiation of historical financial ledger records.
 */
export async function adminAnonymizeUserAction(formData: FormData): Promise<AdminUserActionResult> {
  try {
    const admin = await getCurrentUserProfile();
    if (!admin || admin.role !== 'SUPERADMIN') {
      return { success: false, error: 'Unauthorized: Only Superadministrators can execute account erasure.' };
    }

    const userId = formData.get('userId') as string;
    if (!userId) {
      return { success: false, error: 'User ID is required.' };
    }

    const targetUser = await getUserProfileById(userId);
    if (!targetUser) {
      return { success: false, error: 'User does not exist.' };
    }

    if (targetUser.role === 'SUPERADMIN') {
      return { success: false, error: 'Cannot anonymize an active Superadministrator account.' };
    }

    const auditContext = await getAuditContext();

    const anonymizedEmail = `anonymized_${userId.slice(0, 8)}@privacy.pcyc.ph`;

    // Atomic: PII scrub + audit log
    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({
          email: anonymizedEmail,
          firstName: 'Anonymized',
          middleName: null,
          lastName: 'Member',
          phoneNumber: null,
          baptismDate: null,
          avatarUrl: null,
          ecclesia: 'Anonymized',
          status: 'ANONYMIZED',
          isAnonymized: true,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      await tx.insert(auditLogs).values({
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'USER_ANONYMIZED',
        targetId: userId,
        targetType: 'USER',
        details: {
          originalEmailMasked: `${targetUser.email.slice(0, 2)}***@***`,
          reason: 'Right to Erasure / Account Data Anonymization Request',
        },
        ipAddress: auditContext.clientIp,
        userAgent: auditContext.userAgent,
      });
    });

    // Delete Supabase Auth Account (external service, outside transaction)
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.auth.admin.deleteUser(userId);

    logger.info({ targetUserId: userId, adminId: admin.id }, 'User profile anonymized per privacy request');

    invalidateCacheTag(CACHE_TAGS.adminMetrics, CACHE_TAGS.users, CACHE_TAGS.user(userId));
    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Account has been permanently anonymized and login credentials removed.',
    };
  } catch (err: any) {
    logger.error({ error: err?.message || err }, 'Unhandled error in adminAnonymizeUserAction');
    return {
      success: false,
      error: err?.message || 'Failed to anonymize user account.',
    };
  }
}

/**
 * Server Action to record an audit log when an admin views unmasked PII.
 */
export async function adminLogPiiRevealAction(userId: string): Promise<void> {
  try {
    const admin = await getCurrentUserProfile();
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN')) return;

    const auditContext = await getAuditContext();

    await db.insert(auditLogs).values({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'PII_REVEALED',
      targetId: userId,
      targetType: 'USER',
      details: {
        note: 'Admin unmasked and inspected sensitive user PII',
      },
      ipAddress: auditContext.clientIp,
      userAgent: auditContext.userAgent,
    });
  } catch (err) {
    // Non-blocking telemetry
    logger.warn({ error: err, userId }, 'Failed to record PII reveal audit log');
  }
}
