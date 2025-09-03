import { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";

import { CouponClient } from "@/components/store/utils/coupon-client";
import { CouponColumn } from "@/components/store/utils/columns";

export const metadata: Metadata = {
  title: "Store | Coupons",
};

const CouponsPage = async ({ params }: { params: { storeId: string } }) => {
  const coupons = await db.coupon.findMany({
    where: {
      storeId: params.storeId,
    },
    include: {
      products: {
        include: {
          product: {
            include: {
              variants: {
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedCoupons: CouponColumn[] = coupons.map((item) => ({
    id: item.id,
    code: item.code,
    isActive: item.isActive,
    value: item.value,
    startDate: format(new Date(item.startDate), "MMMM do, yyyy"),
    expiryDate: format(new Date(item.expiryDate), "MMMM do, yyyy"),
    productCount: item.products.length,
    productNames: item.products.map(
      (cp) => cp.product.variants[0]?.name || "Unnamed Product"
    ),
    usagePerUser: item.usagePerUser,
    usedCount: item.usedCount,
    description: item.description || "",
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CouponClient data={formattedCoupons} />
      </div>
    </div>
  );
};

export default CouponsPage;
