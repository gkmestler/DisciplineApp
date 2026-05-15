"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.refresh();
        router.push("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          router.refresh();
          router.push("/");
        } else {
          setInfo("Check your email to confirm your account, then sign in.");
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-ink-200 mb-2">
          Email
        </label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-ink-800 border border-ink-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-ink-200 mb-2">
          Password
        </label>
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-ink-800 border border-ink-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
        />
      </div>

      {error && (
        <p className="text-accent-loss text-xs leading-relaxed">{error}</p>
      )}
      {info && <p className="text-accent-win text-xs leading-relaxed">{info}</p>}

      <button
        type="submit"
        disabled={loading}
        className="tap w-full bg-white text-black font-bold uppercase tracking-widest py-4 rounded-lg disabled:opacity-50"
      >
        {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
