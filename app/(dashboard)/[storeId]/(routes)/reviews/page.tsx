import { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { ReviewColumn } from "@/components/store/utils/columns";
import { ReviewClient } from "@/components/store/utils/review-client";

export const metadata: Metadata = {
  title: "Store | Reviews",
};

const ReviewsPage = async ({ params }: { params: { storeId: string } }) => {
  const reviews = await db.review.findMany({
    where: {
      product: {
        storeId: params.storeId,
      },
    },
    include: {
      product: {
        include: {
          variants: {
            take: 1, // Get the first variant to use its name
            select: {
              name: true,
            },
          },
        },
      },
      images: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedReviews: ReviewColumn[] = reviews.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.variants[0]?.name || "Unnamed Product", // Use variant name or fallback
    userName: item.userName,
    rating: item.rating,
    text: item.text,
    imageCount: item.images.length,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ReviewClient data={formattedReviews} />
      </div>
    </div>
  );
};

export default ReviewsPage;
