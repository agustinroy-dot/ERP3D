const fs = require('fs');

function patch(file, target, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
}

patch('src/app/(app)/quotes/[quoteId]/page.tsx',
      'item.costs.map((c: any) => (',
      'item.costs.map((c: { id: string, type: string, description: string | null, quantity: string, unitCost: string, totalCost: string }) => (');

patch('src/app/(app)/quotes/new/page.tsx',
      'function QuoteItemCostFields({ form, itemIndex }: { form: any, itemIndex: number }) {',
      '// eslint-disable-next-line @typescript-eslint/no-explicit-any\nfunction QuoteItemCostFields({ form, itemIndex }: { form: any, itemIndex: number }) {');

patch('src/components/app-shell/sidebar.tsx',
      'import { LayoutDashboard, Users, FileText, Settings, Package, Truck, Activity, ShoppingCart } from "lucide-react";',
      'import { LayoutDashboard, Users, FileText, Settings, Package, Activity, ShoppingCart } from "lucide-react";');

patch('src/features/orders/repo.ts',
      'let allCosts: any[] = [];',
      '// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  let allCosts: any[] = [];');

patch('src/features/orders/repo.ts',
      'import { orders, orderItems, orderItemCosts, customers, quotes, payments } from "@/db/schema";',
      'import { orders, orderItems, customers, quotes, payments } from "@/db/schema";');

patch('src/features/quotes/repo.ts',
      'let allCosts: any[] = [];',
      '// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  let allCosts: any[] = [];');

patch('src/features/quotes/repo.ts',
      'import { quotes, quoteItems, quoteItemCosts, customers, leads } from "@/db/schema";',
      'import { quotes, quoteItems, customers, leads } from "@/db/schema";');
