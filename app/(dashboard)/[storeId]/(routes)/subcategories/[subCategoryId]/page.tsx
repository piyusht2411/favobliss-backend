import { Metadata } from "next";
import { db } from "@/lib/db";

import { SubCategoryForm } from "@/components/store/forms/subcategory-form";

export const metadata: Metadata = {
  title: "Store | Subcategory",
};

const SubCategoryPage = async ({
  params,
}: {
  params: { subCategoryId: string; storeId: string };
}) => {
  let subCategory = null;

  if (params.subCategoryId !== "create") {
    subCategory = await db.subCategory.findUnique({
      where: {
        id: params.subCategoryId,
      },
    });
  }

  const categories = await db.category.findMany({
    where: {
      storeId: params.storeId,
    },
  });

  const subCategories = await db.subCategory.findMany({
    where: {
      storeId: params.storeId,
    },
  });

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SubCategoryForm
          initialData={subCategory}
          categories={categories}
          subCategories={subCategories}
        />
      </div>
    </div>
  );
};

export default SubCategoryPage;
