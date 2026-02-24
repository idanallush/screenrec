"use client";

import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  recordingId: string;
}

export function ShareButton({ recordingId }: ShareButtonProps) {
  async function copyLink() {
    const url = `${window.location.origin}/watch/${recordingId}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  }

  return (
    <Button onClick={copyLink} variant="outline" className="gap-2 mt-4">
      <Link className="w-4 h-4" />
      Copy Share Link
    </Button>
  );
}
