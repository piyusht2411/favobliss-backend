import * as z from "zod";

export const LocationFormSchema = z.object({
  pincode: z.string().min(1, {
    message: "Pincode is required",
  }),
  city: z.string().min(1, {
    message: "City is required",
  }),
  state: z.string().min(1, {
    message: "State is required",
  }),
  country: z.string().min(1, {
    message: "Country is required",
  }),
});
