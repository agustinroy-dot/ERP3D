export function WorkOrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-zinc-100 text-zinc-700 ring-zinc-500/10",
    assigned: "bg-blue-50 text-blue-700 ring-blue-600/20",
    printing: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    postprocess: "bg-purple-50 text-purple-700 ring-purple-600/20",
    qc: "bg-amber-50 text-amber-700 ring-amber-600/20",
    done: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    paused: "bg-orange-50 text-orange-700 ring-orange-600/20",
    failed: "bg-red-50 text-red-700 ring-red-600/10",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.pending}`}>
      {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
    </span>
  );
}