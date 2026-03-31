import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { workOrders, orders, printers, profiles, materials, workOrderEvents } from "@/db/schema";

export async function listWorkOrders(orgId: string) {
  const db = getDb();
  return db
    .select({
      id: workOrders.id,
      workOrderNumber: workOrders.workOrderNumber,
      orderNumber: orders.orderNumber,
      orderId: orders.id,
      status: workOrders.status,
      printerName: printers.name,
      operatorName: profiles.fullName,
      materialName: materials.name,
      color: workOrders.color,
      quantity: workOrders.quantity,
      estimatedHours: workOrders.estimatedHours,
      actualHours: workOrders.actualHours,
      priority: workOrders.priority,
      createdAt: workOrders.createdAt,
    })
    .from(workOrders)
    .innerJoin(orders, eq(workOrders.orderId, orders.id))
    .leftJoin(printers, eq(workOrders.printerId, printers.id))
    .leftJoin(profiles, eq(workOrders.operatorId, profiles.id))
    .leftJoin(materials, eq(workOrders.materialId, materials.id))
    .where(eq(workOrders.orgId, orgId))
    .orderBy(desc(workOrders.workOrderNumber))
    .limit(100);
}

export async function getWorkOrderDetail(orgId: string, workOrderId: string) {
  const db = getDb();

  const woData = await db
    .select({
      workOrder: workOrders,
      orderNumber: orders.orderNumber,
      printerName: printers.name,
      operatorName: profiles.fullName,
      materialName: materials.name,
      materialUnit: materials.unit,
    })
    .from(workOrders)
    .innerJoin(orders, eq(workOrders.orderId, orders.id))
    .leftJoin(printers, eq(workOrders.printerId, printers.id))
    .leftJoin(profiles, eq(workOrders.operatorId, profiles.id))
    .leftJoin(materials, eq(workOrders.materialId, materials.id))
    .where(and(eq(workOrders.orgId, orgId), eq(workOrders.id, workOrderId)))
    .limit(1);

  if (!woData || woData.length === 0) return null;

  const events = await db
    .select({
      event: workOrderEvents,
      actorName: profiles.fullName
    })
    .from(workOrderEvents)
    .leftJoin(profiles, eq(workOrderEvents.actorUserId, profiles.id))
    .where(eq(workOrderEvents.workOrderId, workOrderId))
    .orderBy(desc(workOrderEvents.createdAt));

  return { ...woData[0], events };
}