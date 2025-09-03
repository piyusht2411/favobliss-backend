"use client";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Header } from "./header";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "./data-table";
import { ApiList } from "./api-list.";
import { LocationGroupColumn, locationGroupColumns } from "./columns";

interface LocationGroupClientProps {
  data: LocationGroupColumn[];
  locations: { id: string; pincode: string; city: string }[];
}

export const LocationGroupClient = ({
  data,
  locations,
}: LocationGroupClientProps) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <div className="flex items-center justify-between">
        <Header
          title="Location Groups"
          badge={data.length.toString()}
          description="Location Groups for your store"
        />
        <Button
          onClick={() =>
            router.push(`/${params.storeId}/location-group/create`)
          }
        >
          <Plus className="h-4 w-4 mr-2" size="sm" />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable columns={locationGroupColumns} data={data} searchKey="name" />
      <Header title="API" description="API calls for location groups" />
      <ApiList entityName="location-groups" entityIdName="locationGroupId" />
    </>
  );
};
