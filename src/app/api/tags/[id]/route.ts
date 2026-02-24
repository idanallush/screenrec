import { NextRequest, NextResponse } from "next/server";
import { deleteTag } from "@/lib/db-queries";

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
