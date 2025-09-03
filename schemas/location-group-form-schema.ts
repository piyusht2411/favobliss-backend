import * as z from "zod";

export const LocationGroupFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  isCodAvailable: z.boolean().optional(),
  isExpressDelivery: z.boolean().optional(),
  expressDeliveryText: z.string().optional(),
  deliveryDays: z.number().min(1, {
    message: "Delivery days must be at least 1",
  }),
  locationIds: z.array(z.string()).optional(),
});
