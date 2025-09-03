import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Product } from "@prisma/client";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { storeId: string; couponId: string } }
) {
  try {
    const session = await auth();
    const {
      code,
      isActive,
      value,
      startDate,
      expiryDate,
      productIds,
      usagePerUser,
      usedCount,
      description,
    } = await request.json();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!params.couponId) {
      return new NextResponse("Coupon ID is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: {
        id: params.storeId,
      },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    // Validate productIds if provided
    let couponProducts: { productId: string }[] = [];
    if (productIds && Array.isArray(productIds)) {
      const products = await db.product.findMany({
        where: {
          id: { in: productIds },
          storeId: params.storeId,
        },
      });

      if (products.length !== productIds.length) {
        return new NextResponse(
          "Some products are invalid or do not belong to this store",
          { status: 400 }
        );
      }

      couponProducts = productIds.map((productId: string) => ({
        productId,
      }));
    }

    const coupon = await db.coupon.update({
      where: {
        id: params.couponId,
        storeId: params.storeId,
      },
      data: {
        code,
        isActive,
        value,
        startDate: startDate ? new Date(startDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        usagePerUser,
        usedCount,
        description,
        products: productIds
          ? {
              deleteMany: {},
              create: couponProducts,
            }
          : undefined,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.log("COUPON PATCH", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { storeId: string; couponId: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!params.couponId) {
      return new NextResponse("Coupon ID is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: {
        id: params.storeId,
      },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    const coupon = await db.coupon.delete({
      where: {
        id: params.couponId,
        storeId: params.storeId,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.log("COUPON DELETE", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { storeId: string; couponId: string } }
) {
  try {
    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!params.couponId) {
      return new NextResponse("Coupon ID is required", { status: 400 });
    }

    const coupon = await db.coupon.findUnique({
      where: {
        id: params.couponId,
        storeId: params.storeId,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!coupon) {
      return new NextResponse("Coupon not found", { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.log("COUPON GET", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
