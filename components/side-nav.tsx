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
  Group,
  Star,
  Monitor,
  List,
  Clipboard,
  Ticket,
} from "lucide-react";

export const SideNav = ({
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
      {
        href: `/${params.storeId}/location-group`,
        label: "Location Groups",
        active: pathname === `/${params.storeId}/location-group`,
        icon: Group,
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
    <nav className={cn("space-y-1 px-2", className)} {...props}>
      {routes.map((route) => {
        const Icon = route.icon;
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group relative",
              route.active
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            {route.active && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r-md" />
            )}
            <Icon
              className={cn(
                "h-5 w-5 transition-colors flex-shrink-0",
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
