import { NextRequest } from "next/server";
import { getRecordingById } from "@/lib/db-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = await getRecordingById(id);

  if (!recording?.blobUrl) {
    return new Response("Not found", { status: 404 });
  }

  // Forward range header if browser sends one (for video seeking)
  const fetchHeaders: Record<string, string> = {
    Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
  };
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    fetchHeaders["Range"] = rangeHeader;
  }

  // Fetch the private blob using the server-side token
  const blobResponse = await fetch(recording.blobUrl, {
    headers: fetchHeaders,
  });

  if (!blobResponse.ok && blobResponse.status !== 206) {
    return new Response("Failed to fetch video", { status: 502 });
  }

  // Build response headers
  const headers = new Headers({
    "Content-Type": recording.mimeType || "video/webm",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
  });

  // Forward content-length and content-range for range requests
  for (const key of ["content-length", "content-range"]) {
    const value = blobResponse.headers.get(key);
    if (value) headers.set(key, value);
  }

  return new Response(blobResponse.body, {
    status: blobResponse.status,
    headers,
  });
}
