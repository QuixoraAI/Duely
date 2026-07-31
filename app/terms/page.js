"use client";

import { useRouter } from "next/navigation";

export default function Terms() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100vh", background: "#EFEBE1", color: "#12233F", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#2C3E5C", fontSize: 14, cursor: "pointer", marginBottom: 24 }}>
          &larr; Back to Tenfa
        </button>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: "#2C3E5C", marginBottom: 32 }}>Last updated: July 2026</p>

        <div style={{ background: "#B98A2E22", border: "1px solid #A9812E", padding: "16px 18px", borderRadius: 4, fontSize: 13.5, lineHeight: 1.6, marginBottom: 32 }}>
          <b>Note:</b> this is a working draft covering the basics of the service. It has not yet been reviewed by a solicitor.
          Before relying on this as your final legal terms, have it properly reviewed for your specific circumstances.
        </div>

        <div style={{ fontSize: 14.5, lineHeight: 1.75, color: "#12233F" }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>1. What Tenfa is</h2>
          <p>Tenfa is a tool that helps UK landlords track compliance documents for their rental properties — things like Gas Safety Certificates, EICRs, EPCs, and deposit protection records. It stores the documents you upload, tracks expiry dates, and sends reminders.</p>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>2. Not legal advice</h2>
          <p>Tenfa helps you track and evidence compliance. It is not a substitute for advice from a solicitor or a qualified letting professional. You remain responsible for meeting your actual legal obligations as a landlord — Tenfa is a tool to help you stay organised, not a guarantee of legal compliance.</p>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>3. Your account</h2>
          <p>You're responsible for keeping your login details secure. You agree to provide accurate information about your properties and documents — Tenfa relies on what you enter and upload; it does not independently verify it.</p>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>4. Subscriptions &amp; billing</h2>
          <p>Paid plans are billed via Stripe. You can cancel at any time; access to paid features continues until the end of the current billing period. We don't offer partial refunds for unused time within a billing period.</p>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>5. AI features</h2>
          <p>Some features (document reading, the Compliance Assistant) use AI. AI-extracted dates and AI-generated answers can be wrong — always check them against the actual document before relying on them. The Compliance Assistant gives general information, not legal advice.</p>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>6. Availability</h2>
          <p>We aim to keep Tenfa running reliably but don't guarantee uninterrupted access. As an early-stage product, features may change as we improve the service.</p>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginTop: 28, marginBottom: 10 }}>7. Contact</h2>
          <p>Questions about these terms: <a href="mailto:teokalendar@gmail.com" style={{ color: "#12233F" }}>teokalendar@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
