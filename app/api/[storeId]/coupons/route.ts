import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { storeId: string } }
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

    if (!code) {
      return new NextResponse("Coupon code is required", { status: 400 });
    }

    if (value === undefined || value < 0) {
      return new NextResponse("Valid coupon value is required", {
        status: 400,
      });
    }

    if (!startDate) {
      return new NextResponse("Start date is required", { status: 400 });
    }

    if (!expiryDate) {
      return new NextResponse("Expiry date is required", { status: 400 });
    }

    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
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
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
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

    const coupon = await db.coupon.create({
      data: {
        code,
        value,
        isActive,
        startDate: new Date(startDate),
        expiryDate: new Date(expiryDate),
        usagePerUser: usagePerUser || 1,
        usedCount: usedCount || 1,
        description,
        storeId: params.storeId,
        products: {
          create: couponProducts,
        },
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
    console.log("COUPON POST", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    if (!params.storeId) {
      const response = new NextResponse("Store ID is required", { status: 400 });
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }

    const coupons = await db.coupon.findMany({
      where: {
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

    const response = NextResponse.json(coupons);
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error) {
    console.log("COUPON GET", error);
    const response = new NextResponse("Internal server error", { status: 500 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
}
