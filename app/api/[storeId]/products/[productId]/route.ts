import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProductSchema } from "@/schemas/product-form-schema";
import { NextResponse } from "next/server";

const allowedOrigins = [
  process.env.NEXT_PUBLIC_FRONTEND_URL,
  "http://localhost:3000",
  "https://favobliss.vercel.app",
].filter(Boolean);

export async function PATCH(
  request: Request,
  { params }: { params: { storeId: string; productId: string } }
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

    if (!params.productId) {
      return new NextResponse("Product ID is required", { status: 400 });
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
        if (existingVariant && existingVariant.id !== variant.id) {
          return new NextResponse(`Slug ${variant.slug} already exists`, {
            status: 400,
          });
        }
      }
      if (variant.sku) {
        const existingVariant = await db.variant.findUnique({
          where: { sku: variant.sku },
        });
        if (existingVariant && existingVariant.id !== variant.id) {
          return new NextResponse(`SKU ${variant.sku} already exists`, {
            status: 400,
          });
        }
      }

      if (variant.hsn) {
        const existingVariant = await db.variant.findUnique({
          where: { hsn: variant.hsn },
        });
        if (existingVariant && existingVariant.id !== variant.id) {
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

    const product = await db.product.update({
      where: { id: params.productId },
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
        variants: {
          deleteMany: {
            id: {
              notIn: variants.filter((v) => v.id).map((v) => v.id as string),
            },
          },
          create: variants
            .filter((v) => !v.id)
            .map((variant) => ({
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
                create: variant.media.map((image) => ({
                  url: image.url,
                  mediaType: image.mediaType || "IMAGE",
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
          update: variants
            .filter((v) => v.id)
            .map((variant) => ({
              where: { id: variant.id! },
              data: {
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
                  deleteMany: {},
                  create: variant.media.map((image) => ({
                    url: image.url,
                    mediaType: image.mediaType || "IMAGE",
                  })),
                },
                variantPrices: {
                  deleteMany: {},
                  create: variant.variantPrices?.map((vp) => ({
                    locationGroupId: vp.locationGroupId,
                    price: vp.price,
                    mrp: vp.mrp,
                  })),
                },
                variantSpecifications: {
                  deleteMany: {},
                  create: variant.specifications?.map((spec) => ({
                    specificationFieldId: spec.specificationFieldId,
                    value: spec.value,
                  })),
                },
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
    console.log("[PRODUCT_PATCH]", error);
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

export async function DELETE(
  _request: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!params.productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: { id: params.storeId },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    const product = await db.product.delete({
      where: { id: params.productId },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.log("[PRODUCT_DELETE]", error);
    if (error.code === "P2023") {
      return new NextResponse("Invalid product ID", { status: 400 });
    }
    if (error.code === "P2025") {
      return new NextResponse("Product not found", { status: 404 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { storeId?: string; productId: string } }
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
    if (!params.productId) {
      return new NextResponse("Product ID is required", {
        status: 400,
        headers,
      });
    }

    const { searchParams } = new URL(request.url);
    const includeRelated = searchParams.get("includeRelated") === "true";
    const categoryId = searchParams.get("categoryId");
    const locationGroupId = searchParams.get("locationGroupId");
    const pincode = searchParams.get("pincode");

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

    const product = await db.product.findUnique({
      where: {
        id: params.productId,
        isArchieved: false,
      },
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
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404, headers });
    }

    let relatedProducts: any[] = [];
    if (includeRelated && product.categoryId) {
      relatedProducts = await db.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          isArchieved: false,
        },
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
        take: 4,
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    const response = {
      ...product,
      ...(includeRelated && { relatedProducts }),
    };

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.log("[PRODUCT_GET]", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
