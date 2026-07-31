"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { REQUIREMENTS, getStatus, STATUS_LABEL } from "../../../lib/requirements";
import { getMyTier, hasPortfolioAccess } from "../../../lib/tier";
import Nav from "../../../components/Nav";

const statusColor = {
  ok: "bg-moss/15 text-forest",
  warn: "bg-gold/15 text-gold",
  bad: "bg-red-100 text-red-600",
  missing: "bg-red-100 text-red-600",
};

export default function Portfolio() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }

    const tier = await getMyTier();
    if (!hasPortfolioAccess(tier)) {
      setAllowed(false);
      setLoading(false);
      return;
    }
    setAllowed(true);

    const { data: props } = await supabase.from("properties").select("*").order("name");
    const { data: docs } = await supabase.from("documents").select("*");

    const docsByProperty = {};
    (docs || []).forEach((d) => {
      if (!docsByProperty[d.property_id]) docsByProperty[d.property_id] = {};
      docsByProperty[d.property_id][d.requirement_key] = d;
    });

    const built = [];
    (props || []).forEach((p) => {
      REQUIREMENTS.forEach((req) => {
        const doc = docsByProperty[p.id]?.[req.key];
        const status = getStatus(doc);
        built.push({
          propertyId: p.id,
          propertyName: p.name,
          requirement: req.name,
          status,
          expiryDate: doc?.expiry_date || null,
        });
      });
    });

    // Sort: missing/expired first, then soonest expiry, then compliant last
    const rank = { bad: 0, missing: 1, warn: 2, ok: 3 };
    built.sort((a, b) => {
      if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
      if (a.expiryDate && b.expiryDate) return new Date(a.expiryDate) - new Date(b.expiryDate);
      return 0;
    });

    setRows(built);
    setLoading(false);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-ink/50">Loading...</p></div>;
  }

  if (!allowed) {
    return (
      <div className="min-h-screen">
        <Nav />
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B98A2E" strokeWidth="1.8"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" /></svg>
          </div>
          <h1 className="text-xl font-semibold text-forestDeep mb-2">Portfolio view is a Portfolio-plan feature</h1>
          <p className="text-sm text-ink/55 mb-6">
            See every upcoming renewal across all your properties in one sorted list, ranked by urgency.
          </p>
          <a href="/dashboard/billing" className="inline-block bg-forest text-white rounded-lg px-5 py-2.5 text-sm font-semibold">Upgrade to Pro</a>
        </div>
      </div>
    );
  }

  const urgentCount = rows.filter((r) => r.status === "bad" || r.status === "missing").length;

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-xs font-mono uppercase tracking-wide text-forest mb-1">Portfolio view</p>
        <h1 className="text-2xl font-semibold text-forestDeep mb-1">Every renewal, across every property</h1>
        <p className="text-sm text-ink/55 mb-8">
          {urgentCount > 0
            ? `${urgentCount} item${urgentCount === 1 ? "" : "s"} need${urgentCount === 1 ? "s" : ""} attention right now.`
            : "Nothing urgent — everything is on track."}
        </p>

        <div className="bg-white border border-ink/10 rounded-xl overflow-hidden">
          {rows.length === 0 && (
            <p className="text-sm text-ink/45 px-5 py-6 text-center">No properties yet — add some to see your portfolio view.</p>
          )}
          {rows.map((r, i) => (
            <div
              key={i}
              onClick={() => router.push(`/dashboard/${r.propertyId}`)}
              className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-ink/10 last:border-b-0 cursor-pointer hover:bg-paper/60"
            >
              <div>
                <p className="text-sm font-medium">{r.requirement}</p>
                <p className="text-xs text-ink/45 mt-0.5">
                  {r.propertyName}{r.expiryDate ? ` · ${r.status === "bad" ? "expired" : "expires"} ${r.expiryDate}` : ""}
                </p>
              </div>
              <span className={`text-xs font-mono px-2.5 py-1 rounded-full whitespace-nowrap ${statusColor[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
