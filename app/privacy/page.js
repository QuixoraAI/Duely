"use client";

import { useRouter } from "next/navigation";

export default function Privacy() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100vh", background: "#EFEBE1", color: "#12233F", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#2C3E5C", fontSize: 14, cursor: "pointer", marginBottom: 24 }}>
          &larr; Back to Tenfa
        </button>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: "#2C3E5C", marginBottom: 32 }}>Last updated: July 2026</p>

        <div style={{ background: "#B98A2E22", border: "1px solid #A9812E", padding: "16px 18px", borderRadius: 4, fontSize: 13.5, lineHeight: 1.6, marginBottom: 32 }}>
          <b>Note:</b> this is a working draft. Before relying on this as your final privacy policy — particularly around
          ICO registration and data controller obligations — have it properly reviewed for your specific circumstances.
        </div>

        <div style={{ fontSize: 14.5, lineHeight: 1.75, color: "#12233F" }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>What we collect</h2>
          <p>Your account email and password (handled securely by our authentication provider, Supabase — we never see your raw password). Property details you enter (addresses, tenant names). Compliance documents you upload, and the dates associated with them.</p>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>How we use it</h2>
          <p>To run the service: showing your properties and documents back to you, sending expiry reminder emails, and — if you use the AI features — sending document images or your questions to Anthropic's Claude API to extract dates or answer questions. We don't sell your data or use it for advertising.</p>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>Who we share it with</h2>
          <p>We use a small number of service providers to run Tenfa: <b>Supabase</b> (database, authentication, file storage), <b>Resend</b> (sending emails), <b>Anthropic</b> (AI document reading and the Compliance Assistant, only when you use those features), and <b>Stripe</b> (payment processing, only your billing details — Tenfa never sees your full card number). Each of these processes data only as needed to provide their part of the service.</p>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>Data security</h2>
          <p>Every landlord's properties and documents are kept separate at the database level, enforced by the database itself. Documents are stored in a private file store, not publicly accessible without a signed, time-limited link.</p>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>Your rights</h2>
          <p>You can ask to see, correct, or delete your data at any time by contacting us. Deleting your account removes your properties, documents, and activity history.</p>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>Contact</h2>
          <p>Questions about your data: <a href="mailto:teokalendar@gmail.com" style={{ color: "#12233F" }}>teokalendar@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
