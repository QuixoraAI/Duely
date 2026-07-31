"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const FAQS = [
  {
    q: "What documents do I actually need to upload?",
    a: "Tenfa tracks nine core UK landlord requirements: Gas Safety Certificate, EICR, EPC, the Renters' Rights Act Information Sheet, deposit protection, Right to Rent evidence, the tenancy agreement, a smoke & CO alarm record, and landlord insurance. You don't need them all on day one — the dashboard simply shows what's missing.",
  },
  {
    q: "Is this legal advice?",
    a: "No — Tenfa helps you track and evidence compliance, but it isn't a substitute for advice from a solicitor or letting professional, especially for anything involving a live dispute.",
  },
  {
    q: "What does it cost?",
    a: "Your first property is free, always. Additional properties are £9/month each on Starter, or £15/month each on Pro (which adds AI features and the Portfolio view). Pro Plus is from £99/month for agents and larger portfolios — get in touch and we'll work out the right price for your size.",
  },
];

function notifyInterest(plan) {
  fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "interest", plan }),
  }).catch(() => {});
}

export default function Home() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [openExpand, setOpenExpand] = useState(null);
  const [talkOpen, setTalkOpen] = useState(false);
  const [talkEmail, setTalkEmail] = useState("");
  const [talkMessage, setTalkMessage] = useState("");
  const [talkSent, setTalkSent] = useState(false);
  const [talkSending, setTalkSending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      setChecked(true);
    });
  }, []);

  function goToApp() {
    router.push(loggedIn ? "/dashboard" : "/login");
  }

  function handleProClick() {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    notifyInterest("Pro");
    router.push("/dashboard/billing");
  }

  function openTalk() {
    notifyInterest("Pro Plus (Talk to us)");
    setTalkOpen(true);
  }

  async function sendTalkMessage() {
    if (!talkMessage.trim() || talkSending) return;
    setTalkSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "message", message: talkMessage, fromEmail: talkEmail }),
      });
      setTalkSent(true);
    } catch {
      setTalkSent(true);
    }
    setTalkSending(false);
  }

  const primaryLabel = checked && loggedIn ? "Go to dashboard" : "Start free";

  return (
    <div className="tenfa-shell">
      <style jsx global>{`
        :root{
          --ink:#12233F; --ink-soft:#2C3E5C;
          --paper:#EFEBE1; --paper-dim:#E2DCCB;
          --brass:#A9812E; --brass-bright:#C79A3E;
          --risk:#B23A2E; --confirm:#3F6B52;
          --card:#fff; --line:rgba(18,35,63,0.14);
        }
        body{ background:var(--paper); color:var(--ink); font-family:'Inter',sans-serif; }
        .tenfa-shell a, .tenfa-shell button{ font-family:inherit; color:inherit; }
        .tenfa-shell .mono{ font-family:'IBM Plex Mono',monospace; }
        .tenfa-shell .wrap{ max-width:1120px; margin:0 auto; padding:0 40px; }

        .tenfa-shell header{ position:sticky; top:0; z-index:50; background:var(--paper); display:flex; align-items:center; justify-content:space-between; padding:22px 40px; border-bottom:1px solid var(--line); max-width:1120px; margin:0 auto; }
        .tenfa-shell .logo{ font-family:'Fraunces',serif; font-weight:600; font-size:21px; letter-spacing:-0.01em; background:none; border:none; cursor:pointer; }
        .tenfa-shell nav{ display:flex; gap:32px; font-size:13.5px; font-weight:500; color:var(--ink-soft); }
        .tenfa-shell nav button{ background:none; border:none; cursor:pointer; }
        .tenfa-shell .cta-btn{ background:var(--ink); color:var(--paper); border:none; font-size:13px; font-weight:600; padding:11px 20px; cursor:pointer; letter-spacing:0.01em; }
        .tenfa-shell .cta-btn:hover{ background:var(--ink-soft); }
        .tenfa-shell .cta-ghost{ background:transparent; color:var(--ink); border:1px solid var(--ink); font-size:13px; font-weight:600; padding:11px 20px; cursor:pointer; }
        .tenfa-shell .cta-ghost:hover{ background:var(--ink); color:var(--paper); }
        .tenfa-shell .nav-right{ display:flex; gap:12px; align-items:center; }

        .tenfa-shell .hero{ text-align:center; padding:76px 0 64px; max-width:680px; margin:0 auto; }
        .tenfa-shell .eyebrow{ font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--brass); letter-spacing:0.08em; margin-bottom:22px; display:inline-flex; align-items:center; gap:10px; }
        .tenfa-shell .eyebrow::before,.tenfa-shell .eyebrow::after{ content:''; width:18px; height:1px; background:var(--brass); }
        .tenfa-shell h1{ font-family:'Fraunces',serif; font-weight:500; font-size:48px; line-height:1.1; letter-spacing:-0.02em; margin-bottom:20px; color:var(--ink); }
        .tenfa-shell h1 em{ font-style:italic; color:var(--brass); font-weight:400; }
        .tenfa-shell .hero p{ font-size:16px; color:var(--ink-soft); max-width:460px; margin:0 auto 30px; line-height:1.7; }
        .tenfa-shell .hero-actions{ display:flex; gap:12px; align-items:center; justify-content:center; flex-wrap:wrap; }
        .tenfa-shell .fine{ font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--ink-soft); margin-top:18px; }
        .tenfa-shell .seal{ width:64px; height:64px; border:2px solid var(--brass); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 28px; }

        .tenfa-shell section.block{ padding:56px 0; }
        .tenfa-shell .ledger{ border-top:1px solid var(--ink); border-bottom:1px solid var(--ink); }
        .tenfa-shell .clause{ display:grid; grid-template-columns:60px 1fr 1.3fr; gap:22px; padding:24px 0; border-bottom:1px solid var(--line); align-items:start; }
        .tenfa-shell .clause:last-child{ border-bottom:none; }
        .tenfa-shell .clause-num{ font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--brass); padding-top:2px; }
        .tenfa-shell .clause-title{ font-family:'Fraunces',serif; font-size:18px; font-weight:500; letter-spacing:-0.01em; }
        .tenfa-shell .clause-desc{ font-size:13.5px; color:var(--ink-soft); line-height:1.6; }

        .tenfa-shell .trust{ display:flex; justify-content:space-between; align-items:center; padding:22px 0; font-size:12px; color:var(--ink-soft); flex-wrap:wrap; gap:8px; }
        .tenfa-shell .trust .label{ font-family:'IBM Plex Mono',monospace; letter-spacing:0.04em; font-size:10.5px; }

        .tenfa-shell .section-head{ padding-bottom:8px; }
        .tenfa-shell .section-head h2{ font-family:'Fraunces',serif; font-weight:500; font-size:30px; letter-spacing:-0.02em; max-width:540px; color:var(--ink); }
        .tenfa-shell .steps{ display:grid; grid-template-columns:repeat(3,1fr); gap:28px; padding:36px 0 8px; }
        .tenfa-shell .step{ border-top:2px solid var(--ink); padding-top:16px; }
        .tenfa-shell .step-num{ font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--brass); margin-bottom:12px; }
        .tenfa-shell .step h3{ font-family:'Fraunces',serif; font-size:18px; font-weight:500; margin-bottom:8px; letter-spacing:-0.01em; color:var(--ink); }
        .tenfa-shell .step p{ font-size:13.5px; color:var(--ink-soft); line-height:1.6; }

        .tenfa-shell .pricing-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; padding:36px 0 0; }
        .tenfa-shell .price-card{ background:#fff; border:1px solid var(--ink); padding:0; display:flex; flex-direction:column; }
        .tenfa-shell .price-card.featured{ border-width:2px; }
        .tenfa-shell .price-head{ padding:26px 22px; border-bottom:1px solid var(--line); }
        .tenfa-shell .price-tag{ font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:0.06em; color:var(--brass); margin-bottom:8px; }
        .tenfa-shell .price-name{ font-family:'Fraunces',serif; font-size:19px; font-weight:500; margin-bottom:6px; color:var(--ink); }
        .tenfa-shell .price-amount{ font-size:13px; color:var(--ink-soft); }
        .tenfa-shell .price-amount b{ font-family:'Fraunces',serif; font-size:23px; color:var(--ink); font-weight:500; }
        .tenfa-shell .price-body{ padding:20px 22px; flex:1; }
        .tenfa-shell .price-feat{ display:flex; gap:9px; font-size:13px; color:var(--ink-soft); padding:8px 0; border-bottom:1px solid var(--line); align-items:flex-start; }
        .tenfa-shell .price-feat:last-child{ border-bottom:none; }
        .tenfa-shell .price-feat .tick{ color:var(--confirm); flex-shrink:0; margin-top:1px; }
        .tenfa-shell .price-foot{ padding:20px 22px; border-top:1px solid var(--line); }
        .tenfa-shell .expand-btn{ width:100%; text-align:left; background:none; border:none; padding:14px 22px; cursor:pointer; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--ink-soft); border-top:1px solid var(--line); display:flex; justify-content:space-between; }
        .tenfa-shell .expand-panel{ max-height:0; overflow:hidden; transition:max-height .35s ease; }
        .tenfa-shell .expand-panel.open{ max-height:600px; }
        .tenfa-shell .expand-inner{ padding:0 22px 22px; font-size:13px; color:var(--ink-soft); line-height:1.65; }

        .tenfa-shell .faq{ padding:0 0 60px; max-width:720px; }
        .tenfa-shell .faq-item{ border-bottom:1px solid var(--line); }
        .tenfa-shell .faq-q{ width:100%; text-align:left; background:none; border:none; padding:20px 0; display:flex; justify-content:space-between; align-items:center; cursor:pointer; font-family:'Fraunces',serif; font-size:16px; color:var(--ink); }
        .tenfa-shell .faq-q .plus{ font-family:'IBM Plex Mono',monospace; font-size:15px; color:var(--brass); transition:transform .25s ease; }
        .tenfa-shell .faq-item.open .plus{ transform:rotate(45deg); }
        .tenfa-shell .faq-a p{ font-size:13.5px; color:var(--ink-soft); line-height:1.7; padding-bottom:20px; max-width:600px; }

        .tenfa-shell .final-cta{ text-align:center; padding:64px 0 72px; border-top:1px solid var(--line); }
        .tenfa-shell .final-cta h2{ font-family:'Fraunces',serif; font-weight:500; font-size:32px; letter-spacing:-0.02em; margin-bottom:22px; color:var(--ink); }
        .tenfa-shell .final-cta .hero-actions{ justify-content:center; }
        .tenfa-shell footer{ padding:28px 0 36px; font-size:12px; color:var(--ink-soft); display:flex; justify-content:space-between; border-top:1px solid var(--line); flex-wrap:wrap; gap:8px; }

        .tenfa-shell .talk-overlay{ position:fixed; inset:0; background:rgba(18,35,63,0.5); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
        .tenfa-shell .talk-modal{ background:#fff; border:1px solid var(--ink); padding:28px; max-width:400px; width:100%; }
        .tenfa-shell .talk-modal h3{ font-family:'Fraunces',serif; font-size:19px; margin-bottom:8px; color:var(--ink); }
        .tenfa-shell .talk-modal p{ font-size:13px; color:var(--ink-soft); margin-bottom:18px; line-height:1.6; }
        .tenfa-shell .talk-modal input, .tenfa-shell .talk-modal textarea{ width:100%; border:1px solid var(--line); padding:10px 12px; font-size:13.5px; font-family:'Inter',sans-serif; margin-bottom:12px; }
        .tenfa-shell .talk-modal textarea{ min-height:85px; resize:vertical; }
        .tenfa-shell .talk-modal-actions{ display:flex; gap:10px; }

        @media(max-width:820px){
          .tenfa-shell .pricing-grid, .tenfa-shell .steps{ grid-template-columns:1fr; }
          .tenfa-shell h1{ font-size:32px; }
        }
      `}</style>

      <header>
        <button className="logo" onClick={() => router.push("/")}>Tenfa</button>
        <nav>
          <button onClick={() => document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" })}>What it tracks</button>
          <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>Pricing</button>
          <button onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}>FAQ</button>
          <button onClick={() => router.push("/help")}>Help</button>
        </nav>
        <div className="nav-right">
          {checked && loggedIn ? (
            <button className="cta-btn" onClick={() => router.push("/dashboard")}>Dashboard</button>
          ) : (
            <>
              <button className="cta-ghost" onClick={() => router.push("/login")}>Log in</button>
              <button className="cta-btn" onClick={() => router.push("/login")}>Start free</button>
            </>
          )}
        </div>
      </header>

      <div className="wrap">
        <section className="hero">
          <div className="seal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A9812E" strokeWidth="1.8"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
          </div>
          <div className="eyebrow">BUILT AROUND THE RENTERS&rsquo; RIGHTS ACT 2025</div>
          <h1>Every certificate.<br />Every deadline.<br /><em>Never lost again.</em></h1>
          <p>Tenfa tracks every compliance document your rental properties need, tells you exactly what&rsquo;s missing, and gives you proof the moment anyone asks for it.</p>
          <div className="hero-actions">
            <button className="cta-btn" onClick={goToApp}>{primaryLabel}</button>
            <button className="cta-ghost" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>See how it works</button>
          </div>
          <div className="fine">NO CARD REQUIRED &middot; SET UP YOUR FIRST PROPERTY IN UNDER FIVE MINUTES</div>
        </section>

        <section className="ledger" id="tracks">
          <div className="clause">
            <div className="clause-num">01</div>
            <div className="clause-title">Gas &amp; electrical safety</div>
            <div className="clause-desc">Gas Safety Certificate (renews annually) and EICR (every 5 years), tracked with automatic expiry alerts.</div>
          </div>
          <div className="clause">
            <div className="clause-num">02</div>
            <div className="clause-title">Deposit &amp; tenancy paperwork</div>
            <div className="clause-desc">Deposit protection, Prescribed Information, and the tenancy agreement itself, all logged against each property.</div>
          </div>
          <div className="clause">
            <div className="clause-num">03</div>
            <div className="clause-title">Right to Rent &amp; insurance</div>
            <div className="clause-desc">Evidence checked before tenancy start, plus an ongoing record of your landlord insurance policy.</div>
          </div>
          <div className="clause">
            <div className="clause-num">04</div>
            <div className="clause-title">Renters&rsquo; Rights Act 2025</div>
            <div className="clause-desc">Tracks the new Information Sheet requirement and keeps a timestamped log of what was sent to each tenant, and when.</div>
          </div>
        </section>

        <section className="block" id="how">
          <div className="section-head">
            <div className="eyebrow" style={{ marginBottom: 14 }}>GETTING STARTED</div>
            <h2>Three steps. No paperwork left behind.</h2>
          </div>
          <div className="steps">
            <div className="step"><div className="step-num">STEP 1</div><h3>Add your properties</h3><p>Enter each address once — Tenfa builds the full compliance checklist automatically.</p></div>
            <div className="step"><div className="step-num">STEP 2</div><h3>Upload what you have</h3><p>Drop in your certificates. Tenfa tells you instantly what&rsquo;s covered and what&rsquo;s still missing.</p></div>
            <div className="step"><div className="step-num">STEP 3</div><h3>Stay ahead of every deadline</h3><p>Get emailed well before anything expires, and export a full proof pack in seconds if asked.</p></div>
          </div>
        </section>

        <section className="block" id="pricing">
          <div className="section-head">
            <div className="eyebrow" style={{ marginBottom: 14 }}>PRICING</div>
            <h2>Your first property is free. Every one after that, priced per property.</h2>
          </div>
          <div className="pricing-grid">
            <div className="price-card">
              <div className="price-head">
                <div className="price-tag">STARTER</div>
                <div className="price-name">First property free, then per property</div>
                <div className="price-amount"><b>&pound;9</b> /month per additional property</div>
              </div>
              <div className="price-body">
                <div className="price-feat"><span className="tick">✓</span>Your first property is always free</div>
                <div className="price-feat"><span className="tick">✓</span>Document storage &amp; compliance dashboard</div>
                <div className="price-feat"><span className="tick">✓</span>Automated email reminders (90 / 30 / 7 days)</div>
                <div className="price-feat"><span className="tick">✓</span>Proof pack export</div>
                <div className="price-feat"><span style={{ color: "var(--risk)" }}>–</span>No AI assistant or auto-fill</div>
              </div>
              <div className="price-foot"><button className="cta-ghost" style={{ width: "100%" }} onClick={goToApp}>Start free</button></div>
              <button className="expand-btn" onClick={() => setOpenExpand(openExpand === "starter" ? null : "starter")}>
                EVERYTHING INCLUDED, IN FULL <span>{openExpand === "starter" ? "−" : "+"}</span>
              </button>
              <div className={`expand-panel ${openExpand === "starter" ? "open" : ""}`}>
                <div className="expand-inner">
                  <p>Your first property is free, always. Every property after that is £9/month. Live status per property across all nine tracked UK requirements, document storage, automatic email reminders at 90/30/7 days, a timestamped activity log, and an exportable compliance report. No AI features or Portfolio view — those are part of Pro.</p>
                </div>
              </div>
            </div>

            <div className="price-card featured">
              <div className="price-head">
                <div className="price-tag">PRO</div>
                <div className="price-name">Hands-off &amp; small portfolios</div>
                <div className="price-amount"><b>&pound;15</b> /month per property</div>
              </div>
              <div className="price-body">
                <div className="price-feat"><span className="tick">✓</span>Your first property is always free</div>
                <div className="price-feat"><span className="tick">✓</span>Everything in Starter</div>
                <div className="price-feat"><span className="tick">✓</span>AI reads your documents automatically</div>
                <div className="price-feat"><span className="tick">✓</span>AI Compliance Assistant chat</div>
                <div className="price-feat"><span className="tick">✓</span>Portfolio view across all properties</div>
              </div>
              <div className="price-foot"><button className="cta-btn" style={{ width: "100%" }} onClick={handleProClick}>Upgrade to Pro</button></div>
              <button className="expand-btn" onClick={() => setOpenExpand(openExpand === "pro" ? null : "pro")}>
                EVERYTHING INCLUDED, IN FULL <span>{openExpand === "pro" ? "−" : "+"}</span>
              </button>
              <div className={`expand-panel ${openExpand === "pro" ? "open" : ""}`}>
                <div className="expand-inner">
                  <p>Your first property is still free. Every property after that is £15/month, and unlocks AI-powered date extraction on upload, an AI assistant for general compliance questions (not legal advice), and a dedicated Portfolio page showing every upcoming renewal sorted by urgency. Billed securely via Stripe, cancel any time.</p>
                </div>
              </div>
            </div>

            <div className="price-card">
              <div className="price-head">
                <div className="price-tag">PRO PLUS</div>
                <div className="price-name">Agents &amp; larger portfolios</div>
                <div className="price-amount"><b>From &pound;99</b> /month</div>
              </div>
              <div className="price-body">
                <div className="price-feat"><span className="tick">✓</span>Everything in Pro</div>
                <div className="price-feat"><span className="tick">✓</span>Multi-user agent accounts</div>
                <div className="price-feat"><span className="tick">✓</span>Priority support</div>
              </div>
              <div className="price-foot"><button className="cta-ghost" style={{ width: "100%" }} onClick={openTalk}>Talk to us</button></div>
              <button className="expand-btn" onClick={() => setOpenExpand(openExpand === "plus" ? null : "plus")}>
                EVERYTHING INCLUDED, IN FULL <span>{openExpand === "plus" ? "−" : "+"}</span>
              </button>
              <div className={`expand-panel ${openExpand === "plus" ? "open" : ""}`}>
                <div className="expand-inner">
                  <p>Built for letting agents and larger landlords managing many properties across multiple owners. Includes everything in Pro, plus multi-user access and priority support. Pricing depends on portfolio size — tell us a bit about yours and we&rsquo;ll get back to you directly.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="faq" id="faq">
          <div className="section-head" style={{ paddingTop: 0 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>QUESTIONS</div>
            <h2>Frequently asked</h2>
          </div>
          <div>
            {FAQS.map((item, i) => (
              <div className={`faq-item ${openFaq === i ? "open" : ""}`} key={i}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {item.q}
                  <span className="plus">+</span>
                </button>
                {openFaq === i && <div className="faq-a"><p>{item.a}</p></div>}
              </div>
            ))}
          </div>
        </section>

        <section className="final-cta">
          <h2>Stop hoping you&rsquo;re compliant. Know it.</h2>
          <div className="hero-actions">
            <button className="cta-btn" onClick={goToApp}>{primaryLabel}</button>
            <button className="cta-ghost" onClick={openTalk}>Talk to us</button>
          </div>
        </section>

        <div className="trust">
          <span className="label">GAS SAFETY · EICR · EPC · DEPOSIT PROTECTION · RIGHT TO RENT · RENTERS&rsquo; RIGHTS ACT 2025</span>
          <span className="label">BUILT FOR ENGLAND &amp; WALES</span>
        </div>

        <footer>
          <span>&copy; 2026 Tenfa. Not legal advice — always confirm requirements with a qualified professional.</span>
          <span><a href="/terms">Terms</a> — <a href="/privacy">Privacy</a> — <a href="/help">Help</a></span>
        </footer>
      </div>

      {talkOpen && (
        <div className="talk-overlay" onClick={(e) => { if (e.target === e.currentTarget) setTalkOpen(false); }}>
          <div className="talk-modal">
            {!talkSent ? (
              <>
                <h3>Let&rsquo;s talk</h3>
                <p>Tell us a bit about your portfolio and we&rsquo;ll get back to you directly.</p>
                <input type="email" placeholder="Your email (optional)" value={talkEmail} onChange={(e) => setTalkEmail(e.target.value)} />
                <textarea placeholder="How many properties, what you need..." value={talkMessage} onChange={(e) => setTalkMessage(e.target.value)} />
                <div className="talk-modal-actions">
                  <button className="cta-ghost" style={{ flex: 1 }} onClick={() => setTalkOpen(false)}>Cancel</button>
                  <button className="cta-btn" style={{ flex: 1 }} disabled={talkSending} onClick={sendTalkMessage}>{talkSending ? "Sending..." : "Send"}</button>
                </div>
              </>
            ) : (
              <>
                <h3>Thanks — message sent</h3>
                <p>We&rsquo;ll get back to you directly, usually within a day or two.</p>
                <button className="cta-btn" style={{ width: "100%" }} onClick={() => { setTalkOpen(false); setTalkSent(false); setTalkMessage(""); setTalkEmail(""); }}>Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
