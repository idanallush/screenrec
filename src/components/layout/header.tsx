import Link from "next/link";
import { Video } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-background">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Video className="w-6 h-6 text-primary" />
        <span className="font-bold text-lg">ScreenRec</span>
      </Link>
    </header>
  );
}
