import { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { LocationGroupColumn } from "@/components/store/utils/columns";
import { LocationGroupClient } from "@/components/store/utils/location-group-client";

export const metadata: Metadata = {
  title: "Store | Location Groups",
};

const LocationGroupsPage = async ({
  params,
}: {
  params: { storeId: string };
}) => {
  const [locationGroups, locations] = await Promise.all([
    db.locationGroup.findMany({
      where: {
        storeId: params.storeId,
      },
      include: {
        locations: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    db.location.findMany({
      where: {
        storeId: params.storeId,
      },
      select: {
        id: true,
        pincode: true,
        city: true,
      },
    }),
  ]);

  const formattedLocationGroups: LocationGroupColumn[] = locationGroups.map(
    (item) => ({
      id: item.id,
      name: item.name,
      locationCount: item.locations.length,
      isCodAvailable: item.isCodAvailable,
      isExpressDelivery: item.isExpressDelivery ?? false,
      deliveryDays: item.deliveryDays ?? 0,
      createdAt: format(item.createdAt, "MMMM do, yyyy"),
    })
  );

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <LocationGroupClient
          data={formattedLocationGroups}
          locations={locations}
        />
      </div>
    </div>
  );
};

export default LocationGroupsPage;
