"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [mode, setMode] = useState("signin"); // "signin" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`,
        },
      });
      if (error) {
        setError(error.message || "This email may already be registered — try logging in instead.");
      } else {
        setInfo("Awaiting verification — check your email (and your spam/junk folder) for a confirmation link, then log in.");
        setMode("signin");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message || "Couldn't log in — check your email and password and try again.");
      } else {
        router.push("/dashboard");
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-ink/10 p-8">
        <h1 className="font-semibold text-2xl text-forestDeep mb-1">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-ink/55 mb-6">
          {mode === "signin"
            ? "Log in to manage your properties."
            : "Start tracking your compliance in minutes."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-ink/60 block mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-ink/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-forest"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink/60 block mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-ink/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-forest"
              placeholder="At least 6 characters"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-forest bg-moss/10 border border-moss/30 rounded-lg px-3 py-2">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-forest text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-forestDeep transition disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "signin" ? "Log in" : "Sign up"}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}
          className="text-sm text-ink/55 mt-5 hover:text-ink w-full text-center"
        >
          {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
