import { Icon } from "@radix-ui/react-select";
import * as z from "zod";

export const SubCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(60, "Slug must be at most 60 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  bannerImage: z.string().url("Invalid URL").min(1, "Banner image is required"),
  icon: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  parentId: z.string().optional(),
  reviewCategories: z
    .array(z.object({ name: z.string().min(1, "Category name is required") }))
    .optional()
    .default([]),
});
