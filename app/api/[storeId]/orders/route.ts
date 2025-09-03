import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateInvoiceNumber, generateOrderNumber } from "@/lib/utils";

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

  // Determine if the origin is allowed
  const corsOrigin = allowedOrigins.includes(origin ?? "")
    ? origin ?? ""
    : allowedOrigins[0];

  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": corsOrigin || "",
    "Access-Control-Allow-Methods": "POST,  OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }
  try {
    const {
      orderItems,
      phone,
      address,
      isPaid,
      isCompleted,
      gstNumber,
      discount,
      zipCode,
      customerId,
      customerName,
      customerEmail,
    }: {
      orderItems: {
        variantId: string;
        quantity: number;
        price: number;
        mrp: number;
        name: string;
      }[];
      phone: string;
      address: string;
      isPaid?: boolean;
      isCompleted?: boolean;
      gstNumber?: string;
      discount?: number;
      zipCode?: string;
      customerId?: string;
      customerName?: string;
      customerEmail?: string;
    } = await request.json();

    if (!orderItems || orderItems.length === 0 || !phone || !address) {
      return new NextResponse("Missing required fields", {
        status: 400,
        headers,
      });
    }

    // Validate store
    const store = await db.store.findUnique({ where: { id: params.storeId } });
    if (!store) {
      console.log("first");
      return new NextResponse("Store not found", { status: 404, headers });
    }

    // Validate variants and stock
    const variantIds = orderItems.map((item) => item.variantId);
    const variants = await db.variant.findMany({
      where: { id: { in: variantIds } },
    });

    if (variants.length !== variantIds.length) {
      console.log("Some variants not found:");
      return new NextResponse("Some variants not found", {
        status: 400,
        headers,
      });
    }

    for (const item of orderItems) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant || variant.stock < item.quantity) {
        return new NextResponse(
          `Insufficient stock for variant ${item.variantId}`,
          {
            status: 400,
          }
        );
      }
    }

    if (gstNumber) {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber)) {
        return new NextResponse("Invalid GST number format", { status: 400 });
      }
    }

    let estimatedDeliveryDays = 3;
    if (zipCode) {
      const location = await db.location.findFirst({
        where: { pincode: zipCode, storeId: params.storeId },
        include: {
          locationGroup: true,
        },
      });

      if (location?.locationGroup?.deliveryDays) {
        estimatedDeliveryDays = location.locationGroup.deliveryDays;
      }
    }

    let orderNumber: string;
    try {
      orderNumber = await generateOrderNumber();
    } catch (error: any) {
      console.error("Order number generation error:", error.message);
      return new NextResponse(error.message, { status: 500 });
    }

    let invoiceNumber: string;
    try {
      invoiceNumber = await generateInvoiceNumber();
    } catch (error: any) {
      console.error("Invoice number generation error:", error.message);
      return new NextResponse(error.message, { status: 500 });
    }

    const order = await db.order.create({
      data: {
        storeId: params.storeId,
        phone,
        address,
        isPaid: isPaid ?? false,
        isCompleted: isCompleted ?? false,
        gstNumber,
        discount: discount,
        orderNumber,
        invoiceNumber,
        status: "PENDING",
        estimatedDeliveryDays,
        customerId,
        customerName,
        customerEmail,
        zipCode,
        orderItems: {
          create: orderItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            mrp: item.mrp,
            name: item.name,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            variant: true,
          },
        },
      },
    });

    await db.$transaction(async (prisma) => {
      for (const item of orderItems) {
        await prisma.variant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    });

    return NextResponse.json(
      { id: order.id, orderNumber: order.orderNumber },
      { headers }
    );
  } catch (error) {
    console.error("BACKEND ORDER POST API", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
