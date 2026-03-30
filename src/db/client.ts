import { cache } from "react";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "@/db/schema";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const connectionString = env.HYPERDRIVE.connectionString;

  const pool = new Pool({
    connectionString,
    // Critical in Workers: avoid cross-request connection reuse. [22]
    maxUses: 1
  });

  return drizzle({ client: pool, schema });
});