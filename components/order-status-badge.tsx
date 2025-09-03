import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@prisma/client";

export function OrderStatusBadge({ status }: { status?: OrderStatus }) {
  const label = status ?? "PENDING";
  const map: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive";
      className?: string;
      text: string;
    }
  > = {
    PENDING: { variant: "secondary", text: "Pending" },
    PROCESSING: { variant: "secondary", text: "Processing" },
    SHIPPED: {
      variant: "default",
      className: "bg-sky-600 hover:bg-sky-600",
      text: "Shipped",
    },
    DELIVERED: {
      variant: "default",
      className: "bg-emerald-600 hover:bg-emerald-600",
      text: "Delivered",
    },
    COMPLETED: {
      variant: "default",
      className: "bg-emerald-600 hover:bg-emerald-600",
      text: "Completed",
    },
    CANCELLED: { variant: "destructive", text: "Cancelled" },
    RETURNED: { variant: "destructive", text: "Returned" },
  };

  const cfg = map[label as string] ?? map.PENDING;
  return (
    <Badge variant={cfg.variant} className={cfg.className}>
      {cfg.text}
    </Badge>
  );
}
