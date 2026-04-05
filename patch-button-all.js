const fs = require('fs');

const files = [
  'src/app/(app)/orders/page.tsx',
  'src/app/(app)/orders/[orderId]/page.tsx',
  'src/app/(app)/production/page.tsx',
  'src/app/(app)/printers/page.tsx',
  'src/app/(app)/crm/leads/page.tsx',
  'src/app/(app)/inventory/page.tsx',
  'src/app/(app)/quotes/page.tsx',
  'src/app/(app)/crm/customers/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('buttonVariants')) {
    content = content.replace(
      'import { Button } from "@/components/ui/button";',
      'import { Button, buttonVariants } from "@/components/ui/button";'
    );
  }

  // <Button asChild>\n  <Link href="...">\n    [content]\n  </Link>\n</Button>
  content = content.replace(
    /<Button asChild>\s*<Link([^>]*)>([\s\S]*?)<\/Link>\s*<\/Button>/g,
    (match, linkProps, linkContent) => {
      if (linkProps.includes('className=')) {
         return `<Link${linkProps}>${linkContent}</Link>`;
      }
      return `<Link${linkProps} className={buttonVariants({ variant: "default" })}>${linkContent}</Link>`;
    }
  );

  content = content.replace(
    /<Button asChild variant="outline"([^>]*)>\s*<Link([^>]*)>([\s\S]*?)<\/Link>\s*<\/Button>/g,
    (match, buttonProps, linkProps, linkContent) => {
      let classNameMatches = buttonProps.match(/className="([^"]+)"/);
      let btnClass = classNameMatches ? classNameMatches[1] : '';
      return `<Link${linkProps} className={buttonVariants({ variant: "outline", className: "${btnClass}" })}>${linkContent}</Link>`;
    }
  );

  content = content.replace(
    /<Button asChild className="([^"]+)">\s*<Link([^>]*)>([\s\S]*?)<\/Link>\s*<\/Button>/g,
    (match, btnClass, linkProps, linkContent) => {
      return `<Link${linkProps} className={buttonVariants({ variant: "default", className: "${btnClass}" })}>${linkContent}</Link>`;
    }
  );

  // Specific replacements
  content = content.replace(
    /<Button asChild>\n              <a href=\{`\/production\/work-orders\/new\?orderId=\$\{order\.id\}`\}>Create Work Order<\/a>\n            <\/Button>/g,
    '<a href={`/production/work-orders/new?orderId=${order.id}`} className={buttonVariants({ variant: "default" })}>Create Work Order</a>'
  );

  content = content.replace(
    /<Button asChild variant="outline" className="text-zinc-700">\n              <a href=\{`\/deliveries\/\$\{delivery\.id\}`\}><Truck className="h-4 w-4 mr-2" \/> View Delivery<\/a>\n            <\/Button>/g,
    '<a href={`/deliveries/${delivery.id}`} className={buttonVariants({ variant: "outline", className: "text-zinc-700" })}><Truck className="h-4 w-4 mr-2" /> View Delivery</a>'
  );

  fs.writeFileSync(file, content);
}
