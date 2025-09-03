"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  Home,
  Package,
  Layers,
  Palette,
  Ruler,
  Tag,
  ShoppingCart,
  FileText,
  Settings,
  MapPin,
  Star,
  Monitor,
  List,
  Clipboard,
  Ticket,
} from "lucide-react";

export const SubNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  const params = useParams();

  const routes = useMemo(
    () => [
      {
        href: `/${params.storeId}`,
        label: "Overview",
        active: pathname === `/${params.storeId}`,
        icon: Home,
      },
      {
        href: `/${params.storeId}/categories`,
        label: "Categories",
        active: pathname === `/${params.storeId}/categories`,
        icon: Layers,
      },
      {
        href: `/${params.storeId}/subcategories`,
        label: "Subcategories",
        active: pathname === `/${params.storeId}/subcategories`,
        icon: List,
      },
      {
        href: `/${params.storeId}/sizes`,
        label: "Sizes",
        active: pathname === `/${params.storeId}/sizes`,
        icon: Ruler,
      },
      {
        href: `/${params.storeId}/colors`,
        label: "Colors",
        active: pathname === `/${params.storeId}/colors`,
        icon: Palette,
      },
      {
        href: `/${params.storeId}/brands`,
        label: "Brands",
        active: pathname === `/${params.storeId}/brands`,
        icon: Tag,
      },
      {
        href: `/${params.storeId}/products`,
        label: "Products",
        active: pathname === `/${params.storeId}/products`,
        icon: Package,
      },
      {
        href: `/${params.storeId}/specification-groups`,
        label: "Specification Groups",
        active: pathname === `/${params.storeId}/specification-groups`,
        icon: Clipboard,
      },
      {
        href: `/${params.storeId}/specification-fields`,
        label: "Specification Fields",
        active: pathname === `/${params.storeId}/specification-fields`,
        icon: FileText,
      },
      {
        href: `/${params.storeId}/orders`,
        label: "Orders",
        active: pathname === `/${params.storeId}/orders`,
        icon: ShoppingCart,
      },
      {
        href: `/${params.storeId}/reviews`,
        label: "Reviews",
        active: pathname === `/${params.storeId}/reviews`,
        icon: Star,
      },
      {
        href: `/${params.storeId}/coupons`,
        label: "Coupons",
        active: pathname === `/${params.storeId}/coupons`,
        icon: Ticket,
      },
      {
        href: `/${params.storeId}/location`,
        label: "Locations",
        active: pathname === `/${params.storeId}/location`,
        icon: MapPin,
      },
      // {
      //   href: `/${params.storeId}/billboards`,
      //   label: "Billboards",
      //   active: pathname === `/${params.storeId}/billboards`,
      //   icon: Monitor,
      // },
      {
        href: `/${params.storeId}/settings`,
        label: "Settings",
        active: pathname === `/${params.storeId}/settings`,
        icon: Settings,
      },
    ],
    [pathname, params]
  );

  return (
    <nav
      className={cn(
        "flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-4 lg:space-x-6 overflow-x-auto max-w-[78vw] scrollbar-thin p-3",
        className
      )}
    >
      {routes.map((route) => {
        const Icon = route.icon;
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md group whitespace-nowrap",
              route.active
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-colors flex-shrink-0",
                route.active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
              )}
            />
            <span className="truncate">{route.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
