import { db } from "@/lib/db";
import { ReviewSchema } from "@/schemas/review-form-schema";
import { NextResponse } from "next/server";

const allowedOrigins = [
  process.env.NEXT_PUBLIC_FRONTEND_URL,
  "http://localhost:3000",
  "https://favobliss.vercel.app",
].filter(Boolean);

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const origin = request.headers.get("origin");
  const corsOrigin = allowedOrigins.includes(origin ?? "")
    ? origin ?? ""
    : allowedOrigins[0];

  const headers = {
    "Access-Control-Allow-Origin": corsOrigin || "",
    "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  try {
    const body = await request.json();
    const validatedData = ReviewSchema.safeParse(body);

    if (!validatedData.success) {
      return new NextResponse(
        JSON.stringify({ errors: validatedData.error.format() }),
        { status: 400, headers }
      );
    }

    const {
      userName,
      rating,
      text,
      images = [],
      videos = [],
      userId,
      categoryRatings = [],
    } = validatedData.data;

    if (!params.productId) {
      return new NextResponse("Product ID is required", {
        status: 400,
        headers,
      });
    }

    const product = await db.product.findUnique({
      where: { id: params.productId },
      include: {
        subCategory: {
          select: {
            reviewCategories: true,
          },
        },
      },
    });

    if (!product) {
      return new NextResponse("Product does not exist", {
        status: 404,
        headers,
      });
    }

    // Validate category ratings
    const validCategories =
      product.subCategory?.reviewCategories.map((cat: any) => cat.name) || [];
    const invalidCategories = categoryRatings.filter(
      (cr: { categoryName: string; rating: number }) =>
        !validCategories.includes(cr.categoryName) ||
        cr.rating < 1 ||
        cr.rating > 5
    );

    if (invalidCategories.length > 0) {
      return new NextResponse("Invalid category ratings", {
        status: 400,
        headers,
      });
    }

    const review = await db.review.create({
      data: {
        productId: params.productId,
        userName,
        userId,
        rating,
        text,
        images: {
          create: images.map((url) => ({ url })),
        },
        videos: {
          create: videos.map((url) => ({ url })),
        },
        categoryRatings: {
          create: categoryRatings.map(
            (cr: { categoryName: string; rating: number }) => ({
              categoryName: cr.categoryName,
              rating: cr.rating,
            })
          ),
        },
      },
      include: {
        images: true,
        videos: true,
        categoryRatings: true,
        product: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json(review, { headers });
  } catch (error: any) {
    console.log("[REVIEWS_POST]", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
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
        status: 400, headers,
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    const reviews = await db.review.findMany({
      where: {
        productId: params.productId,
      },
      include: {
        images: true,
        videos: true,
        categoryRatings: true,
        product: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    });

    return NextResponse.json(reviews, { headers });
  } catch (error) {
    console.log("[REVIEWS_GET]", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
