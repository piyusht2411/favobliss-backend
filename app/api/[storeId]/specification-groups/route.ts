import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const SpecificationGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

// POST: Create a new specification group
export async function POST(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const session = await auth();
    const body = await request.json();
    const validatedData = SpecificationGroupSchema.safeParse(body);

    if (!validatedData.success) {
      return new NextResponse("Invalid data provided", { status: 400 });
    }

    const { name } = validatedData.data;

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

    const specificationGroup = await db.specificationGroup.create({
      data: {
        name,
        storeId: params.storeId,
      },
    });

    return NextResponse.json(specificationGroup);
  } catch (error) {
    console.log("[SPECIFICATION_GROUPS_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// GET: List all specification groups
export async function GET(
  request: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    const specificationGroups = await db.specificationGroup.findMany({
      where: {
        storeId: params.storeId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(specificationGroups);
  } catch (error) {
    console.log("[SPECIFICATION_GROUPS_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
