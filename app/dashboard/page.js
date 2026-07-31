"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { REQUIREMENTS, getStatus } from "../../lib/requirements";
import { CheckIcon, AlertIcon } from "../../components/icons";
import Nav from "../../components/Nav";

const statusColor = {
  ok: "bg-moss/15 text-forest",
  warn: "bg-gold/15 text-gold",
  bad: "bg-red-100 text-red-600",
  missing: "bg-red-100 text-red-600",
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [documentsByProperty, setDocumentsByProperty] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session.user);
    await loadProperties();
    setLoading(false);
  }

  async function loadProperties() {
    const { data: props } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    setProperties(props || []);

    if (props && props.length > 0) {
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .in("property_id", props.map((p) => p.id));

      const grouped = {};
      (docs || []).forEach((d) => {
        if (!grouped[d.property_id]) grouped[d.property_id] = {};
        grouped[d.property_id][d.requirement_key] = d;
      });
      setDocumentsByProperty(grouped);
    } else {
      setDocumentsByProperty({});
    }
  }

  function scoreFor(propertyId) {
    const docs = documentsByProperty[propertyId] || {};
    const total = REQUIREMENTS.length;
    const ok = REQUIREMENTS.filter((r) => getStatus(docs[r.key]) === "ok").length;
    return Math.round((ok / total) * 100);
  }

  function overallStatus(propertyId) {
    const docs = documentsByProperty[propertyId] || {};
    const statuses = REQUIREMENTS.map((r) => getStatus(docs[r.key]));
    if (statuses.includes("bad") || statuses.includes("missing")) return "bad";
    if (statuses.includes("warn")) return "warn";
    return "ok";
  }

  const compliantCount = properties.filter((p) => overallStatus(p.id) === "ok").length;
  const needsAttentionCount = properties.filter((p) => overallStatus(p.id) !== "ok").length;

  async function syncBillingAfterChange() {
    try {
      const res = await fetch("/api/update-property-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert("Billing sync failed: " + (data.error || "Unknown error") + " (status " + res.status + ")");
        return;
      }

      if (data.needsCheckout) {
        const checkoutRes = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, email: user.email, plan: "starter" }),
        });
        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok) {
          alert("Checkout creation failed: " + (checkoutData.error || "Unknown error") + " (status " + checkoutRes.status + ")");
          return;
        }
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        } else {
          alert("Checkout succeeded but no URL was returned.");
        }
      }
    } catch (err) {
      alert("Billing sync error: " + err.message);
    }
  }

  async function addProperty(e) {
    e.preventDefault();
    if (!newName.trim() || saving) return;
    setSaving(true);

    try {
      if (properties.length === 0) {
        // First property ever — always free, create immediately, no payment involved.
        const { data, error } = await supabase
          .from("properties")
          .insert({ name: newName, address: newAddress, user_id: user.id })
          .select()
          .single();

        if (!error && data) {
          await supabase.from("activity_log").insert({
            property_id: data.id,
            message: `Property "${newName}" added`,
          });
          setNewName("");
          setNewAddress("");
          setShowAdd(false);
          await loadProperties();
        } else if (error) {
          alert("Couldn't add property: " + error.message);
        }
        setSaving(false);
        return;
      }

      // Check if a paid subscription already exists
      const { data: { session } } = await supabase.auth.getSession();
      const profileRes = await supabase.from("profiles").select("stripe_subscription_id").eq("user_id", user.id).maybeSingle();
      const hasSubscription = !!profileRes.data?.stripe_subscription_id;

      if (hasSubscription) {
        // Subscription already exists — payment method is on file, safe to add now
        // and just bump the billed quantity in the background.
        const { data, error } = await supabase
          .from("properties")
          .insert({ name: newName, address: newAddress, user_id: user.id })
          .select()
          .single();

        if (!error && data) {
          await supabase.from("activity_log").insert({
            property_id: data.id,
            message: `Property "${newName}" added`,
          });
          setNewName("");
          setNewAddress("");
          setShowAdd(false);
          await loadProperties();
          await syncBillingAfterChange();
        } else if (error) {
          alert("Couldn't add property: " + error.message);
        }
      } else {
        // This would be the first PAID property — require checkout to
        // succeed first. The property is only actually created by the
        // webhook once payment goes through.
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            plan: "starter",
            propertyName: newName,
            propertyAddress: newAddress,
          }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert("Couldn't start checkout: " + (data.error || "Unknown error"));
        }
      }
    } catch (err) {
      alert("Error adding property: " + err.message);
    }
    setSaving(false);
  }

  async function deleteProperty(propertyId, propertyName) {
    if (!confirm(`Delete "${propertyName}"? This removes all its documents and history too — this can't be undone.`)) {
      return;
    }
    const { error } = await supabase.from("properties").delete().eq("id", propertyId);
    if (!error) {
      await loadProperties();
      await syncBillingAfterChange();
    } else {
      alert("Couldn't delete property: " + error.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink/50">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-mono uppercase tracking-wide text-forest mb-1">Portfolio overview</p>
            <h1 className="text-2xl font-semibold text-forestDeep">Your properties</h1>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="bg-forest text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-forestDeep">
            + Add property
          </button>
        </div>
        <p className="text-xs text-ink/45 mb-8">Your first property is free. Additional properties are billed per month — see Billing for your plan.</p>

        {properties.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-ink/10 rounded-xl p-5">
              <p className="text-xs font-mono uppercase tracking-wide text-ink/40 mb-2">Total properties</p>
              <p className="text-3xl font-semibold text-forestDeep">{properties.length}</p>
            </div>
            <div className="bg-white border border-ink/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckIcon className="w-3.5 h-3.5 text-forest" />
                <p className="text-xs font-mono uppercase tracking-wide text-ink/40">Fully compliant</p>
              </div>
              <p className="text-3xl font-semibold text-forest">{compliantCount}</p>
            </div>
            <div className="bg-white border border-ink/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertIcon className="w-3.5 h-3.5 text-gold" />
                <p className="text-xs font-mono uppercase tracking-wide text-ink/40">Need attention</p>
              </div>
              <p className="text-3xl font-semibold text-gold">{needsAttentionCount}</p>
            </div>
          </div>
        )}

        {showAdd && (
          <form onSubmit={addProperty} className="bg-white border border-ink/10 rounded-xl p-5 mb-8 flex flex-col gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Property name, e.g. 12 Oak Street"
              className="border border-ink/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-forest"
              required
            />
            <input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Full address"
              className="border border-ink/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
            {properties.length >= 1 && (
              <p className="text-xs text-ink/50">This will be a paid property. You'll be taken to checkout if this is your first paid one.</p>
            )}
            <button type="submit" disabled={saving} className="bg-forest text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-forestDeep self-start px-5 disabled:opacity-60">
              {saving ? "Saving..." : "Save property"}
            </button>
          </form>
        )}

        {properties.length === 0 && !showAdd && (
          <div className="bg-white border border-dashed border-ink/20 rounded-xl p-10 text-center">
            <p className="text-ink/60 mb-4">No properties yet — add your first one, free, to start tracking compliance.</p>
            <button onClick={() => setShowAdd(true)} className="bg-forest text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-forestDeep">
              + Add your first property (free)
            </button>
          </div>
        )}

        <div className="grid gap-4">
          {properties.map((p) => {
            const score = scoreFor(p.id);
            const status = overallStatus(p.id);
            const docs = documentsByProperty[p.id] || {};
            return (
              <div
                key={p.id}
                className="bg-white border border-ink/10 rounded-xl p-5 hover:border-ink/25 hover:shadow-sm transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="cursor-pointer flex-1" onClick={() => router.push(`/dashboard/${p.id}`)}>
                    <p className="font-semibold text-forestDeep">{p.name}</p>
                    <p className="text-xs text-ink/45">{p.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full whitespace-nowrap ${statusColor[status]}`}>
                      {status === "ok" ? <CheckIcon className="w-3 h-3" /> : <AlertIcon className="w-3 h-3" />}
                      {status === "ok" ? "Compliant" : status === "warn" ? "Action soon" : "Needs attention"}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProperty(p.id, p.name); }}
                      className="text-xs text-ink/35 hover:text-red-500 px-1.5"
                      title="Delete property"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div onClick={() => router.push(`/dashboard/${p.id}`)} className="cursor-pointer">
                  <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden mb-2.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${score}%`,
                        backgroundColor: status === "ok" ? "#5C8A5E" : status === "warn" ? "#B98A2E" : "#DC2626",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink/45">{score}% of required documents on file and valid</p>
                    <div className="flex -space-x-1">
                      {REQUIREMENTS.slice(0, 5).map((r) => {
                        const s = getStatus(docs[r.key]);
                        return (
                          <div
                            key={r.key}
                            title={r.name}
                            className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                            style={{
                              backgroundColor: s === "ok" ? "#5C8A5E" : s === "warn" ? "#B98A2E" : "#E5988E",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
