const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/production/work-orders/[workOrderId]/page.tsx', 'utf8');

content = content.replace(
  'import { ActivityTimeline } from "@/features/activity/components/activity-timeline";',
  'import { ActivityTimeline } from "@/features/activity/components/activity-timeline";\nimport { AttachmentsPanel } from "@/features/attachments/components/attachments-panel";'
);

content = content.replace(
  '<div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">\n             <h2 className="text-sm font-semibold text-zinc-900 mb-4">Files & References</h2>\n             <p className="text-xs text-zinc-500 italic">Attachments module coming next.</p>\n          </div>',
  '<div className="h-[400px]">\n            <AttachmentsPanel entityType="work_order" entityId={workOrder.id} />\n          </div>'
);

fs.writeFileSync('src/app/(app)/production/work-orders/[workOrderId]/page.tsx', content);
