import { z } from 'zod';

// ==========================================
// AUTH & USER PROFILE VALIDATORS
// ==========================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6).optional(),
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    designation: z.enum(['BROTHER', 'SISTER', 'FRIEND'], {
      message: 'Please select whether you are a Brother, Sister, or Friend',
    }),
    ecclesia: z.string().optional(),
    baptismDate: z.string().optional(),
    phoneNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword && data.password !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  )
  .refine(
    (data) => {
      if ((data.designation === 'BROTHER' || data.designation === 'SISTER') && !data.baptismDate) {
        return false;
      }
      return true;
    },
    {
      message: 'Baptism date is required for Brothers and Sisters',
      path: ['baptismDate'],
    }
  );

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    designation: z.enum(['BROTHER', 'SISTER', 'FRIEND']),
    ecclesia: z.string().optional(),
    baptismDate: z.string().optional(),
    phoneNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      if ((data.designation === 'BROTHER' || data.designation === 'SISTER') && !data.baptismDate) {
        return false;
      }
      return true;
    },
    {
      message: 'Baptism date is required for Brothers and Sisters',
      path: ['baptismDate'],
    }
  );

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

// ==========================================
// EVENT VALIDATORS
// ==========================================

export const eventSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    slug: z.string().min(3, 'Slug is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    theme: z.string().optional(),
    bannerUrl: z.string().optional(),
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .refine((val) => !isNaN(new Date(val).getTime()), {
        message: 'Start date is invalid',
      }),
    endDate: z
      .string()
      .min(1, 'End date is required')
      .refine((val) => !isNaN(new Date(val).getTime()), {
        message: 'End date is invalid',
      }),
    location: z.string().min(3, 'Location is required'),
    registrationFee: z.number().min(0, 'Registration fee cannot be negative').default(0),
    isPublished: z.boolean().default(false),
    maxAttendees: z.number().int().positive().optional(),
    registrationDeadline: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(new Date(val).getTime()), {
        message: 'Registration deadline is invalid',
      }),
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED', 'ARCHIVED']).default('UPCOMING'),
    schedule: z.string().optional(),
    checklist: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
      return end.getTime() >= start.getTime();
    },
    {
      message: 'End date & time cannot be earlier than start date & time',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      if (!data.registrationDeadline) return true;
      const start = new Date(data.startDate);
      const deadline = new Date(data.registrationDeadline);
      if (isNaN(start.getTime()) || isNaN(deadline.getTime())) return true;
      return deadline.getTime() <= start.getTime();
    },
    {
      message: 'Registration deadline cannot be after the event start date',
      path: ['registrationDeadline'],
    }
  );

export const eventRegistrationSchema = z
  .object({
    eventId: z.string().uuid('Invalid event ID'),
    paymentOption: z.enum(['GCASH', 'VENUE_DESK', 'FREE']).default('VENUE_DESK'),
    referenceNumber: z.string().optional(),
    specialRequirements: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentOption === 'GCASH') {
        return !!(data.referenceNumber && data.referenceNumber.trim().length >= 3);
      }
      return true;
    },
    {
      message: 'GCash reference number is required when paying via GCash',
      path: ['referenceNumber'],
    }
  );

// ==========================================
// MERCHANDISE VALIDATORS
// ==========================================

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().min(10, 'Description is required'),
  price: z.number().positive('Price must be greater than 0'),
  category: z.string().default('Apparel'),
  stockQuantity: z.number().int().nonnegative('Stock cannot be negative'),
  imageUrls: z.array(z.string()).default(['/images/logo/pcyc-transparent-logo.png']),
  availableSizes: z.array(z.string()).default(['XS', 'S', 'M', 'L', 'XL', '2XL']),
  isAvailable: z.boolean().default(true),
  isPreorder: z.boolean().default(false),
});

// ==========================================
// ORDER VALIDATORS
// ==========================================

export const orderSchema = z
  .object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Maximum 50 units per order'),
    selectedSize: z.string().optional(),
    fulfillmentType: z.enum(['EVENT_PICKUP', 'DELIVERY']).default('EVENT_PICKUP'),
    recipientName: z.string().min(2, 'Recipient name is required (minimum 2 characters)'),
    contactNumber: z.string().optional(),
    targetEventTitle: z.string().optional(),
    deliveryAddress: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    zipCode: z.string().optional(),
    notes: z.string().optional(),
    referenceNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentType === 'DELIVERY') {
      if (!data.deliveryAddress || data.deliveryAddress.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Street address / building is required (minimum 5 characters)',
          path: ['deliveryAddress'],
        });
      }
      if (!data.city || data.city.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'City / Municipality is required',
          path: ['city'],
        });
      }
      if (!data.province || data.province.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Province / Region is required',
          path: ['province'],
        });
      }
      if (
        !data.contactNumber ||
        data.contactNumber.trim().length < 7 ||
        !/^[0-9+\s()-]+$/.test(data.contactNumber.trim())
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Valid contact phone number is required for courier delivery',
          path: ['contactNumber'],
        });
      }
      if (!data.referenceNumber || data.referenceNumber.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'GCash reference number is required for delivery order verification',
          path: ['referenceNumber'],
        });
      }
    }
  });

