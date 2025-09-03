import { db } from "@/lib/db";
import { SpecificationFieldForm } from "@/components/store/forms/specification-field-form";

const SpecificationFieldPage = async ({
  params,
}: {
  params: { fieldId: string; storeId: string };
}) => {
  let specificationField = null;

  if (params.fieldId !== "create") {
    specificationField = await db.specificationField.findUnique({
      where: {
        id: params.fieldId,
      },
      include: {
        group: true,
      },
    });
  }

  const specificationGroups = await db.specificationGroup.findMany({
    where: {
      storeId: params.storeId,
    },
  });

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SpecificationFieldForm
          data={specificationField}
          groups={specificationGroups}
        />
      </div>
    </div>
  );
};

export default SpecificationFieldPage;
