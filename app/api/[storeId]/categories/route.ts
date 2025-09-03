import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { CategoryFormSchema } from "@/schemas/category-form-schema";

export async function POST(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const session = await auth();
    const body = await request.json();
    const validatedData = CategoryFormSchema.safeParse(body);

    if (!validatedData.success) {
      return new NextResponse("Invalid data provided", { status: 400 });
    }

    const { name, slug, bannerImage, landingPageBanner, description } =
      validatedData.data;

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: {
        id: params.storeId,
      },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    const category = await db.category.create({
      data: {
        name,
        slug,
        bannerImage,
        description,
        landingPageBanner,
        storeId: params.storeId,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.log("[CATEGORIES_POST]", error);
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
  try {
    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const category = await db.category.findUnique({
        where: {
          slug,
          storeId: params.storeId,
        },
        include: {
          subCategories: {
            include: {
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
          },
        },
      });

      if (!category) {
        return new NextResponse("Category not found", { status: 404 });
      }

      return NextResponse.json(category);
    }

    const categories = await db.category.findMany({
      where: {
        storeId: params.storeId,
      },
      include: {
        subCategories: {
          include: {
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
        },
      },
    });

    const transformedCategories = categories.map((category) => ({
      ...category,
      subCategories: category.subCategories
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
        })),
    }));

    return NextResponse.json(transformedCategories);
  } catch (error) {
    console.log("[CATEGORIES_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
