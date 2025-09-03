import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("x-razorpay-signature") as string;

  let event;

  try {
    // Verify the webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Webhook signature verification failed", {
        expectedSignature,
        signature,
      });
      return new NextResponse("Invalid webhook signature", { status: 400 });
    }

    event = JSON.parse(body);
  } catch (error: any) {
    console.error("Webhook parsing error:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Log the full event for debugging
  console.log("Webhook event received:", JSON.stringify(event, null, 2));

  // Handle only the order.paid event
  if (event.event === "order.paid") {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes?.id;

    if (!orderId) {
      console.error("Order ID not found in webhook", { payment });
      return new NextResponse("Order ID not found in webhook", { status: 400 });
    }

    // Check if the order exists and is not already paid
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      console.error(`Order not found: ${orderId}`);
      return new NextResponse(`Order not found: ${orderId}`, { status: 404 });
    }

    if (existingOrder.isPaid) {
      console.log(`Order ${orderId} is already paid, skipping processing`);
      return new NextResponse(null, { status: 200 });
    }

    let addressString = "";
    try {
      if (payment.notes?.address) {
        const address = JSON.parse(payment.notes.address);
        addressString = [
          address.address || "",
          address.landmark || "",
          address.town || "",
          address.district || "",
          address.state || "",
          address.zipCode || "",
        ]
          .filter((c) => c)
          .join(", ");
      } else {
        console.warn("No address found in payment.notes");
      }
    } catch (error) {
      console.error("Error parsing address:", error);
      addressString = "";
    }

    try {
      const order = await db.order.update({
        where: {
          id: orderId,
        },
        data: {
          isPaid: true,
          isCompleted: true,
          address: addressString || "No address provided",
          phone: payment.contact || "No phone provided",
        },
        include: {
          orderItems: {
            include: {
              variant: true,
            },
          },
        },
      });

      const updatedItems = await Promise.all(
        order.orderItems.map(async (orderItem) => {
          const variant = await db.variant.findUnique({
            where: {
              id: orderItem.variantId,
            },
          });

          if (!variant) {
            console.warn(`Variant not found for orderItem: ${orderItem.id}`);
            return null;
          }

          const newStock = Math.max(0, variant.stock - orderItem.quantity);

          const updatedVariant = await db.variant.update({
            where: {
              id: variant.id,
            },
            data: {
              stock: newStock,
            },
          });

          return updatedVariant;
        })
      );

      return new NextResponse(null, { status: 200 });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return new NextResponse("Something went wrong!", { status: 500 });
    }
  }

  console.log("Unhandled event type:", event.event);
  return new NextResponse(null, { status: 200 });
}
