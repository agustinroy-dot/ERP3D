"use client";

import { Bell, Search, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between gap-4 rounded-xl border border-white/30 bg-white/60 px-4 shadow-sm backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-2 md:max-w-md">
        <Search className="h-4 w-4 text-zinc-500" />
        <Input
          type="search"
          placeholder="Search customers, quotes, orders..."
          className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 px-2"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-zinc-500 hover:bg-white/80 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
        <div className="h-8 w-8 overflow-hidden rounded-full bg-zinc-200">
          <UserCircle className="h-full w-full text-zinc-400" />
        </div>
      </div>
    </header>
  );
}