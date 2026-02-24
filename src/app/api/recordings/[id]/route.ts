import { NextRequest, NextResponse } from "next/server";
import {
  getRecordingById,
  updateRecording,
  deleteRecording,
} from "@/lib/db-queries";
import { deleteVideo } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = await getRecordingById(id);
  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }
  return NextResponse.json(recording);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const recording = await updateRecording(id, body);
  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }
  return NextResponse.json(recording);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = await getRecordingById(id);
  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  if (recording.blobUrl) {
    await deleteVideo(recording.blobUrl);
  }
  await deleteRecording(id);

  return NextResponse.json({ success: true });
}
