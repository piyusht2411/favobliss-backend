import { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";

import { SubCategoryColumn } from "@/components/store/utils/columns";
import { SubCategoryClient } from "@/components/store/utils/subcategory-client";

export const metadata: Metadata = {
  title: "Store | Subcategories",
};

const SubCategoriesPage = async ({
  params,
}: {
  params: { storeId: string };
}) => {
  const subCategories = await db.subCategory.findMany({
    where: {
      storeId: params.storeId,
    },
    include: {
      category: true,
      parent: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedSubCategories: SubCategoryColumn[] = subCategories.map(
    (item) => ({
      id: item.id,
      name: item.name,
      categoryName: item.category.name,
      parentName: item.parent?.name || "None",
      createdAt: format(item.createdAt, "MMMM do, yyyy"),
    })
  );

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SubCategoryClient data={formattedSubCategories} />
      </div>
    </div>
  );
};

export default SubCategoriesPage;
