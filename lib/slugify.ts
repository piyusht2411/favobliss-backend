import slugify from "slugify";
import { db } from "./db";

export async function generateUniqueSlug(
  name: string,
  model: "Product" | "Category" | "SubCategory",
  excludeId?: string
): Promise<string> {
  let baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    //@ts-ignore
    const existing = await db[model].findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
