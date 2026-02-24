import { NextRequest, NextResponse } from "next/server";
import {
  getTagsForRecording,
  addTagToRecording,
  removeTagFromRecording,
} from "@/lib/db-queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tags = await getTagsForRecording(id);
  return NextResponse.json(tags);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { tagId } = await request.json();
  if (!tagId) {
    return NextResponse.json({ error: "tagId is required" }, { status: 400 });
  }
  await addTagToRecording(id, tagId);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { tagId } = await request.json();
  if (!tagId) {
    return NextResponse.json({ error: "tagId is required" }, { status: 400 });
  }
  await removeTagFromRecording(id, tagId);
  return NextResponse.json({ success: true });
}
