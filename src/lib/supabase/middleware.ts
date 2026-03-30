import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next();

  // Prevent session leakage via cached Set-Cookie responses
  // (recommended by Supabase for CDN environments). [13]
  response.headers.set("Cache-Control", "private, no-store");

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  // This call both validates and refreshes session cookies when needed.
  await supabase.auth.getUser();

  return response;
}