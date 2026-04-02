const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/quotes/[quoteId]/page.tsx', 'utf8');

content = content.replace(
  'import { Calculator } from "lucide-react";',
  'import { Calculator } from "lucide-react";\nimport { AttachmentsPanel } from "@/features/attachments/components/attachments-panel";'
);

content = content.replace(
  '</div>\n        </div>\n\n        <div className="space-y-6">',
  '</div>\n        </div>\n\n        <div className="space-y-6">\n          <div className="h-[400px]">\n            <AttachmentsPanel entityType="quote" entityId={quote.id} />\n          </div>'
);

fs.writeFileSync('src/app/(app)/quotes/[quoteId]/page.tsx', content);
