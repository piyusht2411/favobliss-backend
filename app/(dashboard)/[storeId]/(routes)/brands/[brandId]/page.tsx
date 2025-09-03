import { BrandForm } from "@/components/store/forms/brand-form";
import { db } from "@/lib/db";

const BrandPage = async ({ params }: { params: { brandId: string } }) => {
  let brand = null;

  if (params.brandId !== "create") {
    brand = await db.brand.findUnique({
      where: {
        id: params.brandId,
      },
    });
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BrandForm data={brand} />
      </div>
    </div>
  );
};

export default BrandPage;
