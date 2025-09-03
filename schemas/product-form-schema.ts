import * as z from "zod";

export const VariantSchema = z
  .object({
    id: z.string().optional(),
    sizeId: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val === "" ? null : val)),
    colorId: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val === "" ? null : val)),
    stock: z.number().min(0, "Stock must be non-negative"),
    media: z
      .array(
        z.object({
          url: z.string().url(),
          mediaType: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
        })
      )
      .min(1, "At least one media item is required"),
    sku: z.string().optional(),
    hsn: z.string().optional(),
    tax: z.number().optional(),
    gstIn: z
      .string()
      .optional()
      .transform((val) => (val === null ? "" : val)),
    variantPrices: z
      .array(
        z.object({
          locationGroupId: z.string().min(1, "Location group ID is required"),
          price: z.number().min(0, "Price must be non-negative"),
          mrp: z.number().min(0, "MRP must be non-negative"),
        })
      )
      .min(1, "At least one price per location is required"),
    name: z.string().min(1, "Variant name is required"),
    slug: z
      .string()
      .min(1, "Slug is required")
      .max(60, "Slug must be at most 60 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase letters, numbers, and hyphens"
      ),
    about: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    metaTitle: z
      .string()
      .max(60, "Meta title must be at most 60 characters")
      .optional(),
    metaDescription: z
      .string()
      .max(160, "Meta description must be at most 160 characters")
      .optional(),
    metaKeywords: z.array(z.string()).optional(),
    openGraphImage: z.string().optional(),
    specifications: z
      .array(
        z.object({
          specificationFieldId: z
            .string()
            .min(1, "Specification field is required"),
          value: z.string().min(1, "Value is required"),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      return data.variantPrices.length > 0;
    },
    {
      message:
        "Each variant must include a price for the location with pincode 110040",
      path: ["variantPrices"],
    }
  );

export const ProductSchema = z.object({
  brandId: z.string().nullable().optional(),
  sizeAndFit: z.array(z.string()).optional(),
  materialAndCare: z.array(z.string()).optional(),
  enabledFeatures: z.array(z.string()).optional(),
  expressDelivery: z.boolean().default(false),
  warranty: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isArchieved: z.boolean().default(false),
  categoryId: z.string().min(1, "Category is required"),
  subCategoryId: z.string().optional(),
  variants: z.array(VariantSchema).min(1, "At least one variant is required"),
});
