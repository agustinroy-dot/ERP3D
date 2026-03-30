import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-50/50 bg-[url('/noise.png')]">
      <div className="mx-auto flex h-dvh max-w-[1400px] gap-4 p-4 overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
          <Topbar />
          <main className="min-w-0 flex-1 rounded-xl border border-white/30 bg-white/60 p-6 shadow-sm backdrop-blur-xl">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}