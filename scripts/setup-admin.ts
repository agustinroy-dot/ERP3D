import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { getDb } from "../src/db/client";
import { profiles, orgs, orgMemberships } from "../src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin() {
  console.log("Creating or updating admin user...");
  const db = getDb();

  const email = "admin@example.com";
  const password = "admin";

  // 1. Create User in Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("User already registered")) {
      console.log("User already exists in Supabase Auth. Checking DB records...");
    } else {
      console.error("Error creating user in Supabase:", authError.message);
      process.exit(1);
    }
  }

  // Get user ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error("Could not find user after creation");
    process.exit(1);
  }

  // 2. Ensure Profile exists
  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id)
  });

  if (!existingProfile) {
    await db.insert(profiles).values({
      id: user.id,
      email: user.email,
      fullName: "System Admin"
    });
    console.log("Profile created.");
  } else {
    console.log("Profile already exists.");
  }

  // 3. Ensure Organization exists
  const existingOrg = await db.query.orgs.findFirst({
    where: eq(orgs.name, "Default Org")
  });

  let orgId = existingOrg?.id;

  if (!orgId) {
    const [newOrg] = await db.insert(orgs).values({
      name: "Default Org"
    }).returning({ id: orgs.id });
    orgId = newOrg.id;
    console.log("Default Organization created.");
  } else {
    console.log("Organization already exists.");
  }

  // 4. Ensure Organization Membership
  const existingMembership = await db.query.orgMemberships.findFirst({
    where: (t) => eq(t.userId, user.id)
  });

  if (!existingMembership) {
    await db.insert(orgMemberships).values({
      orgId,
      userId: user.id,
      role: "admin"
    });
    console.log("Added user to organization as admin.");
  } else {
    console.log("User already an admin in organization.");
  }

  console.log("Admin setup complete. You can now login with email: 'admin' and password: 'admin'.");
}

createAdmin().catch(console.error);
