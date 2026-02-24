import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { updateRecording } from "@/lib/db-queries";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as Blob | null;
  const recordingId = formData.get("recordingId") as string | null;

  if (!file || !recordingId) {
    return NextResponse.json(
      { error: "Missing file or recordingId" },
      { status: 400 }
    );
  }

  const blob = await put(`recordings/${recordingId}.webm`, file, {
    access: "public",
    contentType: "video/webm",
  });

  const recording = await updateRecording(recordingId, {
    blobUrl: blob.url,
    fileSize: file.size,
    status: "ready",
  });

  return NextResponse.json(recording);
}
