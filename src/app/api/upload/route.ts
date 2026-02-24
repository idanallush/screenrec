import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { updateRecording } from "@/lib/db-queries";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        return {
          allowedContentTypes: ["video/webm", "video/mp4", "video/x-matroska"],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
          addRandomSuffix: false,
          tokenPayload: clientPayload || "",
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const { recordingId } = JSON.parse(tokenPayload || "{}");
          if (recordingId) {
            await updateRecording(recordingId, {
              blobUrl: blob.url,
              status: "ready",
            });
          }
        } catch (error) {
          console.error("onUploadCompleted error:", error);
          throw new Error("Could not update recording");
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
