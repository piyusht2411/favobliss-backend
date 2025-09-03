import { Metadata } from "next";
import { db } from "@/lib/db";
import { format } from "date-fns";

import { SpecificationGroupClient } from "@/components/store/utils/specification-group-client";

interface SpecificationGroupColumn {
  id: string;
  name: string;
  createdAt: string;
}

export const metadata: Metadata = {
  title: "Store | Specification Groups",
};

const SpecificationGroupsPage = async ({
  params,
}: {
  params: { storeId: string };
}) => {
  const specificationGroups = await db.specificationGroup.findMany({
    where: {
      storeId: params.storeId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedGroups: SpecificationGroupColumn[] = specificationGroups.map(
    (item) => ({
      id: item.id,
      name: item.name,
      createdAt: format(item.createdAt, "MMMM do, yyyy"),
    })
  );

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SpecificationGroupClient data={formattedGroups} />
      </div>
    </div>
  );
};

export default SpecificationGroupsPage;
