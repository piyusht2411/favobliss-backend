import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SubCategorySchema } from "@/schemas/subcategory-form-schema";
import { NextResponse } from "next/server";

const allowedOrigins = [
  process.env.NEXT_PUBLIC_FRONTEND_URL,
  "http://localhost:3000",
  "https://favobliss.vercel.app",
].filter(Boolean);

async function isValidParent(
  subCategoryId: string | null,
  parentId: string
): Promise<boolean> {
  if (!parentId) return true;
  let currentId = parentId;
  while (currentId) {
    if (currentId === subCategoryId) return false; // Cycle detected
    const parent = await db.subCategory.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    //@ts-ignore
    currentId = parent?.parentId || null;
  }
  return true;
}

export async function POST(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const session = await auth();
    const body = await request.json();
    const validatedData = SubCategorySchema.safeParse(body);

    if (!validatedData.success) {
      return new NextResponse("Invalid data provided", { status: 400 });
    }

    const {
      name,
      slug,
      bannerImage,
      description,
      categoryId,
      parentId,
      icon,
      reviewCategories,
    } = validatedData.data;

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: { id: params.storeId },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    // Validate parentId
    if (parentId) {
      const parentSubCategory = await db.subCategory.findUnique({
        where: { id: parentId },
      });
      if (!parentSubCategory) {
        return new NextResponse("Invalid parent subcategory", { status: 400 });
      }
      if (parentSubCategory.categoryId !== categoryId) {
        return new NextResponse(
          "Parent subcategory must belong to the selected category",
          { status: 400 }
        );
      }
      if (!(await isValidParent(null, parentId))) {
        return new NextResponse("Invalid parent subcategory: creates a cycle", {
          status: 400,
        });
      }
    }

    const subCategory = await db.subCategory.create({
      data: {
        name,
        slug,
        icon,
        bannerImage,
        description,
        categoryId,
        parentId,
        storeId: params.storeId,
        reviewCategories: reviewCategories || [],
      },
    });

    return NextResponse.json(subCategory);
  } catch (error: any) {
    console.log("[SUBCATEGORIES_POST]", error);
    if (error.code === "P2002") {
      return new NextResponse("Slug already exists", { status: 400 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  const origin = request.headers.get("origin");
  const corsOrigin = allowedOrigins.includes(origin ?? "")
    ? origin ?? ""
    : allowedOrigins[0];

  const headers = {
    "Access-Control-Allow-Origin": corsOrigin || "",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  try {
    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400, headers });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const subCategory = await db.subCategory.findUnique({
        where: {
          slug,
          storeId: params.storeId,
        },
        include: {
          category: true,
          parent: true,
          childSubCategories: {
            include: {
              childSubCategories: {
                include: {
                  childSubCategories: true,
                },
              },
            },
          },
        },
      });

      if (!subCategory) {
        return new NextResponse("SubCategory not found", {
          status: 404,
          headers,
        });
      }

      return NextResponse.json(subCategory, { headers });
    }

    const subCategories = await db.subCategory.findMany({
      where: {
        storeId: params.storeId,
      },
      include: {
        category: true,
        parent: true,
        childSubCategories: {
          include: {
            childSubCategories: {
              include: {
                childSubCategories: true,
              },
            },
          },
        },
      },
    });

    const transformedSubCategories = subCategories
      .filter((sub) => sub.parentId === null)
      .map((sub) => ({
        ...sub,
        childSubCategories: sub.childSubCategories.map((child) => ({
          ...child,
          childSubCategories: child.childSubCategories.map((grandchild) => ({
            ...grandchild,
            childSubCategories: grandchild.childSubCategories || [],
          })),
        })),
      }));

    return NextResponse.json(transformedSubCategories, { headers });
  } catch (error) {
    console.log("[SUBCATEGORIES_GET]", error);
    return new NextResponse("Internal server error", { status: 500, headers });
  }
}
