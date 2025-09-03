"use client";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Header } from "./header";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LocationColumn, locationColumns } from "./columns";
import { DataTable } from "./data-table";
import { ApiList } from "./api-list.";

interface LocationClientProps {
  data: LocationColumn[];
}

export const LocationClient = ({ data }: LocationClientProps) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <div className="flex items-center justify-between">
        <Header
          title="Locations"
          badge={data.length.toString()}
          description="Locations for your store"
        />
        <Button
          onClick={() => router.push(`/${params.storeId}/location/create`)}
        >
          <Plus className="h-4 w-4 mr-2" size="sm" />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable columns={locationColumns} data={data} searchKey="city" />
      <Header title="API" description="API calls for locations" />
      <ApiList entityName="locations" entityIdName="locationId" />
    </>
  );
};
