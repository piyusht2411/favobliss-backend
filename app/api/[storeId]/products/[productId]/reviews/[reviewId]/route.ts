import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const allowedOrigins = [
  process.env.NEXT_PUBLIC_FRONTEND_URL,
  "http://localhost:3000",
  "https://favobliss.vercel.app",
].filter(Boolean);

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string; reviewId: string } }
) {
  const origin = request.headers.get("origin");
  const corsOrigin = allowedOrigins.includes(origin ?? "")
    ? origin ?? ""
    : allowedOrigins[0];

  const headers = {
    "Access-Control-Allow-Origin": corsOrigin || "",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
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

    if (!params.reviewId) {
      return new NextResponse("Review ID is required", {
        status: 400,
        headers,
      });
    }

    const product = await db.product.findUnique({
      where: { id: params.productId },
    });

    if (!product) {
      return new NextResponse("Product does not exist", {
        status: 404,
        headers,
      });
    }

    const review = await db.review.delete({
      where: {
        id: params.reviewId,
        productId: params.productId,
      },
      include: {
        images: true,
        videos: true,
        categoryRatings: true,
      },
    });

    return NextResponse.json(review, { headers });
  } catch (error: any) {
    console.log("[REVIEWS_DELETE]", error);
    if (error.code === "P2023") {
      return new NextResponse("Invalid review ID", { status: 400, headers });
    }
    if (error.code === "P2025") {
      return new NextResponse("Review not found", { status: 404, headers });
    }
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
