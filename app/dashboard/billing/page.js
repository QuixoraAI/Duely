"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Nav from "../../../components/Nav";

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [propertyCount, setPropertyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }
    setUser(session.user);

    const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle();
    setProfile(prof);

    const { count } = await supabase.from("properties").select("id", { count: "exact", head: true });
    setPropertyCount(count || 0);

    setLoading(false);
  }

  const paidProperties = Math.max(propertyCount - 1, 0);
  const plan = profile?.plan || "starter";
  const rate = plan === "pro" ? 15 : 9;
  const monthlyCost = paidProperties * rate;
  const hasSubscription = !!profile?.stripe_subscription_id;

  async function startCheckout(chosenPlan) {
    setBusy(true);
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, email: user.email, plan: chosenPlan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Couldn't start checkout — please try again.");
      setBusy(false);
    }
  }

  async function switchPlan(newPlan) {
    setBusy(true);
    const res = await fetch("/api/change-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, newPlan }),
    });
    if (res.ok) {
      await init();
    } else {
      alert("Couldn't change plan — please try again.");
    }
    setBusy(false);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-ink/50">Loading...</p></div>;
  }

  const justUpgraded = searchParams.get("upgraded") === "true";

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-xl mx-auto px-6 py-10">
        <p className="text-xs font-mono uppercase tracking-wide text-forest mb-1">Billing</p>
        <h1 className="text-2xl font-semibold text-forestDeep mb-8">Your plan</h1>

        {justUpgraded && (
          <div className="bg-moss/10 border border-moss/30 text-forest rounded-lg px-4 py-3 text-sm mb-6">
            Payment received — this may take a minute to reflect below. Refresh if needed.
          </div>
        )}

        <div className="bg-white border border-ink/10 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-ink/45 mb-1">Current plan</p>
              <p className="text-xl font-semibold text-forestDeep capitalize">{plan}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink/45 mb-1">Estimated monthly cost</p>
              <p className="text-xl font-semibold text-forestDeep">£{monthlyCost}</p>
            </div>
          </div>
          <div className="text-sm text-ink/60 border-t border-ink/10 pt-4">
            <p>{propertyCount} propert{propertyCount === 1 ? "y" : "ies"} total — the first is always free.</p>
            {paidProperties > 0 && <p>{paidProperties} paid propert{paidProperties === 1 ? "y" : "ies"} at £{rate}/month each ({plan === "pro" ? "Pro" : "Starter"} rate).</p>}
            {paidProperties === 0 && <p>No paid properties yet — add a second property to start a subscription.</p>}
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-xl p-6">
          <p className="text-sm font-semibold mb-2">
            {plan === "pro" ? "Switch to Starter — £9/property" : "Upgrade to Pro — £15/property"}
          </p>
          <p className="text-sm text-ink/55 mb-5">
            {plan === "pro"
              ? "Drops your per-property rate but loses AI document reading, the AI Compliance Assistant, and the Portfolio view."
              : "Unlocks AI document reading, the AI Compliance Assistant, and the Portfolio view across all your properties."}
          </p>
          {hasSubscription ? (
            <button
              onClick={() => switchPlan(plan === "pro" ? "starter" : "pro")}
              disabled={busy}
              className="bg-forest text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-forestDeep disabled:opacity-60"
            >
              {busy ? "Updating..." : plan === "pro" ? "Switch to Starter" : "Upgrade to Pro"}
            </button>
          ) : paidProperties > 0 ? (
            <button
              onClick={() => startCheckout(plan === "pro" ? "pro" : "starter")}
              disabled={busy}
              className="bg-forest text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-forestDeep disabled:opacity-60"
            >
              {busy ? "Redirecting to checkout..." : "Start subscription"}
            </button>
          ) : (
            <p className="text-xs text-ink/45">Add a second property from your dashboard to start a subscription and choose a plan.</p>
          )}
        </div>

        {hasSubscription && (
          <p className="text-xs text-ink/45 mt-4">To cancel your subscription entirely, remove properties down to just your one free property, or contact us via the Help page.</p>
        )}
      </div>
    </div>
  );
}

export default function Billing() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-ink/50">Loading...</p></div>}>
      <BillingContent />
    </Suspense>
  );
}
