import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";

export const dynamic = "force-dynamic"; // avoid auth ISR/session caching pitfalls [13]

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}