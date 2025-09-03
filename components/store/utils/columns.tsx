"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellActions } from "./cell-actions";
import { CategoryCellActions } from "./category-cell-actions";
import { SizeCellActions } from "./size-cell-actions";
import { ColorCellActions } from "./color-cell-actions";
import { ProductCellActions } from "./product-cell-actions";
import { SubCategoryCellActions } from "./subcategory-cell-actions";
import { ReviewCellActions } from "./review-cell-actions";
import { LocationCellActions } from "./location-cell-actions";
import { BrandCellActions } from "./brand-cell-actions";
import { CouponCellActions } from "./coupon-cell-actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { OrderCellActions } from "./orders-cell-actions";
import { LocationGroupCellActions } from "./location-group-cell-actions";

export type Billboard = {
  id: string;
  label: string;
  createdAt: string;
};

export type ReviewColumn = {
  id: string;
  productName: string;
  userName: string;
  rating: number;
  text: string;
  imageCount: number;
  createdAt: string;
  productId: string;
};

export type BrandColumn = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export const reviewColumns: ColumnDef<ReviewColumn>[] = [
  {
    accessorKey: "productName",
    header: "Product Name",
  },
  {
    accessorKey: "userName",
    header: "User Name",
  },
  {
    accessorKey: "rating",
    header: "Rating",
  },
  {
    accessorKey: "text",
    header: "Review Text",
    cell: ({ row }) => (
      <div className="max-w-xs truncate">{row.original.text}</div>
    ),
  },
  {
    accessorKey: "imageCount",
    header: "Images",
    cell: ({ row }) => <div>{row.original.imageCount} image(s)</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
  },
  {
    id: "actions",
    cell: ({ row }) => <ReviewCellActions data={row.original} />,
  },
];

export const brandColumns: ColumnDef<BrandColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "slug",
    header: "Slug",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
  },
  {
    id: "actions",
    cell: ({ row }) => <BrandCellActions data={row.original} />,
  },
];

export type LocationGroupColumn = {
  id: string;
  name: string;
  locationCount: number;
  isCodAvailable: boolean;
  deliveryDays: number;
  isExpressDelivery: boolean;
  createdAt: string;
};

export const locationGroupColumns: ColumnDef<LocationGroupColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "locationCount",
    header: "Locations",
  },
  {
    accessorKey: "deliveryDays",
    header: "Delivery Days",
  },
  {
    accessorKey: "isCodAvailable",
    header: "COD Available",
    cell: ({ row }) => (row.original.isCodAvailable ? "Yes" : "No"),
  },
  {
    accessorKey: "isExpressDelivery",
    header: "Express Delivery Available",
    cell: ({ row }) => (row.original.isExpressDelivery ? "Yes" : "No"),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
  },
  {
    id: "actions",
    cell: ({ row }) => <LocationGroupCellActions data={row.original} />,
  },
];

export const columns: ColumnDef<Billboard>[] = [
  {
    accessorKey: "label",
    header: "Label",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions data={row.original} />,
  },
];

export type CategoryColumn = {
  id: string;
  name: string;
  createdAt: string;
  subCategories?: { id: string; name: string; billboardLabel: string }[];
};

export const categoryColumns: ColumnDef<CategoryColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <CategoryCellActions data={row.original} />,
  },
];

export type SubCategoryColumn = {
  id: string;
  name: string;
  categoryName: string;
  parentName?: string;
  createdAt: string;
};

export const subCategoryColumns: ColumnDef<SubCategoryColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "categoryName",
    header: "Category",
  },
  {
    accessorKey: "parentName",
    header: "Parent Subcategory",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <SubCategoryCellActions data={row.original} />,
  },
];

export type SizeColumn = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
};

export const sizeColumns: ColumnDef<SizeColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "value",
    header: "Value",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <SizeCellActions data={row.original} />,
  },
];

export type CouponColumn = {
  id: string;
  code: string;
  isActive: boolean;
  value: number;
  startDate: string;
  expiryDate: string;
  productCount: number;
  productNames: string[];
  usagePerUser: number;
  usedCount: number;
  description: string;
  createdAt: string;
};

