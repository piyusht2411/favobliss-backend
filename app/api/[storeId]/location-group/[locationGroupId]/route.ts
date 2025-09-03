import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const allowedOrigins = [
  process.env.NEXT_PUBLIC_FRONTEND_URL,
  "http://localhost:3000",
  "https://favobliss.vercel.app",
].filter(Boolean);

export async function PATCH(
  request: Request,
  { params }: { params: { storeId: string; locationGroupId: string } }
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
      return new NextResponse("Store Id is required", { status: 400 });
    }

    if (!params.locationGroupId) {
      return new NextResponse("Location Group Id is required", { status: 400 });
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

    const locationGroup = await db.locationGroup.update({
      where: {
        id: params.locationGroupId,
        storeId: params.storeId,
      },
      data: {
        name,
        isCodAvailable,
        deliveryDays,
        isExpressDelivery,
        expressDeliveryText,
        locations: locationIds
          ? {
              set: locationIds.map((id: string) => ({ id })),
            }
          : { set: [] },
      },
      include: {
        locations: true,
      },
    });

    return NextResponse.json(locationGroup);
  } catch (error) {
    console.log("[LOCATION_GROUP_PATCH]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { storeId: string; locationGroupId: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    if (!params.locationGroupId) {
      return new NextResponse("Location Group Id is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: {
        id: params.storeId,
      },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    const locationGroup = await db.locationGroup.deleteMany({
      where: {
        id: params.locationGroupId,
        storeId: params.storeId,
      },
    });

    return NextResponse.json(locationGroup);
  } catch (error) {
    console.log("[LOCATION_GROUP_DELETE]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { locationGroupId: string } }
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

  try {
    if (!params.locationGroupId) {
      return new NextResponse("Location Group Id is required", {
        status: 400,
        headers,
      });
    }

    const locationGroup = await db.locationGroup.findUnique({
      where: {
        id: params.locationGroupId,
      },
      include: {
        locations: true,
      },
    });

    if (!locationGroup) {
      return new NextResponse("Location Group not found", {
        status: 404,
        headers,
      });
    }

    return NextResponse.json(locationGroup, { headers });
  } catch (error) {
    console.log("[LOCATION_GROUP_GET]", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
