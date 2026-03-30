"use server";

import { createMaterialSchema, adjustInventorySchema } from "./schemas";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships, materials, inventoryMovements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { can, type Role } from "@/lib/auth/permissions";
import { writeActivity } from "@/services/activity/write-activity";

async function requireOrgContext(userId: string) {
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, userId)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");
  return { orgId: membership.orgId, role: membership.role as Role };
}

export async function createMaterialAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "inventory:write")) throw new Error("FORBIDDEN");

  const input = createMaterialSchema.parse(raw);
  const db = getDb();

  const [material] = await db.insert(materials).values({
    orgId,
    name: input.name,
    category: input.category,
    unit: input.unit,
    onHandQty: input.onHandQty.toString(),
    minQty: input.minQty.toString(),
  }).returning();

  if (input.onHandQty > 0) {
    await db.insert(inventoryMovements).values({
      materialId: material.id,
      type: "in",
      qty: input.onHandQty.toString(),
      referenceType: "initial_stock",
      createdBy: user.id
    });
  }

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "material_created",
    entityType: "material",
    entityId: material.id,
    summary: `Material created: ${material.name}`
  });

  return material;
}

export async function adjustInventoryAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "inventory:write") && !can(role, "inventory:consume")) throw new Error("FORBIDDEN");

  const input = adjustInventorySchema.parse(raw);
  const db = getDb();

  const material = await db.query.materials.findFirst({ where: eq(materials.id, input.materialId) });
  if (!material || material.orgId !== orgId) throw new Error("Material not found");

  const qtyToNumber = Number(input.qty);
  let newQty = Number(material.onHandQty);

  if (input.type === "in") {
    newQty += qtyToNumber;
  } else if (input.type === "out") {
    newQty -= qtyToNumber;
    if (newQty < 0) throw new Error("Cannot have negative stock");
  } else if (input.type === "adjust") {
    newQty = qtyToNumber; // For 'adjust', qty is the exact new total
  }

  const [updated] = await db.update(materials)
    .set({ onHandQty: newQty.toString(), updatedAt: new Date() })
    .where(eq(materials.id, material.id))
    .returning();

  // Log movement
  let movementQty = input.qty;
  if (input.type === "adjust") {
    movementQty = Math.abs(newQty - Number(material.onHandQty));
  }

  await db.insert(inventoryMovements).values({
    materialId: material.id,
    type: input.type,
    qty: movementQty.toString(),
    referenceType: "manual_adjustment",
    createdBy: user.id,
    unitCost: input.unitCost ? input.unitCost.toString() : null
  });

  return updated;
}