"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Welcome() {
  const router = useRouter();
  const [status, setStatus] = useState("checking"); // checking | ok | failed

  useEffect(() => {
    // Give Supabase's client a moment to pick up the confirmation
    // token from the URL and establish a session.
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setStatus(session ? "ok" : "failed");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFF2EA", padding: 24 }}>
      <div style={{ maxWidth: 440, width: "100%", background: "#fff", borderRadius: 20, padding: "44px 36px", textAlign: "center", boxShadow: "0 30px 60px -30px rgba(27,35,28,0.25)" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(92,138,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2E4A31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5L7.5 15L17 5" />
          </svg>
        </div>

        {status === "checking" && (
          <>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#1E3320", margin: "0 0 8px" }}>Confirming your account...</h1>
            <p style={{ color: "rgba(27,35,28,0.55)", fontSize: 14.5, margin: 0 }}>One moment.</p>
          </>
        )}

        {status === "ok" && (
          <>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#1E3320", margin: "0 0 10px" }}>Welcome to Tenfa</h1>
            <p style={{ color: "rgba(27,35,28,0.6)", fontSize: 15, lineHeight: 1.6, margin: "0 0 28px" }}>
              Your account is confirmed. Let's add your first property and see exactly where your compliance stands.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              style={{ background: "#2E4A31", color: "#fff", border: "none", borderRadius: 30, padding: "13px 28px", fontSize: 14.5, fontWeight: 600, cursor: "pointer", width: "100%" }}
            >
              Add my first property
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#1E3320", margin: "0 0 10px" }}>Almost there</h1>
            <p style={{ color: "rgba(27,35,28,0.6)", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 24px" }}>
              We couldn't automatically confirm your session from this link. Try logging in directly instead — your account may already be confirmed.
            </p>
            <button
              onClick={() => router.push("/login")}
              style={{ background: "#2E4A31", color: "#fff", border: "none", borderRadius: 30, padding: "13px 28px", fontSize: 14.5, fontWeight: 600, cursor: "pointer", width: "100%" }}
            >
              Go to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
