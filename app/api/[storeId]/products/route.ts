import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProductSchema } from "@/schemas/product-form-schema";
import { NextResponse } from "next/server";

const allowedOrigins = [
  process.env.NEXT_PUBLIC_FRONTEND_URL,
  "http://localhost:3000",
  "https://favobliss.vercel.app",
].filter(Boolean);

export async function POST(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const session = await auth();
    const body = await request.json();
    const validatedData = ProductSchema.safeParse(body);

    if (!validatedData.success) {
      return new NextResponse(
        JSON.stringify({ errors: validatedData.error.format() }),
        { status: 400 }
      );
    }

    const {
      brandId,
      sizeAndFit,
      materialAndCare,
      enabledFeatures,
      expressDelivery,
      warranty,
      isFeatured,
      isNewArrival,
      isArchieved,
      categoryId,
      subCategoryId,
      variants,
    } = validatedData.data;

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: { id: params.storeId },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    const category = await db.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return new NextResponse("Invalid category", { status: 400 });
    }

    if (subCategoryId) {
      const subCategory = await db.subCategory.findUnique({
        where: { id: subCategoryId },
      });
      if (!subCategory) {
        return new NextResponse("Invalid subcategory", { status: 400 });
      }
      if (subCategory.categoryId !== categoryId) {
        return new NextResponse(
          "Subcategory must belong to the selected category",
          { status: 400 }
        );
      }
    }

    if (brandId) {
      const brand = await db.brand.findUnique({
        where: { id: brandId, storeId: params.storeId },
      });
      if (!brand) {
        return new NextResponse("Invalid brand", { status: 400 });
      }
    }

    for (const variant of variants) {
      if (variant.specifications && variant.specifications.length > 0) {
        const specificationFieldIds = variant.specifications.map(
          (spec) => spec.specificationFieldId
        );
        const specificationFields = await db.specificationField.findMany({
          where: {
            id: { in: specificationFieldIds },
            storeId: params.storeId,
          },
        });

        if (specificationFields.length !== specificationFieldIds.length) {
          return new NextResponse(
            "One or more specification fields are invalid",
            { status: 400 }
          );
        }
      }

      if (variant.sizeId !== null && variant.sizeId) {
        const size = await db.size.findUnique({
          where: { id: variant.sizeId },
        });
        if (!size) {
          return new NextResponse("Invalid size in variant", { status: 400 });
        }
      }
      if (variant.colorId !== null && variant.colorId) {
        const color = await db.color.findUnique({
          where: { id: variant.colorId },
        });
        if (!color) {
          return new NextResponse("Invalid color in variant", { status: 400 });
        }
      }
      if (variant.slug) {
        const existingVariant = await db.variant.findUnique({
          where: { slug: variant.slug },
        });
        if (existingVariant) {
          return new NextResponse(`Slug ${variant.slug} already exists`, {
            status: 400,
          });
        }
      }
      if (variant.sku) {
        const existingVariant = await db.variant.findUnique({
          where: { sku: variant.sku },
        });
        if (existingVariant) {
          return new NextResponse(`SKU ${variant.sku} already exists`, {
            status: 400,
          });
        }
      }

      if (variant.hsn) {
        const existingVariant = await db.variant.findUnique({
          where: { hsn: variant.hsn },
        });
        if (existingVariant) {
          return new NextResponse(`HSN ${variant.hsn} already exists`, {
            status: 400,
          });
        }
      }

      if (!variant.variantPrices || variant.variantPrices.length === 0) {
        return new NextResponse(
          "Each variant must have at least one price for a location group",
          { status: 400 }
        );
      }

      if (variant.variantPrices.length > 0) {
        const locationGroupIds = variant.variantPrices.map(
          (vp) => vp.locationGroupId
        );
        const locationGroups = await db.locationGroup.findMany({
          where: {
            id: { in: locationGroupIds },
            storeId: params.storeId,
          },
        });
        if (locationGroups.length !== locationGroupIds.length) {
          return new NextResponse(
            "One or more location group IDs in variant prices are invalid",
            { status: 400 }
          );
        }
      }
    }

    const product = await db.product.create({
      data: {
        brandId,
        sizeAndFit,
        materialAndCare,
        enabledFeatures,
        expressDelivery,
        warranty,
        isFeatured,
        isNewArrival,
        isArchieved,
        categoryId,
        subCategoryId,
        storeId: params.storeId,
        variants: {
          create: variants.map((variant) => ({
            name: variant.name,
            slug: variant.slug,
            about: variant.about,
            description: variant.description,
            metaTitle: variant.metaTitle,
            metaDescription: variant.metaDescription,
            metaKeywords: variant.metaKeywords,
            openGraphImage: variant.openGraphImage,
            stock: variant.stock,
            sku: variant.sku || undefined,
            hsn: variant.hsn || undefined,
            tax: variant.tax || undefined,
            gstIn: variant.gstIn || undefined,
            sizeId: variant.sizeId === null ? null : variant.sizeId,
            colorId: variant.colorId === null ? null : variant.colorId,
            images: {
              create: variant.media.map((media) => ({
                url: media.url,
                mediaType: media.mediaType || "IMAGE",
              })),
            },
            variantPrices: {
              create: variant.variantPrices?.map((vp) => ({
                locationGroupId: vp.locationGroupId,
                price: vp.price,
                mrp: vp.mrp,
              })),
            },
            variantSpecifications: {
              create: variant.specifications?.map((spec) => ({
                specificationFieldId: spec.specificationFieldId,
                value: spec.value,
              })),
            },
          })),
        },
      },
      include: {
        brand: true,
        variants: {
          include: {
            images: true,
            variantPrices: {
              include: {
                locationGroup: true,
              },
            },
            variantSpecifications: true,
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.log("[PRODUCTS_POST]", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Slug or SKU or HSN already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  const origin = request.headers.get("origin");
  const corsOrigin = allowedOrigins.includes(origin ?? "")
    ? origin ?? ""
    : allowedOrigins[0];

  const headers = {
    "Access-Control-Allow-Origin": corsOrigin || "",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  try {
    if (!params.storeId) {
      return new NextResponse("Store ID is required", {
        status: 400,
        headers,
      });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const brandId = searchParams.get("brandId");
    const colorId = searchParams.get("colorId");
    const sizeId = searchParams.get("sizeId");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const price = searchParams.get("price");
    const locationGroupId = searchParams.get("locationGroupId");
    const pincode = searchParams.get("pincode");
    const isFeatured = searchParams.get("isFeatured");
    const variantIds = searchParams.get("variantIds")?.split(",");
    const includeRelated = searchParams.get("includeRelated") === "true";
    const rating = searchParams.get("rating");
    const discount = searchParams.get("discount");

    console.log("Received filters:", {
      slug,
      categoryId,
      subCategoryId,
      brandId,
      colorId,
      sizeId,
      type,
      page,
      limit,
      price,
      locationGroupId,
      pincode,
      isFeatured,
      variantIds,
      includeRelated,
      rating,
      discount,
    });

    let resolvedLocationGroupId = locationGroupId;
    if (pincode && !locationGroupId) {
      const location = await db.location.findUnique({
        where: { pincode, storeId: params.storeId },
        select: { locationGroupId: true },
      });
      if (!location) {
        console.log("Invalid pincode", pincode);
        return new NextResponse("Invalid pincode", { status: 404, headers });
      }
      resolvedLocationGroupId = location.locationGroupId;
    }

    // Validate subCategoryId if provided
    if (subCategoryId) {
      const subCategory = await db.subCategory.findUnique({
        where: { id: subCategoryId, storeId: params.storeId },
      });
      if (!subCategory) {
        console.log("Invalid subCategoryId", subCategoryId);
        return new NextResponse("Invalid subcategory ID", {
          status: 404,
          headers,
        });
      }
      if (categoryId && subCategory.categoryId !== categoryId) {
        console.log("Subcategory does not belong to specified category", {
          subCategoryId,
          categoryId,
        });
        return new NextResponse(
          "Subcategory does not belong to specified category",
          { status: 400, headers }
        );
      }
    }

    if (slug) {
      const variantData = await db.variant.findUnique({
        where: { slug },
        include: {
          size: true,
          color: true,
          images: true,
          variantPrices: {
            where: resolvedLocationGroupId
              ? { locationGroupId: resolvedLocationGroupId }
              : undefined,
            include: {
              locationGroup: {
                include: {
                  locations: true,
                },
              },
            },
          },
          variantSpecifications: {
            include: {
              specificationField: {
                include: {
                  group: true,
                },
              },
            },
          },
          product: {
            include: {
              brand: true,
              category: true,
              subCategory: {
                include: {
                  parent: true,
                },
              },
              variants: {
                orderBy: {
                  createdAt: "asc",
                },
                include: {
                  size: true,
                  color: true,
                },
              },
              reviews: {
                select: {
                  rating: true,
                },
              },
            },
          },
        },
      });

      if (!variantData || !variantData.product) {
        return new NextResponse("Product not found", { status: 404, headers });
      }

      const product = variantData.product;

      if (product.storeId !== params.storeId || product.isArchieved) {
        return new NextResponse("Product not found", { status: 404, headers });
      }

      const ratings = product.reviews.map((review) => review.rating);
      const numberOfRatings = ratings.length;
      const averageRating =
        numberOfRatings > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / numberOfRatings
          : 0;

      const { reviews, variants, ...productWithoutVariantsAndReviews } =
        product;

      const response = {
        variant: {
          ...variantData,
          product: undefined, // Remove nested product
        },
        product: {
          ...productWithoutVariantsAndReviews,
          averageRating: Number(averageRating.toFixed(2)),
          numberOfRatings,
        },
        allVariants: variants.map((v) => ({
          id: v.id,
          title: v.name,
          slug: v.slug,
          color: v.color?.name || null,
          size: v.size?.value || null,
          sizeId: v.size?.id,
          colorId: v.color?.id,
        })),
      };

      return NextResponse.json(response, { headers });
    }

    const where: any = {
      storeId: params.storeId,
      isArchieved: false,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (subCategoryId) {
      where.subCategoryId = subCategoryId;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (colorId || sizeId) {
      where.variants = {
        some: {
          ...(colorId && { colorId }),
          ...(sizeId && { sizeId }),
        },
      };
    }

    if (type) {
      where.type = type;
    }

    if (isFeatured) {
      if (isFeatured === "true") {
        where.isFeatured = true;
      } else if (isFeatured === "false") {
        where.isFeatured = false;
      }
    }

    if (variantIds && variantIds.length > 0) {
      where.variants = {
        some: {
          id: { in: variantIds },
        },
      };
    }

    if (price) {
      let minPrice: number | undefined;
      let maxPrice: number | undefined;

      if (price === "5000") {
        minPrice = 5000;
      } else {
        const [min, max] = price.split("-").map((p) => parseInt(p));
        if (max) {
          minPrice = min;
          maxPrice = max;
        }
      }

      if (minPrice || maxPrice) {
        where.variants = {
          some: {
            ...(where.variants?.some || {}),
            variantPrices: {
              some: {
                ...(resolvedLocationGroupId
                  ? { locationGroupId: resolvedLocationGroupId }
                  : {}),
                price: {
                  ...(minPrice && { gte: minPrice }),
                  ...(maxPrice && { lte: maxPrice }),
                },
              },
            },
          },
        };
      }
    }

    const hasPostFilter = !!rating || !!discount;
    const take = hasPostFilter ? undefined : limit;
    const skip = hasPostFilter ? 0 : (page - 1) * limit;

    const products = await db.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        subCategory: {
          include: {
            parent: true,
          },
        },
        variants: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            size: true,
            color: true,
            images: true,
            variantPrices: {
              where: resolvedLocationGroupId
                ? { locationGroupId: resolvedLocationGroupId }
                : undefined,
              include: {
                locationGroup: true,
              },
            },
            variantSpecifications: {
              include: {
                specificationField: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    });

    let productsWithRatings = products.map((product) => {
      const ratings = product.reviews.map((review) => review.rating);
      const numberOfRatings = ratings.length;
      const averageRating =
        numberOfRatings > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / numberOfRatings
          : 0;

      const { reviews, ...productWithoutReviews } = product;
      return {
        ...productWithoutReviews,
        averageRating: Number(averageRating.toFixed(2)),
        numberOfRatings,
      };
    });

    let filtered = productsWithRatings;
    if (rating) {
      const minRating = parseFloat(rating);
      filtered = filtered.filter((p) => p.averageRating >= minRating);
    }
    if (discount) {
      const minDiscount = parseFloat(discount);
      filtered = filtered.filter((p) =>
        p.variants.some((v) =>
          v.variantPrices.some((vp) => {
            if (
              resolvedLocationGroupId &&
              vp.locationGroupId !== resolvedLocationGroupId
            )
              return false;
            if (vp.price >= vp.mrp) return false;
            const d = ((vp.mrp - vp.price) / vp.mrp) * 100;
            return d >= minDiscount;
          })
        )
      );
    }

    const totalCount = hasPostFilter
      ? filtered.length
      : await db.product.count({ where });

    const finalProducts = hasPostFilter
      ? filtered.slice((page - 1) * limit, (page - 1) * limit + limit)
      : filtered;

    console.log(
      `Found ${products.length} products for storeId: ${params.storeId}, brandId: ${brandId}, categoryId: ${categoryId}, subCategoryId: ${subCategoryId}`
    );

    return NextResponse.json(
      {
        products: finalProducts,
        totalCount,
      },
      { headers }
    );
  } catch (error) {
    console.log("[PRODUCTS_GET]", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
