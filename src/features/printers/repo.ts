import { getDb } from "@/db/client";
import { printers, workOrders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getPrinters(orgId: string) {
  const db = getDb();
  return db
    .select()
    .from(printers)
    .where(eq(printers.orgId, orgId))
    .orderBy(printers.name);
}

export async function getPrinterDetail(orgId: string, printerId: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(printers)
    .where(eq(printers.id, printerId));

  if (!result.length || result[0].orgId !== orgId) {
    return null;
  }

  const usageHistory = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.printerId, printerId))
    .orderBy(desc(workOrders.updatedAt))
    .limit(50);

  return {
    printer: result[0],
    usageHistory
  };
}
