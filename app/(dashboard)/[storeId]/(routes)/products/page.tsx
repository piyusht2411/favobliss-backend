import { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";

import { ProductColumn } from "@/components/store/utils/columns";
import { ProductClient } from "@/components/store/utils/product-client";

const getSubCategoryName = (subCategory: any, subCategories: any[]): string => {
  if (!subCategory?.parentId) return subCategory?.name || "None";
  const parent = subCategories.find((sub) => sub.id === subCategory.parentId);
  return parent
    ? `${getSubCategoryName(parent, subCategories)} > ${subCategory.name}`
    : subCategory?.name || "None";
};

export const metadata: Metadata = {
  title: "Store | Products",
};

const ProductsPage = async ({ params }: { params: { storeId: string } }) => {
  const products = await db.product.findMany({
    where: {
      storeId: params.storeId,
    },
    include: {
      category: true,
      subCategory: {
        include: {
          parent: true,
        },
      },
      variants: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          size: true,
          color: true,
          images: true,
          variantPrices: {
            include: {
              locationGroup: true,
            },
          },
          variantSpecifications: {
            include: {
              specificationField: {
                include: {
                  group: true,
                },
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

  const subCategories = await db.subCategory.findMany({
    where: {
      storeId: params.storeId,
    },
    include: {
      parent: true,
    },
  });

  const defaultLocationGroup = await db.locationGroup.findFirst({
    where: {
      storeId: params.storeId,
    },
  });

  const formattedProducts: ProductColumn[] = products.map((product) => {
    const firstVariant = product.variants[0];
    const firstPrice = firstVariant?.variantPrices.find(
      (vp) => vp.locationGroupId === defaultLocationGroup?.id
    );
    const price = firstPrice?.price?.toString() || "N/A";
    const stock = firstVariant?.stock || 0;
    const size = firstVariant?.size?.value || "None";
    const color = firstVariant?.color?.name || "None";

    return {
      id: product.id,
      name: firstVariant?.name || "Unnamed Variant",
      slug: firstVariant?.slug || "",
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival,
      isArchieved: product.isArchieved,
      price,
      stock,
      size,
      color,
      category: product.category?.name || "None",
      subCategory: getSubCategoryName(product.subCategory, subCategories),
      createdAt: format(product.createdAt, "MMMM do, yyyy"),
    };
  });

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductClient data={formattedProducts} />
      </div>
    </div>
  );
};

export default ProductsPage;
