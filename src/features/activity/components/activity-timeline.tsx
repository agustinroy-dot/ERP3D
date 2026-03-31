import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getActivityForEntity } from "../repo";

function renderMetadata(metadataStr: string | null) {
  if (!metadataStr) return null;

  try {
    const data = JSON.parse(metadataStr);

    // Format status updates nicely
    if (data.fromStatus && data.toStatus) {
      return (
        <span className="text-xs text-zinc-500 font-medium">
          <span className="uppercase line-through">{data.fromStatus.replace('_', ' ')}</span>
          <span className="mx-2">→</span>
          <span className="uppercase text-zinc-700">{data.toStatus.replace('_', ' ')}</span>
        </span>
      );
    }

    // Other simple metadata handling could go here.
    return null; // Return null if we don't have a structured way to present it.
  } catch {
    return null;
  }
}

export async function ActivityTimeline({ entityType, entityId }: { entityType: string, entityId: string }) {
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) return null;

  const events = await getActivityForEntity(membership.orgId, entityType, entityId);

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <p className="text-xs text-zinc-500">No recorded events.</p>
      ) : (
        events.map((evt) => (
          <div key={evt.event.id} className="relative pl-6 pb-4 border-l border-zinc-200 last:border-0 last:pb-0">
            <div className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white ${
              evt.event.type.includes('incident') || evt.event.type.includes('failed') ? 'bg-red-500' :
              evt.event.type.includes('done') || evt.event.type.includes('delivered') || evt.event.type.includes('paid') ? 'bg-emerald-500' :
              'bg-blue-500'
            }`}></div>
            <div className="text-xs text-zinc-500 mb-1 flex justify-between items-center">
              <span>
                {new Date(evt.event.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                {evt.actorName && <span className="ml-1 font-medium text-zinc-700">· {evt.actorName}</span>}
              </span>
              {evt.event.entityType !== entityType && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] uppercase font-semibold text-zinc-500">{evt.event.entityType.replace('_', ' ')}</span>
              )}
            </div>
            <p className="text-sm text-zinc-900 font-medium">{evt.event.summary}</p>
            {evt.event.action && !evt.event.metadata && (
              <p className="text-xs text-zinc-500 mt-1 uppercase font-semibold tracking-wider">{evt.event.action.replace(/_/g, ' ')}</p>
            )}
            {evt.event.metadata && (
               <div className="mt-1">
                 {renderMetadata(evt.event.metadata)}
               </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
