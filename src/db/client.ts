import { cache } from "react";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "@/db/schema";

// Cache the database connection pool globally so it can be reused
// across requests within the same Cloudflare Worker isolate.
// This prevents connection exhaustion when using Hyperdrive.
const globalDb = globalThis as unknown as {
  dbPool: Pool | undefined;
};

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const connectionString = env.HYPERDRIVE?.connectionString;

  if (!connectionString) {
    throw new Error("HYPERDRIVE binding is missing or has no connection string configured. Check Cloudflare Dashboard -> Settings -> Bindings.");
  }

  if (!globalDb.dbPool) {
    globalDb.dbPool = new Pool({
      connectionString,
      // Keep pool size small for serverless environments.
      // Hyperdrive handles the actual pooling to Supabase.
      max: 5,
      // Avoid cross-request connection reuse issues in Workers
      // by setting a short idle timeout if necessary, but maxUses: 1
      // was causing constant reconnects and "Failed query" timeouts.
      // Cloudflare/Hyperdrive tends to drop connections aggressively,
      // so we use a relatively low idle timeout.
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });

    globalDb.dbPool.on("error", (err) => {
      console.error("🔥 Postgres Pool Error (Hyperdrive connection failed):", err.message, err.stack);
    });
  }

  try {
    return drizzle({ client: globalDb.dbPool, schema, logger: true });
  } catch (err) {
    console.error("🔥 Drizzle initialization or pg connection error:", err);
    throw err;
  }
});