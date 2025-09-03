import { db } from "@/lib/db";
import { SpecificationGroupForm } from "@/components/store/forms/specification-group-form";

const SpecificationGroupPage = async ({
  params,
}: {
  params: { groupId: string; storeId: string };
}) => {
  let specificationGroup = null;

  if (params.groupId !== "create") {
    specificationGroup = await db.specificationGroup.findUnique({
      where: {
        id: params.groupId,
      },
    });
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SpecificationGroupForm data={specificationGroup} />
      </div>
    </div>
  );
};

export default SpecificationGroupPage;
