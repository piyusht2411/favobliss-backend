import { auth } from "@/auth";
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
  try {
    const {
      name,
      locationIds,
      isCodAvailable,
      deliveryDays,
      isExpressDelivery,
      expressDeliveryText,
    } = await request.json();
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (isCodAvailable === undefined || isCodAvailable === null) {
      return new NextResponse("Cash on Delivery availability is required", {
        status: 400,
      });
    }
    if (!deliveryDays || deliveryDays.length === null) {
      return new NextResponse("Delivery days are required", { status: 400 });
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

    // Validate that all provided locationIds exist and belong to the store
    if (locationIds && locationIds.length > 0) {
      const existingLocations = await db.location.findMany({
        where: {
          id: { in: locationIds },
          storeId: params.storeId,
        },
        select: { id: true },
      });

      if (existingLocations.length !== locationIds.length) {
        return new NextResponse(
          "One or more location IDs are invalid or do not belong to this store",
          { status: 400 }
        );
      }
    }

    const locationGroup = await db.locationGroup.create({
      data: {
        name,
        storeId: params.storeId,
        isCodAvailable,
        deliveryDays,
        isExpressDelivery,
        expressDeliveryText,
        locations:
          locationIds && locationIds.length > 0
            ? {
                connect: locationIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        locations: true,
      },
    });

    return NextResponse.json(locationGroup);
  } catch (error) {
    console.log("[LOCATION_GROUP_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    if (!params.storeId) {
      return new NextResponse("StoreId is required", { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (name) {
      const locationGroup = await db.locationGroup.findFirst({
        where: {
          name,
          storeId: params.storeId,
        },
        include: {
          locations: true,
        },
      });

      if (!locationGroup) {
        return new NextResponse("Location Group not found", { status: 404 });
      }

      return NextResponse.json(locationGroup);
    }

    const locationGroups = await db.locationGroup.findMany({
      where: {
        storeId: params.storeId,
      },
      include: {
        locations: true,
      },
    });

    return NextResponse.json(locationGroups);
  } catch (error) {
    console.log("[LOCATION_GROUP_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
