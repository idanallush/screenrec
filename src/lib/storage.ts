import { del } from "@vercel/blob";

export async function deleteVideo(blobUrl: string): Promise<void> {
  if (blobUrl) {
    await del(blobUrl);
  }
}
