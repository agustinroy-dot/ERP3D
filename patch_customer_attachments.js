const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/crm/customers/[customerId]/page.tsx', 'utf8');

content = content.replace(
  'import { ActivityTimeline } from "@/features/activity/components/activity-timeline";',
  'import { ActivityTimeline } from "@/features/activity/components/activity-timeline";\nimport { AttachmentsPanel } from "@/features/attachments/components/attachments-panel";'
);

content = content.replace(
  '<ActivityTimeline entityType="customer" entityId={customer.id} />',
  '<ActivityTimeline entityType="customer" entityId={customer.id} />\n        </div>\n        <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm h-[400px]">\n           <AttachmentsPanel entityType="customer" entityId={customer.id} />'
);

fs.writeFileSync('src/app/(app)/crm/customers/[customerId]/page.tsx', content);
