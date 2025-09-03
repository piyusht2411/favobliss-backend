import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const allowedOrigins = [
  process.env.NEXT_PUBLIC_FRONTEND_URL,
  "http://localhost:3000",
  "https://favobliss.vercel.app",
].filter(Boolean);

export async function GET(
  request: Request,
  { params }: { params: { storeId: string; categoryId: string } }
) {
  const origin = request.headers.get("origin");

  // Determine if the origin is allowed
  const corsOrigin = allowedOrigins.includes(origin ?? "")
    ? origin ?? ""
    : allowedOrigins[0];

  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
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

    if (!params.categoryId) {
      return new NextResponse("Category ID is required", {
        status: 400,
        headers,
      });
    }

    const storeById = await db.store.findUnique({
      where: { id: params.storeId },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404, headers });
    }

    const categoryById = await db.category.findUnique({
      where: { id: params.categoryId, storeId: params.storeId },
    });

    if (!categoryById) {
      return new NextResponse("Category does not exist", {
        status: 404,
        headers,
      });
    }

    const subCategories = await db.subCategory.findMany({
      where: {
        storeId: params.storeId,
        categoryId: params.categoryId,
      },
      include: {
        category: true,
        parent: true,
        childSubCategories: {
          include: {
            childSubCategories: {
              include: {
                childSubCategories: true,
              },
            },
          },
        },
      },
    });

    // Transform subcategories to filter out those with parentId (if you only want top-level subcategories)
    const transformedSubCategories = subCategories
      .filter((sub) => sub.parentId === null)
      .map((sub) => ({
        ...sub,
        childSubCategories: sub.childSubCategories.map((child) => ({
          ...child,
          childSubCategories: child.childSubCategories.map((grandchild) => ({
            ...grandchild,
            childSubCategories: grandchild.childSubCategories || [],
          })),
        })),
      }));

    return NextResponse.json(transformedSubCategories, { headers });
  } catch (error) {
    console.log("[SUBCATEGORIES_BY_CATEGORY_GET]", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
