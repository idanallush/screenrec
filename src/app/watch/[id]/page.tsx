import { getRecordingById, incrementViewCount } from "@/lib/db-queries";
import { VideoPlayer } from "@/components/viewer/video-player";
import { VideoInfo } from "@/components/viewer/video-info";
import { ShareButton } from "@/components/viewer/share-button";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Video } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params;
  const recording = await getRecordingById(id);

  if (!recording || recording.status !== "ready") {
    return notFound();
  }

  await incrementViewCount(id);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="p-4 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2 w-fit">
          <Video className="w-5 h-5 text-primary" />
          <span className="font-bold">ScreenRec</span>
        </Link>
      </header>

      {/* Player */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <VideoPlayer src={recording.blobUrl} />
        <VideoInfo recording={recording} />
        <ShareButton recordingId={recording.id} />
      </main>
    </div>
  );
}
