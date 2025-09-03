import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const allowedOrigins = [
  process.env.NEXT_PUBLIC_FRONTEND_URL,
  "http://localhost:3000",
  "https://favobliss.vercel.app",
].filter(Boolean);

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
      return new NextResponse("Store Id is required", { status: 400, headers });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const timeFrame = searchParams.get("timeFrame") || "30 days";
    const pincode = searchParams.get("pincode");

    console.log("Received filters:", {
      categoryId,
      page,
      limit,
      timeFrame,
      pincode,
    });

    // Calculate start date based on time frame
    let startDate = new Date();
    if (timeFrame === "7 days") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeFrame === "30 days") {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeFrame === "90 days") {
      startDate.setDate(startDate.getDate() - 90);
    } else if (timeFrame !== "all time") {
      return new NextResponse("Invalid time frame", { status: 400, headers });
    }

    // Find location group based on pincode and storeId
    let locationGroup = null;
    if (pincode) {
      locationGroup = await db.location.findFirst({
        where: {
          storeId: params.storeId,
          pincode,
        },
        select: {
          locationGroupId: true,
        },
      });
      if (!locationGroup) {
        console.log(`No location group found for pincode: ${pincode}`);
      }
    }

    // Filter for orders
    const whereOrder: any = {
      storeId: params.storeId,
      isPaid: true,
    };

    if (timeFrame !== "all time") {
      whereOrder.createdAt = { gte: startDate };
    }

    // Get relevant order IDs
    const orders = await db.order.findMany({
      where: whereOrder,
      select: { id: true },
    });
    const orderIds = orders.map((order) => order.id);

    // Exit early if no orders found
    if (orderIds.length === 0) {
      console.log("No orders found in the specified time frame");
      return NextResponse.json([], { headers });
    }

    // Aggregate sales by product through variants
    const orderItems = await db.orderItem.findMany({
      where: {
        orderId: { in: orderIds },
        variant: {
          product: {
            isArchieved: false,
            ...(categoryId ? { categoryId } : {}),
          },
        },
      },
      select: {
        quantity: true,
        variant: {
          select: {
            productId: true,
          },
        },
      },
    });

    // Aggregate quantities by product ID
    const productSales = new Map<string, number>();
    for (const item of orderItems) {
      const productId = item.variant.productId;
      const total = productSales.get(productId) || 0;
      productSales.set(productId, total + item.quantity);
    }

    // Sort products by total sold
    const sortedProducts = Array.from(productSales.entries())
      .map(([productId, totalSold]) => ({ productId, totalSold }))
      .sort((a, b) => b.totalSold - a.totalSold);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedProducts = sortedProducts.slice(
      startIndex,
      startIndex + limit
    );
    const productIds = paginatedProducts.map((p) => p.productId);

    // Exit early if no products found
    if (productIds.length === 0) {
      console.log("No hot deal products found after filtering");
      return NextResponse.json([], { headers });
    }

    // Fetch product details with variantPrices filtered by location group
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        storeId: params.storeId,
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
              where: locationGroup?.locationGroupId
                ? { locationGroupId: locationGroup.locationGroupId }
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
    });

    // Combine sales data with product details and include ratings
    const result = paginatedProducts
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;

        // Calculate ratings
        const ratings = product.reviews.map((review) => review.rating);
        const numberOfRatings = ratings.length;
        const averageRating =
          numberOfRatings > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / numberOfRatings
            : 0;

        // Map variants to include price and variant-specific fields
        const updatedVariants = product.variants.map((variant) => {
          const price = variant.variantPrices[0]?.price || 0; // Use first price or 0 as fallback
          return {
            ...variant,
            price, // Add price field to variant
          };
        });

        const { reviews, ...productWithoutReviews } = product;
        return {
          ...productWithoutReviews,
          totalSold: item.totalSold,
          variants: updatedVariants,
          averageRating: Number(averageRating.toFixed(2)),
          numberOfRatings,
        };
      })
      .filter(Boolean);

    console.log(`Found ${result.length} hot deal products`);
    return NextResponse.json(result, { headers });
  } catch (error) {
    console.log("[HOT_DEALS_GET]", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