export const receiptUploadSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  paymentMethod: z.literal('GCASH').default('GCASH'),
  referenceNumber: z.string().min(3, 'GCash reference number is required'),
  amountPaid: z.number().positive('Amount paid must be greater than 0'),
  notes: z.string().optional(),
});

export function isSizeAvailable(selectedSize?: string, availableSizes?: string[]): boolean {
  if (!selectedSize || !availableSizes || availableSizes.length === 0) return true;
  if (availableSizes.includes('One Size') || availableSizes.includes('N/A')) return true;
  return availableSizes.includes(selectedSize);
}

export const checkoutSchema = z.object({
  recipientName: z.string().min(2, 'Recipient name is required'),
  contactNumber: z.string().min(7, 'Valid contact number is required'),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        selectedSize: z.string().optional(),
      })
    )
    .min(1, 'Order must contain at least one item'),
});

export const paymentReceiptUploadSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  receiptImageUrl: z.string().url('Proof of payment image URL is required'),
  paymentMethod: z.literal('GCASH').default('GCASH'),
  referenceNumber: z.string().min(3, 'Reference number is required'),
  amountPaid: z.number().positive('Amount paid must be greater than 0'),
});

export const receiptVerificationSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(['APPROVED', 'REJECTED']),
  verificationNotes: z.string().optional(),
});

// ==========================================
// ECCLESIA & SITE SETTINGS VALIDATORS
// ==========================================

export const ecclesiaSchema = z.object({
  name: z.string().min(3, 'Ecclesia name must be at least 3 characters'),
  region: z.enum(['Luzon', 'Visayas', 'Mindanao'], {
    message: 'Please select a valid region (Luzon, Visayas, or Mindanao)',
  }),
  city: z.string().min(2, 'City/Municipality is required'),
  address: z.string().min(5, 'Address details are required'),
  contactPerson: z.string().optional(),
  meetingSchedule: z.string().min(5, 'Meeting schedule is required'),
  isDisplayed: z.boolean().default(true),
  orderIndex: z.number().int().default(0),
});

export const youthCountSettingSchema = z.object({
  count: z
    .number({ message: 'Must be a valid number' })
    .int('Must be an integer')
    .min(1, 'Youth & Friends count cannot be less than 1'),
});

// ==========================================
// ADMIN USER ACCESS & MANAGEMENT VALIDATORS
// ==========================================

export const adminCreateUserSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    designation: z.enum(['BROTHER', 'SISTER', 'FRIEND']),
    ecclesia: z.string().optional(),
    baptismDate: z.string().optional(),
    phoneNumber: z.string().optional(),
    role: z.enum(['MEMBER', 'ADMIN', 'SUPERADMIN']).default('MEMBER'),
  })
  .refine(
    (data) => {
      if ((data.designation === 'BROTHER' || data.designation === 'SISTER') && !data.baptismDate) {
        return false;
      }
      return true;
    },
    {
      message: 'Baptism date is required for Brothers and Sisters',
      path: ['baptismDate'],
    }
  );

export const adminUpdateUserSchema = z
  .object({
    userId: z.string().uuid('Invalid user ID'),
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    designation: z.enum(['BROTHER', 'SISTER', 'FRIEND']),
    ecclesia: z.string().optional(),
    baptismDate: z.string().optional(),
    phoneNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      if ((data.designation === 'BROTHER' || data.designation === 'SISTER') && !data.baptismDate) {
        return false;
      }
      return true;
    },
    {
      message: 'Baptism date is required for Brothers and Sisters',
      path: ['baptismDate'],
    }
  );

export const adminChangeRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['MEMBER', 'ADMIN', 'SUPERADMIN']),
});

export const adminToggleStatusSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ANONYMIZED']),
  reason: z.string().optional(),
});

// ==========================================
// PRODUCT REVIEWS & RATING SCHEMAS
// ==========================================

export const productReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  orderId: z.string().uuid('Invalid order ID'),
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1 star').max(5, 'Rating cannot exceed 5 stars'),
  comment: z
    .string()
    .min(5, 'Review comment must be at least 5 characters')
    .max(1000, 'Review comment cannot exceed 1000 characters')
    .trim(),
});

export const updateProductReviewSchema = z.object({
  reviewId: z.string().uuid('Invalid review ID'),
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1 star').max(5, 'Rating cannot exceed 5 stars'),
  comment: z
    .string()
    .min(5, 'Review comment must be at least 5 characters')
    .max(1000, 'Review comment cannot exceed 1000 characters')
    .trim(),
});

export const bulkOrderStatusSchema = z.object({
  orderIds: z.array(z.string().uuid('Invalid order ID')).min(1, 'Please select at least one order'),
  targetStatus: z.enum([
    'PENDING_PAYMENT',
    'VERIFICATION_QUEUED',
    'PAID',
    'PREPARING',
    'SHIPPED',
    'COMPLETED',
    'CANCELLED',
  ]),
  adminNotes: z.string().optional(),
});


