import * as z from "zod";

export const BrandFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/g,
      "Slug must be lowercase, alphanumeric, and may include hyphens"
    ),
  bannerImage: z.string().min(1, {
    message: "Banner Image is required",
  }),
  description: z.string().optional(),
  cardImage: z.string().min(1, {
    message: "Card Image is required",
  }),
});
