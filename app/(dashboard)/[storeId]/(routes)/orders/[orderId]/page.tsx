import type React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { formatter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@prisma/client";
import { ChevronLeft, FileText } from "lucide-react";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderItemsTable } from "@/components/order-items-table";

type PageParams = { params: { storeId: string; orderId: string } };

async function getOrder(storeId: string, orderId: string) {
  const order = await db.order.findFirst({
    where: { id: orderId, storeId },
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
  return order;
}

function computeTotals(
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>
) {
  const subtotal = order.orderItems.reduce((total, item) => {
    const variantPrice = item.variant?.variantPrices?.[0]?.price ?? 0;
    const unitPrice = item.price && item.price > 0 ? item.price : variantPrice;
    return total + unitPrice * item.quantity;
  }, 0);

  const discount = order.discount ?? 0;
  const total = Math.max(subtotal - discount, 0);

  return { subtotal, discount, total };
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">
        {value ?? "-"}
      </span>
    </div>
  );
}

export default async function OrderDetailPage({ params }: PageParams) {
  const order = await getOrder(params.storeId, params.orderId);
  if (!order) notFound();

  const { subtotal, discount, total } = computeTotals(order);

  const friendlyId =
    order.orderNumber || `#${order.id.slice(-6).toUpperCase()}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Back to orders"
          >
            <Link href={`/${params.storeId}/orders`}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold leading-tight text-pretty">
              Order {friendlyId}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {format(order.createdAt, "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status as OrderStatus} />
          {order.isPaid ? (
            <Badge
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-600"
            >
              Paid
            </Badge>
          ) : (
            <Badge variant="secondary">Unpaid</Badge>
          )}
          <Button asChild>
            <Link
              href={`/${params.storeId}/orders/${order.id}/invoice`}
              aria-label="View invoice"
            >
              <FileText className="mr-2 h-4 w-4" />
              Invoice
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left column: info */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow
                label="Order number"
                value={order.orderNumber || friendlyId}
              />
              <DetailRow
                label="Invoice number"
                value={order.invoiceNumber || "-"}
              />
              <DetailRow
                label="Status"
                value={
                  <OrderStatusBadge status={order.status as OrderStatus} />
                }
              />
              <DetailRow
                label="Estimated delivery"
                value={
                  order.estimatedDeliveryDays
                    ? `${order.estimatedDeliveryDays} day(s)`
                    : "-"
                }
              />
              <DetailRow
                label="Updated"
                value={format(order.updatedAt, "MMM d, yyyy h:mm a")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Name" value={order.customerName || "-"} />
              <DetailRow label="Email" value={order.customerEmail || "-"} />
              <DetailRow label="Phone" value={order.phone || "-"} />
              <DetailRow
                label="GST Number"
                value={order.gstNumber || "Not provided"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Address" value={order.address || "-"} />
              <DetailRow label="Zip code" value={order.zipCode || "-"} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: items and totals */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsTable items={order.orderItems} formatter={formatter} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow
                  label="Payment status"
                  value={order.isPaid ? "Paid" : "Unpaid"}
                />
                <DetailRow
                  label="Created"
                  value={format(order.createdAt, "MMM d, yyyy h:mm a")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Totals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow
                  label="Subtotal"
                  value={formatter.format(subtotal)}
                />
                <DetailRow
                  label="Discount"
                  value={
                    discount > 0
                      ? `- ${formatter.format(discount)}`
                      : formatter.format(0)
                  }
                />
                <Separator />
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold">Grand total</span>
                  <span className="text-base font-semibold">
                    {formatter.format(total)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
