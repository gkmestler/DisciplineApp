import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthForm from "./AuthForm";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1
          className="text-6xl font-black tracking-tight mb-1 leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          DISCIPLINE
        </h1>
        <p className="text-ink-200 text-sm mb-10">
          Sign in to keep the streak.
        </p>

        <AuthForm mode="login" />

        <p className="text-ink-200 text-xs mt-8 text-center">
          No account?{" "}
          <Link href="/signup" className="text-white underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
