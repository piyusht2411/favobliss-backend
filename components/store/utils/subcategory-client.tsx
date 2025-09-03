"use client";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Header } from "./header";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SubCategoryColumn, subCategoryColumns } from "./columns";
import { DataTable } from "./data-table";
import { ApiList } from "./api-list.";

interface SubCategoryClientProps {
  data: SubCategoryColumn[];
}

export const SubCategoryClient = ({ data }: SubCategoryClientProps) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <div className="flex items-center justify-between">
        <Header
          title="Subcategories"
          badge={data.length.toString()}
          description="Subcategories for your store"
        />
        <Button
          onClick={() => router.push(`/${params.storeId}/subcategories/create`)}
        >
          <Plus className="h-4 w-4 mr-2" size="sm" />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable columns={subCategoryColumns} data={data} searchKey="name" />
      <Header title="API" description="API calls for subcategories" />
      <ApiList entityName="subcategories" entityIdName="subCategoryId" />
    </>
  );
};
