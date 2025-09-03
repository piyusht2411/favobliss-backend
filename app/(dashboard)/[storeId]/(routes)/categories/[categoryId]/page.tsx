import { CategoryForm } from "@/components/store/forms/category-form";
import { db } from "@/lib/db";

const CategoryPage = async ({
  params,
}: {
  params: { categoryId: string; storeId: string };
}) => {
  let category = null;

  if (params.categoryId !== "create") {
    try {
      category = await db.category.findUnique({
        where: {
          id: params.categoryId,
        },
      });
    } catch (error) {
      console.error("[CATEGORY_PAGE] Error fetching category:", error);
      // Handle error (e.g., redirect or show error page)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryForm data={category} />
      </div>
    </div>
  );
};

export default CategoryPage;
