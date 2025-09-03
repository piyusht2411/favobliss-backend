"use client";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/store/utils/header";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BrandColumn, brandColumns } from "./columns";
import { DataTable } from "@/components/store/utils/data-table";
import { ApiList } from "./api-list.";

interface BrandClientProps {
  data: BrandColumn[];
}

export const BrandClient = ({ data }: BrandClientProps) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <div className="flex items-center justify-between">
        <Header
          title="Brands"
          badge={data.length.toString()}
          description="Brands for your store"
        />
        <Button onClick={() => router.push(`/${params.storeId}/brands/create`)}>
          <Plus className="h-4 w-4 mr-2" size="sm" />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable columns={brandColumns} data={data} searchKey="name" />
      <Header title="API" description="API calls for brands" />
      <ApiList entityName="brands" entityIdName="brandId" />
    </>
  );
};
