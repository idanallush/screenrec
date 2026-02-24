import { NextRequest, NextResponse } from "next/server";
import { getRecordingById, deleteRecording } from "@/lib/db-queries";
import { deleteVideo } from "@/lib/storage";

export async function DELETE(request: NextRequest) {
  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array is required" }, { status: 400 });
  }

  let deleted = 0;
  for (const id of ids) {
    try {
      const recording = await getRecordingById(id);
      if (recording?.blobUrl) {
        await deleteVideo(recording.blobUrl);
      }
      const ok = await deleteRecording(id);
      if (ok) deleted++;
    } catch (error) {
      console.error(`[Bulk Delete] Failed to delete ${id}:`, error);
    }
  }

  return NextResponse.json({ deleted });
}