export const couponColumns: ColumnDef<CouponColumn>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "value",
    header: "Value",
  },
  {
    accessorKey: "isActive",
    header: "Active",
  },

  {
    accessorKey: "startDate",
    header: "Start Date",
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry Date",
  },
  {
    accessorKey: "productCount",
    header: "Applicable Products",
    cell: ({ row }) => (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="link" className="p-0 h-auto font-normal">
            {row.original.productCount}{" "}
            {row.original.productCount === 1 ? "product" : "products"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium">Applicable Products</h4>
            {row.original.productNames.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No products assigned
              </p>
            ) : (
              <ul className="list-disc pl-5 text-sm">
                {row.original.productNames.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
    ),
  },
  {
    accessorKey: "usagePerUser",
    header: "Usage Per User",
  },
  {
    accessorKey: "usedCount",
    header: "Used Count",
  },
  {
    id: "actions",
    cell: ({ row }) => <CouponCellActions data={row.original} />,
  },
];

export type LocationColumn = {
  id: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  createdAt: string;
};

export const locationColumns: ColumnDef<LocationColumn>[] = [
  {
    accessorKey: "pincode",
    header: "Pincode",
  },
  {
    accessorKey: "city",
    header: "City",
  },
  {
    accessorKey: "state",
    header: "State",
  },
  {
    accessorKey: "country",
    header: "Country",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
  },
  {
    id: "actions",
    cell: ({ row }) => <LocationCellActions data={row.original} />,
  },
];

export type ColorColumn = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
};

export const colorColumns: ColumnDef<ColorColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => (
      <div className="flex items-center gap-x-2">
        {row.original.value}
        <div
          className="h-5 w-6 rounded-full"
          style={{ backgroundColor: row.original.value }}
        />
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <ColorCellActions data={row.original} />,
  },
];

export type ProductColumn = {
  id: string;
  name: string;
  isFeatured: boolean;
  isArchieved: boolean;
  price: string;
  stock: number;
  category: string;
  subCategory?: string;
  size: string;
  color?: string;
  createdAt: string;
};

export const productColumns: ColumnDef<ProductColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "price",
    header: "Price",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "subCategory",
    header: "Subcategory",
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "size",
    header: "Size",
  },
  {
    accessorKey: "isArchieved",
    header: "Archived",
  },
  {
    accessorKey: "isFeatured",
    header: "Featured",
  },
  // {
  //   accessorKey: "specifications",
  //   header: "Specifications",
  // },
  // {
  //   accessorKey: "color",
  //   header: "Color",
  //   cell: ({ row }) => (
  //     <div className="flex items-center">
  //       <div
  //         className="h-5 w-6 rounded-full"
  //         style={{ backgroundColor: row.original.color }}
  //       />
  //     </div>
  //   ),
  // },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <ProductCellActions data={row.original} />,
  },
];

export type OrderColumn = {
  id: string;
  phone: string;
  address: string;
  isPaid: boolean;
  status: string;
  products: string;
  totalPrice: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  gstnumber: string;
  createdAt: string;
};

export const orderColumns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order Number",
  },
  {
    accessorKey: "products",
    header: "Products",
    cell: ({ row }) => (
      <div className="text-left max-w-xs table-cell-products">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="link"
              className="p-0 h-auto font-normal text-left truncate max-w-52 w-full justify-start"
              aria-label="View full products list"
            >
              {row.original.products || "No products"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Products</h4>
              <p className="text-sm text-muted-foreground">
                {row.original.products || "No products"}
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    ),
  },
  // {
  //   accessorKey: "address",
  //   header: "Address",
  //   cell: ({ row }) => (
  //     <Popover>
  //       <PopoverTrigger asChild>
  //         <Button
  //           variant="link"
  //           className="p-0 h-auto font-normal max-w-52 w-full truncate text-left justify-start"
  //         >
  //           {row.original.address || "No address provided"}
  //         </Button>
  //       </PopoverTrigger>
  //       <PopoverContent className="w-80">
  //         <div className="space-y-2">
  //           <h4 className="font-medium">Full Address</h4>
  //           <p className="text-sm text-muted-foreground">
  //             {row.original.address || "No address provided"}
  //           </p>
  //         </div>
  //       </PopoverContent>
  //     </Popover>
  //   ),
  // },
  {
    accessorKey: "totalPrice",
    header: "Total Price",
  },
  {
    accessorKey: "isPaid",
    header: "Paid",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "customerName",
    header: "Customer Name",
  },
  // {
  //   accessorKey: "customerEmail",
  //   header: "Customer Email",
  // },

  // {
  //   accessorKey: "gstnumber",
  //   header: "GST Number",
  // },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <OrderCellActions data={row.original} />,
  },
];
