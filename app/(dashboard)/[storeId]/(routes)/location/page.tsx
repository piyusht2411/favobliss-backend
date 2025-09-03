import { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";

import { LocationColumn } from "@/components/store/utils/columns";
import { LocationClient } from "@/components/store/utils/location-client";

export const metadata: Metadata = {
  title: "Store | Locations",
};

const LocationsPage = async ({ params }: { params: { storeId: string } }) => {
  const locations = await db.location.findMany({
    where: {
      storeId: params.storeId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedLocations: LocationColumn[] = locations.map((item) => ({
    id: item.id,
    pincode: item.pincode,
    city: item.city,
    state: item.state,
    country: item.country,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <LocationClient data={formattedLocations} />
      </div>
    </div>
  );
};

export default LocationsPage;
