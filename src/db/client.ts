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

    // Monkey-patch the query method to log the exact pg error before Drizzle hides it
    const originalQuery = globalDb.dbPool.query.bind(globalDb.dbPool);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    globalDb.dbPool.query = async (...args) => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return await originalQuery(...args);
      } catch (unknownErr) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = unknownErr as any;
        console.error("🔥 RAW PG ERROR DETAILS 🔥");
        console.error("Message:", err?.message);
        console.error("Code:", err?.code);
        console.error("Detail:", err?.detail);
        console.error("Hint:", err?.hint);
        console.error("Position:", err?.position);
        console.error("Internal Query:", err?.internalQuery);
        console.error("Where:", err?.where);
        console.error("Full Error:", err);
        throw err;
      }
    };
  }

  // Intercept drizzle queries to catch raw pg driver errors
  // that Drizzle might swallow or obfuscate as "Failed query"
  try {
    return drizzle({ client: globalDb.dbPool, schema, logger: true });
  } catch (err) {
    console.error("🔥 Drizzle initialization or pg connection error:", err);
    throw err;
  }
});