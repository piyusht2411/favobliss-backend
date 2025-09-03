import { LocationForm } from "@/components/store/forms/location-form";
import { db } from "@/lib/db";

const LocationPage = async ({ params }: { params: { locationId: string } }) => {
  let location = null;

  if (params.locationId !== "create") {
    location = await db.location.findUnique({
      where: {
        id: params.locationId,
      },
    });
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <LocationForm data={location} />
      </div>
    </div>
  );
};

export default LocationPage;
