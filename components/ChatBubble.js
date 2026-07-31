"use client";

import { useState, useRef, useEffect } from "react";
import { getMyTier, hasAiAccess } from "../lib/tier";

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi — I'm the Tenfa Compliance Assistant. Ask me anything about gas safety, EICR, EPC, deposit protection, or the Renters' Rights Act. I give general guidance, not legal advice." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    getMyTier().then(setTier);
  }, []);

  const aiAllowed = hasAiAccess(tier);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply || "Sorry, something went wrong." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't reach the assistant right now." }]);
    }
    setLoading(false);
  }

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 24, width: 340, maxWidth: "calc(100vw - 32px)",
          background: "#fff", borderRadius: 16, boxShadow: "0 24px 60px -20px rgba(27,35,28,0.35)",
          border: "1px solid rgba(27,35,28,0.1)", display: "flex", flexDirection: "column",
          height: aiAllowed ? 460 : "auto", zIndex: 200,
        }}>
          <div style={{ background: "#1E3320", color: "#fff", padding: "14px 16px", borderRadius: "16px 16px 0 0" }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Compliance Assistant</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>General guidance, not legal advice</div>
          </div>

          {!aiAllowed ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(185,138,46,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B98A2E" strokeWidth="1.8"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" /></svg>
              </div>
              <p style={{ fontSize: 13.5, color: "#1B231C", fontWeight: 600, marginBottom: 6 }}>Pro feature</p>
              <p style={{ fontSize: 12.5, color: "rgba(27,35,28,0.55)", marginBottom: 16, lineHeight: 1.5 }}>
                The Compliance Assistant is available on the Pro plan. Upgrade to ask questions anytime.
              </p>
              <a href="/dashboard/billing" style={{ display: "inline-block", background: "#2E4A31", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600 }}>
                Upgrade to Pro
              </a>
            </div>
          ) : (
            <>
              <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    background: m.role === "user" ? "#2E4A31" : "#EFF2EA",
                    color: m.role === "user" ? "#fff" : "#1B231C",
                    padding: "9px 13px", borderRadius: 12, fontSize: 13, lineHeight: 1.5, maxWidth: "85%",
                  }}>
                    {m.text}
                  </div>
                ))}
                {loading && (
                  <div style={{ alignSelf: "flex-start", background: "#EFF2EA", padding: "9px 13px", borderRadius: 12, fontSize: 13, color: "rgba(27,35,28,0.5)" }}>
                    Thinking...
                  </div>
                )}
              </div>
              <div style={{ padding: 12, borderTop: "1px solid rgba(27,35,28,0.1)", display: "flex", gap: 8 }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask a question..."
                  style={{ flex: 1, border: "1px solid rgba(27,35,28,0.15)", borderRadius: 8, padding: "8px 11px", fontSize: 13, outline: "none" }}
                />
                <button
                  onClick={send}
                  disabled={loading}
                  style={{ background: "#2E4A31", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%",
          background: "#2E4A31", color: "#fff", border: "none", cursor: "pointer", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 16px 32px -12px rgba(27,35,28,0.4)",
        }}
        aria-label="Open compliance assistant"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
        )}
      </button>
    </>
  );
}
