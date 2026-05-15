import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthForm from "../login/AuthForm";

export default async function SignupPage() {
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
        <p className="text-ink-200 text-sm mb-10">Build the list. Hold the line.</p>

        <AuthForm mode="signup" />

        <p className="text-ink-200 text-xs mt-8 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-white underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
