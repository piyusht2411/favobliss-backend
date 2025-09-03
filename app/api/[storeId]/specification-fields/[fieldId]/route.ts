import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const SpecificationFieldSchema = z.object({
  name: z.string().min(1, "Name is required"),
  groupId: z.string().min(1, "Group is required"),
});

// PATCH: Update a specification field
export async function PATCH(
  request: Request,
  { params }: { params: { storeId: string; fieldId: string } }
) {
  try {
    const session = await auth();
    const body = await request.json();
    const validatedData = SpecificationFieldSchema.safeParse(body);

    if (!validatedData.success) {
      return new NextResponse("Invalid attributes", { status: 400 });
    }

    const { name, groupId } = validatedData.data;

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    if (!params.fieldId) {
      return new NextResponse("Field Id is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: { id: params.storeId },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    const group = await db.specificationGroup.findUnique({
      where: { id: groupId, storeId: params.storeId },
    });

    if (!group) {
      return new NextResponse("Invalid group", { status: 400 });
    }

    const specificationField = await db.specificationField.update({
      where: { id: params.fieldId },
      data: { name, groupId },
    });

    return NextResponse.json(specificationField);
  } catch (error) {
    console.log("[SPECIFICATION_FIELD_PATCH]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// DELETE: Delete a specification field
export async function DELETE(
  _request: Request,
  { params }: { params: { storeId: string; fieldId: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized Access", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    if (!params.fieldId) {
      return new NextResponse("Field Id is required", { status: 400 });
    }

    const storeById = await db.store.findUnique({
      where: { id: params.storeId },
    });

    if (!storeById) {
      return new NextResponse("Store does not exist", { status: 404 });
    }

    const specificationField = await db.specificationField.delete({
      where: { id: params.fieldId },
    });

    return NextResponse.json(specificationField);
  } catch (error) {
    console.log("[SPECIFICATION_FIELD_DELETE]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
