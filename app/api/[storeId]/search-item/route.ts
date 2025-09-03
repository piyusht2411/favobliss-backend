import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const allowedOrigins = [
  process.env.NEXT_PUBLIC_FRONTEND_URL,
  "http://localhost:3000",
  "https://favobliss.vercel.app",
].filter(Boolean);

export async function GET(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  // Set CORS headers
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
      return new NextResponse("Store ID is required", { status: 400, headers });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();
    const brandName = searchParams.get("brandName");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;
    const brandLimit = Math.floor(limit / 4);
    const categoryLimit = Math.floor(limit / 4);
    const subCategoryLimit = Math.floor(limit / 4);
    const productLimit = query ? Math.ceil(limit / 4) : 4;

    let searchResults;

    if (!query) {
      const brands = await db.brand.findMany({
        where: { storeId: params.storeId },
        orderBy: { createdAt: "desc" },
        take: brandLimit,
      });

      const categories = await db.category.findMany({
        where: { storeId: params.storeId },
        include: {
          subCategories: {
            include: {
              childSubCategories: {
                include: { childSubCategories: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: categoryLimit,
      });

      const transformedCategories = categories.map((category) => ({
        ...category,
        subCategories: category.subCategories
          .filter((sub) => sub.parentId === null)
          .map((sub) => ({
            ...sub,
            childSubCategories: sub.childSubCategories.map((child) => ({
              ...child,
              childSubCategories: child.childSubCategories || [],
            })),
          })),
      }));

      const subCategories = await db.subCategory.findMany({
        where: { storeId: params.storeId },
        include: {
          category: true,
          parent: true,
          childSubCategories: {
            include: { childSubCategories: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: subCategoryLimit,
      });

      // Get products with their variants
      const products = await db.product.findMany({
        where: {
          storeId: params.storeId,
          isArchieved: false,
        },
        include: {
          brand: true,
          category: true,
          subCategory: { include: { parent: true } },
          variants: { 
            include: { 
              size: true, 
              color: true, 
              images: true,
              variantSpecifications: {
                include: { specificationField: { include: { group: true } } }
              }
            } 
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: productLimit,
      });

      searchResults = {
        brands,
        categories: transformedCategories,
        subCategories,
        products,
        pagination: {
          page,
          limit,
          totalBrands: brands.length,
          totalCategories: categories.length,
          totalSubCategories: subCategories.length,
          totalProducts: products.length,
        },
        isSuggested: true,
      };

      console.log(
        `[SEARCH_GET] No query provided, returning suggested data for storeId: ${params.storeId}`
      );
    } else {
      const brands = await db.brand.findMany({
        where: {
          storeId: params.storeId,
          name: { contains: query, mode: "insensitive" },
        },
        take: brandLimit,
      });

      const categories = await db.category.findMany({
        where: {
          storeId: params.storeId,
          name: { contains: query, mode: "insensitive" },
        },
        include: {
          subCategories: {
            include: {
              childSubCategories: {
                include: { childSubCategories: true },
              },
            },
          },
        },
        take: categoryLimit,
      });

      const transformedCategories = categories.map((category) => ({
        ...category,
        subCategories: category.subCategories
          .filter((sub) => sub.parentId === null)
          .map((sub) => ({
            ...sub,
            childSubCategories: sub.childSubCategories.map((child) => ({
              ...child,
              childSubCategories: child.childSubCategories || [],
            })),
          })),
      }));

      const subCategories = await db.subCategory.findMany({
        where: {
          storeId: params.storeId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            {
              childSubCategories: {
                some: {
                  OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    {
                      childSubCategories: {
                        some: {
                          OR: [
                            { name: { contains: query, mode: "insensitive" } },
                            {
                              childSubCategories: {
                                some: {
                                  name: {
                                    contains: query,
                                    mode: "insensitive",
                                  },
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        include: {
          category: true,
          parent: true,
          childSubCategories: {
            include: { childSubCategories: true },
          },
        },
        take: subCategoryLimit,
      });

      // Search in variants instead of products
      const variantsWhere: any = {
        product: {
          storeId: params.storeId,
          isArchieved: false,
        },
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { about: { contains: query, mode: "insensitive" } },
        ],
      };

      if (brandName) {
        const brand = await db.brand.findFirst({
          where: {
            name: brandName,
            storeId: params.storeId,
          },
        });
        if (!brand) {
          return new NextResponse("Brand not found", { status: 404, headers });
        }
        variantsWhere.product.brandId = brand.id;
      }

      // First get variants that match the search criteria
      const matchingVariants = await db.variant.findMany({
        where: variantsWhere,
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              subCategory: { include: { parent: true } },
            }
          },
          size: true,
          color: true,
          images: true,
          variantSpecifications: {
            include: { specificationField: { include: { group: true } } }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: productLimit,
      });

      // Group variants by product to return complete products
      const productsMap = new Map();
      matchingVariants.forEach(variant => {
        if (!productsMap.has(variant.productId)) {
          productsMap.set(variant.productId, {
            ...variant.product,
            variants: []
          });
        }
        productsMap.get(variant.productId).variants.push(variant);
      });

      const products = Array.from(productsMap.values());

      searchResults = {
        brands,
        categories: transformedCategories,
        subCategories,
        products,
        pagination: {
          page,
          limit,
          totalBrands: brands.length,
          totalCategories: categories.length,
          totalSubCategories: subCategories.length,
          totalProducts: products.length,
        },
        isSuggested: false,
      };

      console.log(
        `[SEARCH_GET] Found ${brands.length} brands, ${products.length} products, ${categories.length} categories, ${subCategories.length} subcategories for storeId: ${params.storeId}, query: ${query}, brandName: ${brandName}`
      );
    }

    return NextResponse.json(searchResults, { headers });
  } catch (error) {
    console.log("[SEARCH_GET]", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}