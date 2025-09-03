import { CouponForm } from "@/components/store/forms/coupon-form";
import { db } from "@/lib/db";

const CouponPage = async ({
  params,
}: {
  params: { storeId: string; couponId: string };
}) => {
  let coupon = null;

  if (params.couponId !== "create") {
    coupon = await db.coupon.findUnique({
      where: {
        id: params.couponId,
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
    });
  }

  const products = await db.product
    .findMany({
      where: {
        storeId: params.storeId,
      },
      include: {
        variants: {
          take: 1,
          select: {
            name: true,
          },
        },
      },
    })
    .then((products) =>
      products.map((product) => ({
        id: product.id,
        name: product.variants[0]?.name || "Unnamed Product",
      }))
    );

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CouponForm data={coupon} products={products} />
      </div>
    </div>
  );
};

export default CouponPage;
