"use client";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Header } from "./header";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CouponColumn, couponColumns } from "./columns";
import { DataTable } from "./data-table";
import { ApiList } from "./api-list.";

interface CouponClientProps {
  data: CouponColumn[];
}

export const CouponClient = ({ data }: CouponClientProps) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <div className="flex items-center justify-between">
        <Header
          title="Coupons"
          badge={data.length.toString()}
          description="Manage coupons for your store"
        />
        <Button
          onClick={() => router.push(`/${params.storeId}/coupons/create`)}
        >
          <Plus className="h-4 w-4 mr-2" size="sm" />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable columns={couponColumns} data={data} searchKey="code" />
      <Header title="API" description="API calls for coupons" />
      <ApiList entityName="coupons" entityIdName="couponId" />
    </>
  );
};
