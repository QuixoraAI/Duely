"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Nav from "../../components/Nav";
import ChatBubble from "../../components/ChatBubble";

const FAQS = [
  {
    q: "What documents do I actually need to upload?",
    a: "Tenfa tracks nine core requirements for UK rental properties: Gas Safety Certificate, EICR, EPC, the Renters' Rights Act Information Sheet, deposit protection, Right to Rent evidence, the tenancy agreement, a smoke & CO alarm record, and landlord insurance. You don't need to have them all on day one — the dashboard simply shows you what's missing so nothing gets forgotten.",
  },
  {
    q: "How do the expiry reminders work?",
    a: "Each document you upload can have an expiry date attached. Tenfa automatically emails you at 90, 30, and 7 days before anything expires, and flags it on your dashboard too — so nothing gets forgotten.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Every landlord's properties and documents are kept completely separate at the database level, enforced by the database itself rather than just the app — meaning even if there were a bug elsewhere, one landlord could never see another's data. Documents are stored in a private file store, not publicly accessible.",
  },
  {
    q: "What if a property doesn't need one of the nine requirements?",
    a: "That's fine — for example, not every property needs an HMO licence, and some documents like insurance may be arranged differently. The checklist is a helpful default, not a rigid rule; it's there to make sure nothing slips through unnoticed, not to penalise you for a document that genuinely doesn't apply.",
  },
  {
    q: "Can I access Tenfa from my phone?",
    a: "Yes — Tenfa works from any browser, on any device, including your phone. Just log in and everything is right there.",
  },
  {
    q: "This isn't legal advice, right?",
    a: "Correct — Tenfa helps you track and evidence compliance, but it isn't a substitute for advice from a solicitor or letting professional, especially for anything involving possession grounds or a live dispute.",
  },
];

export default function Help() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
      } else {
        setCheckingAuth(false);
      }
    });
  }, []);

  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-ink/50">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-xs font-mono uppercase tracking-wide text-forest mb-1">Support</p>
        <h1 className="text-2xl font-semibold text-forestDeep mb-2">Help & questions</h1>
        <p className="text-sm text-ink/55 mb-10">Answers to common questions — if yours isn't here, reach out below.</p>

        <div className="bg-white border border-ink/10 rounded-xl overflow-hidden mb-10">
          {FAQS.map((item, i) => (
            <div key={i} className="border-b border-ink/10 last:border-b-0">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-ink">{item.q}</span>
                <span className={`text-ink/40 text-lg leading-none transition-transform ${openIndex === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 -mt-1">
                  <p className="text-sm text-ink/60 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-forestDeep text-white rounded-xl p-7">
          <p className="text-xs font-mono uppercase tracking-wide text-white/50 mb-2">Still stuck?</p>
          <h2 className="text-lg font-semibold mb-2">We're happy to help directly.</h2>
          <p className="text-sm text-white/65 mb-5">
            Email us and we'll get back to you directly.
          </p>
          <a
            href="mailto:teokalendar@gmail.com"
            className="inline-block bg-white text-forestDeep rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-white/90"
          >
            Email us
          </a>
        </div>
      </div>
      <ChatBubble />
    </div>
  );
}
