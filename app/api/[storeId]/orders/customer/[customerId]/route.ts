import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const orders = await db.order.findMany({
      where: { customerId: params.customerId },
      include: {
        orderItems: {
          include: { variant: true }, // Include if needed for details
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!orders.length) {
      return NextResponse.json([]); // No orders found
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("BACKEND ORDERS BY CUSTOMER GET API", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
