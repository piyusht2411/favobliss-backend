import { LocationGroupForm } from "@/components/store/forms/location-group-form";
import { db } from "@/lib/db";

const LocationGroupPage = async ({
  params,
}: {
  params: { storeId: string; locationGroupId: string };
}) => {
  let locationGroup = null;
  let locations = [];

  if (params.locationGroupId !== "create") {
    [locationGroup, locations] = await Promise.all([
      db.locationGroup.findUnique({
        where: {
          id: params.locationGroupId,
        },
        include: {
          locations: true,
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
  } else {
    locations = await db.location.findMany({
      where: {
        storeId: params.storeId,
      },
      select: {
        id: true,
        pincode: true,
        city: true,
      },
    });
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <LocationGroupForm data={locationGroup} locations={locations} />
      </div>
    </div>
  );
};

export default LocationGroupPage;
