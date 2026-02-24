import { NextRequest, NextResponse } from "next/server";
import { getAllRecordings, createRecording } from "@/lib/db-queries";

export async function GET() {
  const recordings = await getAllRecordings();
  return NextResponse.json({ recordings });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const recording = await createRecording({
    title: body.title,
    duration: body.duration,
    hasWebcam: body.hasWebcam,
    width: body.width,
    height: body.height,
    mimeType: body.mimeType,
    thumbnail: body.thumbnail,
  });
  return NextResponse.json(recording, { status: 201 });
}
