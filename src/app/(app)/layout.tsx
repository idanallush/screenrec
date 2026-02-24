import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<aside className="w-56 border-r border-border bg-surface" />}>
          <Sidebar />
        </Suspense>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
