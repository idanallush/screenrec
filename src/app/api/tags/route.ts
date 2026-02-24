import { NextRequest, NextResponse } from "next/server";
import { getAllTagsWithCounts, createTag } from "@/lib/db-queries";

export async function GET() {
  const tags = await getAllTagsWithCounts();
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const { name, color, icon } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
  }
  try {
    const tag = await createTag(name.trim(), color || "#6d28d9", icon || "tag");
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    // Unique constraint violation = tag already exists
    const msg = (error as Error).message;
    if (msg.includes("UNIQUE")) {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
