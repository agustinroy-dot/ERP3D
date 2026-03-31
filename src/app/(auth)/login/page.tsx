"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setPending(true);
    setError(null);
    const supabase = supabaseBrowser();

    // Map the requested "admin" username to a valid Supabase email address
    const loginEmail = email.trim() === "admin" ? "admin@example.com" : email;

    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    setPending(false);

    if (error) return setError(error.message);
    if (data.session) router.replace(redirect);
  }

  return (
    <div className="w-full rounded-2xl border border-white/30 bg-white/60 p-6 shadow-lg backdrop-blur-xl text-zinc-900">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-zinc-600">Use your company credentials.</p>

      <div className="mt-6 space-y-3">
        <Input
          className="bg-white/70 text-zinc-900 placeholder:text-zinc-500"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          className="bg-white/70 text-zinc-900 placeholder:text-zinc-500"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button
          className="w-full"
          onClick={onSubmit}
          disabled={pending || !email || !password}
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center px-6">
      <Suspense fallback={<p>Loading...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}