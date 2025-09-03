import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { name, slug, bannerImage, cardImage, description } =
      await request.json();
    const session = await auth();

    if (!session) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (!slug) {
      return new NextResponse("Slug is required", { status: 400 });
    }

    if (!params.storeId) {
      return new NextResponse("StoreId is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: {
        id: params.storeId,
      },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    // Check for unique slug
    const existingBrand = await db.brand.findFirst({
      where: {
        slug,
        storeId: params.storeId,
      },
    });

    if (existingBrand) {
      return new NextResponse("Brand slug already exists", { status: 400 });
    }

    const brand = await db.brand.create({
      data: {
        name,
        slug,
        bannerImage,
        description,
        cardImage,
        storeId: params.storeId,
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    console.log("[BRANDS_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const brand = await db.brand.findUnique({
        where: {
          slug,
          storeId: params.storeId,
        },
      });

      if (!brand) {
        return new NextResponse("Brand not found", { status: 404 });
      }

      return NextResponse.json(brand);
    }

    const brands = await db.brand.findMany({
      where: {
        storeId: params.storeId,
      },
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.log("[BRANDS_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
