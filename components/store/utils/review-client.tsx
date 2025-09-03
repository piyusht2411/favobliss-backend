"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Header } from "./header";
import { Separator } from "@/components/ui/separator";
import { ReviewColumn, reviewColumns } from "./columns";
import { DataTable } from "./data-table";
import { ApiList } from "./api-list.";

interface ReviewClientProps {
  data: ReviewColumn[];
}

export const ReviewClient = ({ data }: ReviewClientProps) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <div className="flex items-center justify-between">
        <Header
          title="Reviews"
          badge={data.length.toString()}
          description="Manage reviews for your store's products"
        />
      </div>
      <Separator />
      <DataTable columns={reviewColumns} data={data} searchKey="productName" />
      <Header title="API" description="API calls for reviews" />
      <ApiList entityName="reviews" entityIdName="reviewId" />
    </>
  );
};
