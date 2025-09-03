import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { storeId: string; brandId: string } }
) {
  try {
    const session = await auth();
    const { name, slug, bannerImage, cardImage, description } =
      await request.json();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (!slug) {
      return new NextResponse("Slug is required", { status: 400 });
    }

    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    if (!params.brandId) {
      return new NextResponse("Brand Id is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: {
        id: params.storeId,
      },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    // Check for unique slug (excluding the current brand)
    const existingBrand = await db.brand.findFirst({
      where: {
        slug,
        storeId: params.storeId,
        id: { not: params.brandId },
      },
    });

    if (existingBrand) {
      return new NextResponse("Brand slug already exists", { status: 400 });
    }

    const brand = await db.brand.update({
      where: {
        id: params.brandId,
      },
      data: {
        name,
        slug,
        bannerImage,
        description,
        cardImage,
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    console.log("[BRANDS_PATCH]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { storeId: string; brandId: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    if (!params.brandId) {
      return new NextResponse("Brand Id is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: {
        id: params.storeId,
      },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    // Check if any products are using this brand
    const productsUsingBrand = await db.product.findFirst({
      where: {
        brandId: params.brandId,
        storeId: params.storeId,
      },
    });

    if (productsUsingBrand) {
      return new NextResponse(
        "Cannot delete brand because it is used by one or more products",
        { status: 400 }
      );
    }

    const brand = await db.brand.delete({
      where: {
        id: params.brandId,
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    console.log("[BRANDS_DELETE]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    if (!params.brandId) {
      return new NextResponse("Brand Id is required", { status: 400 });
    }

    const brand = await db.brand.findUnique({
      where: {
        id: params.brandId,
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    console.log("[BRAND_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
