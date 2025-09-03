import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const SpecificationGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

// PATCH: Update a specification group
export async function PATCH(
  request: Request,
  { params }: { params: { storeId: string; groupId: string } }
) {
  try {
    const session = await auth();
    const body = await request.json();
    const validatedData = SpecificationGroupSchema.safeParse(body);

    if (!validatedData.success) {
      return new NextResponse("Invalid attributes", { status: 400 });
    }

    const { name } = validatedData.data;

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    if (!params.groupId) {
      return new NextResponse("Group Id is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: { id: params.storeId },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    const specificationGroup = await db.specificationGroup.update({
      where: { id: params.groupId },
      data: { name },
    });

    return NextResponse.json(specificationGroup);
  } catch (error) {
    console.log("[SPECIFICATION_GROUP_PATCH]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// DELETE: Delete a specification group
export async function DELETE(
  _request: Request,
  { params }: { params: { storeId: string; groupId: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    if (!params.groupId) {
      return new NextResponse("Group Id is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: { id: params.storeId },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    const specificationGroup = await db.specificationGroup.delete({
      where: { id: params.groupId },
    });

    return NextResponse.json(specificationGroup);
  } catch (error) {
    console.log("[SPECIFICATION_GROUP_DELETE]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
