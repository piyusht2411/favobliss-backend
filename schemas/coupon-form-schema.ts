import * as z from "zod";

export const CouponFormSchema = z.object({
  code: z.string().min(1, { message: "Coupon code is required" }),
  isActive: z.boolean().default(true),
  value: z.number().min(0, { message: "Value must be a positive number" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  expiryDate: z.string().min(1, { message: "Expiry date is required" }),
  productIds: z.array(z.string()).optional(),
  usagePerUser: z
    .number()
    .min(1, { message: "Usage per user must be at least 1" })
    .optional(),
  usedCount: z
    .number()
    .min(1, { message: "Usage count must be at least 1" })
    .optional(),
  description: z.string().optional(),
});
