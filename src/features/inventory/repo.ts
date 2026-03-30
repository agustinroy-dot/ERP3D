import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { materials, inventoryMovements, profiles } from "@/db/schema";

export async function listMaterials(orgId: string) {
  const db = getDb();
  return db
    .select()
    .from(materials)
    .where(eq(materials.orgId, orgId))
    .orderBy(desc(materials.createdAt))
    .limit(200);
}

export async function getMaterialDetail(orgId: string, materialId: string) {
  const db = getDb();

  const [material] = await db
    .select()
    .from(materials)
    .where(and(eq(materials.orgId, orgId), eq(materials.id, materialId)))
    .limit(1);

  if (!material) return null;

  const movements = await db
    .select({
      movement: inventoryMovements,
      actorName: profiles.fullName
    })
    .from(inventoryMovements)
    .leftJoin(profiles, eq(inventoryMovements.createdBy, profiles.id))
    .where(eq(inventoryMovements.materialId, materialId))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(50);

  return { material, movements };
}