import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  adminCreateUserSchema,
  adminChangeRoleSchema,
  adminToggleStatusSchema,
} from '../lib/validators';
import { maskEmail, maskPhoneNumber, sanitizeUserForDisplay } from '../lib/security/privacy';
import { validateImageMagicBytes } from '../lib/storage';
import { enforceActionRateLimit } from '../lib/security/rate-limiter';
import type { Profile } from '../lib/db/schema/users';

describe('Admin User Management Validation Schemas', () => {
  it('should validate a valid new member creation with Friend designation', () => {
    const validFriend = {
      email: 'friend.visitor@example.com',
      password: 'StrongPassword123!',
      firstName: 'Joshua',
      lastName: 'Del Rosario',
      designation: 'FRIEND' as const,
      role: 'MEMBER' as const,
    };

    const result = adminCreateUserSchema.safeParse(validFriend);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.email, 'friend.visitor@example.com');
      assert.equal(result.data.designation, 'FRIEND');
    }
  });

  it('should require baptismDate when designation is BROTHER or SISTER', () => {
    const unbaptizedBrother = {
      email: 'brother.sam@example.com',
      password: 'StrongPassword123!',
      firstName: 'Samuel',
      lastName: 'Guanzon',
      designation: 'BROTHER' as const,
      role: 'MEMBER' as const,
    };

    const result = adminCreateUserSchema.safeParse(unbaptizedBrother);
    assert.equal(result.success, false, 'Baptism date must be required for Brother');

    const baptizedBrother = {
      ...unbaptizedBrother,
      baptismDate: '2020-04-12',
    };
    const validResult = adminCreateUserSchema.safeParse(baptizedBrother);
    assert.equal(validResult.success, true);
  });

  it('should validate role change schema', () => {
    const validRoleChange = {
      userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      role: 'ADMIN' as const,
    };

    const result = adminChangeRoleSchema.safeParse(validRoleChange);
    assert.equal(result.success, true);
  });

  it('should reject invalid UUIDs for role change', () => {
    const invalidId = {
      userId: 'not-a-valid-uuid',
      role: 'ADMIN' as const,
    };

    const result = adminChangeRoleSchema.safeParse(invalidId);
    assert.equal(result.success, false);
  });

  it('should validate user status change schema', () => {
    const validStatus = {
      userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      status: 'SUSPENDED' as const,
      reason: 'Administrative policy review',
    };

    const result = adminToggleStatusSchema.safeParse(validStatus);
    assert.equal(result.success, true);
  });
});

describe('Data Privacy & PII Masking Utilities', () => {
  it('should mask email addresses while preserving initial character and domain', () => {
    assert.equal(maskEmail('john.doe@example.com'), 'j***e@example.com');
    assert.equal(maskEmail('yuri@pcyc.ph'), 'y***i@pcyc.ph');
    assert.equal(maskEmail('a@b.com'), 'a***@b.com');
    assert.equal(maskEmail(null), 'N/A');
  });

  it('should mask phone numbers preserving prefix and last 2 digits', () => {
    assert.equal(maskPhoneNumber('+639171234567'), '+639 *** **67');
    assert.equal(maskPhoneNumber('09181234567'), '0918 *** **67');
    assert.equal(maskPhoneNumber(null), 'Not Provided');
  });

  it('should sanitize user profile for general viewing and unmask for authorized reveal', () => {
    const dummyUser: Profile = {
      id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      email: 'admin.secret@pcyc.ph',
      firstName: 'David',
      middleName: 'M',
      lastName: 'Castillo',
      designation: 'BROTHER',
      baptismDate: '2018-01-01',
      ecclesia: 'Manila Ecclesia',
      phoneNumber: '+639179876543',
      avatarUrl: null,
      role: 'MEMBER',
      status: 'ACTIVE',
      isAnonymized: false,
      lastActiveAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Masked default view for member viewer
    const masked = sanitizeUserForDisplay(dummyUser, 'MEMBER', false);
    assert.equal(masked.isPiiMasked, true);
    assert.equal(masked.email, 'a***t@pcyc.ph');
    assert.equal(masked.phoneNumber, '+639 *** **43');

    // Unmasked view for Superadmin with explicit reveal flag
    const revealed = sanitizeUserForDisplay(dummyUser, 'SUPERADMIN', true);
    assert.equal(revealed.isPiiMasked, false);
    assert.equal(revealed.email, 'admin.secret@pcyc.ph');
    assert.equal(revealed.phoneNumber, '+639179876543');
  });
});

describe('Enterprise File Security & Magic Byte Signature Verification', () => {
  it('should recognize authentic PNG header (89 50 4E 47 0D 0A 1A 0A)', () => {
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const result = validateImageMagicBytes(pngBuffer);
    assert.equal(result.valid, true);
    assert.equal(result.detectedType, 'png');
  });

  it('should recognize authentic JPEG header (FF D8 FF)', () => {
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    const result = validateImageMagicBytes(jpegBuffer);
    assert.equal(result.valid, true);
    assert.equal(result.detectedType, 'jpeg');
  });

  it('should recognize authentic WebP header (RIFF...WEBP)', () => {
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    const result = validateImageMagicBytes(webpBuffer);
    assert.equal(result.valid, true);
    assert.equal(result.detectedType, 'webp');
  });

  it('should reject fake image disguised as script or invalid binary', () => {
    const maliciousPhpScript = Buffer.from('<?php echo "malicious code"; ?>');
    const result = validateImageMagicBytes(maliciousPhpScript);
    assert.equal(result.valid, false, 'Executable script must be rejected by magic bytes');
  });
});

describe('Action-Level Rate Limiter Tests', () => {
  it('should allow requests within threshold and block when exceeded', () => {
    const testIp = '192.168.1.100';
    const actionKey = 'test_action';
    const limit = 3;
    const windowMs = 5000;

    const r1 = enforceActionRateLimit(testIp, actionKey, limit, windowMs);
    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 2);

    const r2 = enforceActionRateLimit(testIp, actionKey, limit, windowMs);
    assert.equal(r2.allowed, true);
    assert.equal(r2.remaining, 1);

    const r3 = enforceActionRateLimit(testIp, actionKey, limit, windowMs);
    assert.equal(r3.allowed, true);
    assert.equal(r3.remaining, 0);

    // 4th request must be blocked
    const r4 = enforceActionRateLimit(testIp, actionKey, limit, windowMs);
    assert.equal(r4.allowed, false);
    assert.equal(r4.remaining, 0);
  });
});
