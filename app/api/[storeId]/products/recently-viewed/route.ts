import { db } from "@/lib/db";
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
  const origin = request.headers.get("origin");
  const corsOrigin = allowedOrigins.includes(origin ?? "")
    ? origin ?? ""
    : allowedOrigins[0];

  const headers = {
    "Access-Control-Allow-Origin": corsOrigin || "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const body = await request.json();
    const { productIds, locationGroupId } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return new NextResponse(
        "Product IDs are required and must be a non-empty array",
        { status: 400, headers }
      );
    }

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
              where: locationGroupId ? { locationGroupId } : undefined,
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
    });

    // Map products to include ratings
    const productsWithRatings = products.map((product) => {
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

    console.log(
      `Fetched ${products.length} recently viewed products for storeId: ${params.storeId}`
    );

    return NextResponse.json(productsWithRatings, { headers });
  } catch (error) {
    console.log("[RECENTLY_VIEWED_POST]", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
