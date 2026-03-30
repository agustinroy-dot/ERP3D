import Link from "next/link";
import { LayoutDashboard, Users, FileText, Settings, Package, Truck, Activity } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 rounded-xl border border-white/30 bg-white/60 p-4 shadow-sm backdrop-blur-xl hidden md:flex md:flex-col gap-6">
      <div className="flex items-center gap-2 px-2">
        <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-zinc-900">3D ERP</span>
      </div>

      <nav className="flex flex-col gap-1">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white/80 hover:text-zinc-900 transition-colors">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link href="/crm/leads" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white/80 hover:text-zinc-900 transition-colors">
          <Users className="h-4 w-4" />
          Leads
        </Link>
        <Link href="/crm/customers" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white/80 hover:text-zinc-900 transition-colors">
          <Users className="h-4 w-4" />
          Customers
        </Link>
        <Link href="/quotes" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white/80 hover:text-zinc-900 transition-colors pointer-events-none opacity-50">
          <FileText className="h-4 w-4" />
          Quotes
        </Link>
        <Link href="/inventory" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white/80 hover:text-zinc-900 transition-colors pointer-events-none opacity-50">
          <Package className="h-4 w-4" />
          Inventory
        </Link>
        <Link href="/production" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white/80 hover:text-zinc-900 transition-colors">
          <Activity className="h-4 w-4" />
          Production
        </Link>
        <Link href="/deliveries" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white/80 hover:text-zinc-900 transition-colors pointer-events-none opacity-50">
          <Truck className="h-4 w-4" />
          Deliveries
        </Link>
      </nav>

      <div className="mt-auto">
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white/80 hover:text-zinc-900 transition-colors pointer-events-none opacity-50">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}