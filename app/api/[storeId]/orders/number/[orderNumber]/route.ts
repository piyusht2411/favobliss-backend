// backend: pages/api/orders/number/[orderNumber].ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const order = await db.order.findUnique({
      where: { orderNumber: params.orderNumber },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                product: true,
                size: true,
                color: true,
                variantPrices: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      storeId: order.storeId,
      isPaid: order.isPaid,
      phone: order.phone,
      address: order.address,
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber,
      isCompleted: order.isCompleted,
      gstNumber: order.gstNumber,
      discount: order.discount || 0,
      status: order.status,
      estimatedDeliveryDays: order.estimatedDeliveryDays,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      zipCode: order.zipCode,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderItems: order.orderItems,
    });
  } catch (error) {
    console.error("BACKEND ORDER BY NUMBER GET API", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
