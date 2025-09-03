import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type OrderItemsTableProps = {
  items: Array<{
    id: string;
    quantity: number;
    price?: number | null;
    variant?: {
      name: string;
      size?: { value?: string | null } | null;
      color?: { name?: string | null } | null;
      variantPrices?: Array<{ price: number }> | null;
    } | null;
  }>;
  formatter: Intl.NumberFormat;
};

export function OrderItemsTable({ items, formatter }: OrderItemsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Options</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Unit price</TableHead>
          <TableHead className="text-right">Subtotal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((it) => {
          const size = it.variant?.size?.value
            ? `${it.variant?.size?.value}`
            : "";
          const color = it.variant?.color?.name
            ? `${it.variant?.color?.name}`
            : "";
          const options = [size, color].filter(Boolean).join(" • ") || "-";
          const variantPrice = it.variant?.variantPrices?.[0]?.price ?? 0;
          const unitPrice = it.price && it.price > 0 ? it.price : variantPrice;
          const subtotal = unitPrice * it.quantity;

          return (
            <TableRow key={it.id}>
              <TableCell className="font-medium">
                {it.variant?.name ?? it.id}
              </TableCell>
              <TableCell className={cn("text-muted-foreground")}>
                {options}
              </TableCell>
              <TableCell className="text-right">{it.quantity}</TableCell>
              <TableCell className="text-right">
                {formatter.format(unitPrice)}
              </TableCell>
              <TableCell className="text-right">
                {formatter.format(subtotal)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
