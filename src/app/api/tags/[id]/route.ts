import { NextRequest, NextResponse } from "next/server";
import { deleteTag, updateTag } from "@/lib/db-queries";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteTag(id);
  if (!deleted) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, color, icon } = body;

  if (name !== undefined && (!name || typeof name !== "string")) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const tag = await updateTag(id, { name, color, icon });
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }
  return NextResponse.json(tag);
}
