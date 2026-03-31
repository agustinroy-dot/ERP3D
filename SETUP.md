# Database and Authentication Setup

To run this application locally and log in successfully, you need to configure your environment variables to point to a valid Supabase instance and a Cloudflare Hyperdrive PostgreSQL connection, and create the default `admin` user.

## 1. Setup Environment Variables

Create a `.env.local` file in the root of the project:

```env
# URL and Anon Key for the Supabase Client
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Service Role Key for Admin Scripts (DO NOT EXPOSE TO BROWSER)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Database Connection String for Hyperdrive / Local PostgreSQL
CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgresql://user:password@localhost:5432/dbname"
```

## 2. Initialize Database Schema

Ensure your database schema is up-to-date using drizzle:

```bash
npm run db:push
```
*(or your preferred drizzle-kit command)*

## 3. Create the Admin User

To allow logging in with the default `admin` / `admin` credentials, you must seed your database with the admin user.

Run the provided script to automatically create the user `admin@example.com` in Supabase Auth, create a default organization, and assign the `admin` role.

```bash
npx tsx scripts/setup-admin.ts
```

## 4. Log in

Start the local server:
```bash
npm run dev
```

Navigate to `http://localhost:3000/login` and use the following credentials:
- **Email:** `admin` (This will automatically map to `admin@example.com` under the hood)
- **Password:** `admin`
