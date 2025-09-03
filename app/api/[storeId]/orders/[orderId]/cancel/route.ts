import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
    // Fetch the order
    const order = await db.order.findUnique({
      where: { id: params.orderId },
      include: { orderItems: { include: { variant: true } } },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404, headers });
    }

    // Check if order can be canceled (e.g., not SHIPPED, DELIVERED, or already CANCELLED)
    if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status)) {
      return new NextResponse("Order cannot be canceled", {
        status: 400,
        headers,
      });
    }

    // Update order status to CANCELLED
    const updatedOrder = await db.order.update({
      where: { id: params.orderId },
      data: { status: "CANCELLED", isCompleted: false },
      include: { orderItems: { include: { variant: true } } },
    });

    // Restore stock for each order item
    await Promise.all(
      updatedOrder.orderItems.map(async (orderItem) => {
        await db.variant.update({
          where: { id: orderItem.variantId },
          data: {
            stock: {
              increment: orderItem.quantity,
            },
          },
        });
      })
    );

    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error("BACKEND ORDER CANCEL API", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
