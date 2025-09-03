import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const headers = {
    "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_FRONTEND_URL || "*",
    "Access-Control-Allow-Methods": "PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  try {
    const { status }: { status?: string } = await request.json();

    if (
      !status ||
      ![
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "OUTOFDELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
        "REFUNDED",
      ].includes(status)
    ) {
      return new NextResponse("Invalid status", { status: 400, headers });
    }

    // Fetch the order
    const order = await db.order.findUnique({
      where: { id: params.orderId },
      include: { orderItems: { include: { variant: true } } },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404, headers });
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["OUTOFDELIVERY", "RETURNED"],
      OUTOFDELIVERY: ["DELIVERED", "RETURNED"],
      DELIVERED: ["RETURNED"],
      CANCELLED: [],
      RETURNED: ["REFUNDED"],
      REFUNDED: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      return new NextResponse(
        `Cannot transition from ${order.status} to ${status}`,
        { status: 400, headers }
      );
    }

    // If canceling, restore stock
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      await Promise.all(
        order.orderItems.map(async (orderItem) => {
          await db.variant.update({
            where: { id: orderItem.variantId },
            data: { stock: { increment: orderItem.quantity } },
          });
        })
      );
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id: params.orderId },
      data: {
        status: status as OrderStatus,
        isCompleted: ["DELIVERED", "REFUNDED"].includes(status), // OUTOFDELIVERY is not completed
      },
    });

    return NextResponse.json(
      { success: true, status: updatedOrder.status },
      { headers }
    );
  } catch (error) {
    console.error("BACKEND ORDER UPDATE API", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const headers = {
    "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_FRONTEND_URL || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }
  try {
    const order = await db.order.findUnique({
      where: { id: params.orderId },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                product: true,
                variantPrices: true,
              },
            },
          },
        },
        // orderProduct: {
        //   include: {
        //     comment: true,
        //   },
        // },
        // shippingAddress: true,
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404, headers });
    }

    // Enrich with additional fields (if needed)
    const enrichedOrder = {
      ...order,
      status: order.status || "PENDING",
      estimatedDeliveryDays: order.estimatedDeliveryDays || null,
      orderNumber: order.orderNumber || "Pending",
    };

    return NextResponse.json(enrichedOrder, { headers });
  } catch (error) {
    console.error("BACKEND ORDER GET API", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
