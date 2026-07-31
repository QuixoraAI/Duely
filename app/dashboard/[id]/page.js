"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { REQUIREMENTS, getStatus, STATUS_LABEL } from "../../../lib/requirements";
import { ReqIcon, CheckIcon, AlertIcon } from "../../../components/icons";
import { getMyTier, hasAiAccess } from "../../../lib/tier";
import Nav from "../../../components/Nav";

const statusColor = {
  ok: "bg-moss/15 text-forest",
  warn: "bg-gold/15 text-gold",
  bad: "bg-red-100 text-red-600",
  missing: "bg-red-100 text-red-600",
};

const iconColor = {
  ok: "text-forest bg-moss/10",
  warn: "text-gold bg-gold/10",
  bad: "text-red-500 bg-red-50",
  missing: "text-red-400 bg-red-50",
};

export default function PropertyDetail() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id;

  const [property, setProperty] = useState(null);
  const [docs, setDocs] = useState({});
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [tier, setTier] = useState("free");
  const [editingKey, setEditingKey] = useState(null);
  const [editIssueDate, setEditIssueDate] = useState("");
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function autoFillWithAI() {
    if (!file) {
      alert("Choose a file first, then click Auto-fill.");
      return;
    }
    setAiLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/extract-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64,
          mediaType: file.type,
          requirementName: REQUIREMENTS.find((r) => r.key === uploadingKey)?.name || "document",
        }),
      });
      const data = await res.json();
      if (data.issue_date) setIssueDate(data.issue_date);
      if (data.expiry_date) setExpiryDate(data.expiry_date);
      if (!data.issue_date && !data.expiry_date) {
        alert("Couldn't confidently read any dates from this document — please enter them manually.");
      }
    } catch (err) {
      alert("AI auto-fill failed — please enter the dates manually.");
    }
    setAiLoading(false);
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function removeProperty() {
    if (!confirm(`Are you sure you want to remove this property? This deletes all its documents and history too — this can't be undone.`)) {
      return;
    }
    setRemoving(true);
    const { error } = await supabase.from("properties").delete().eq("id", propertyId);
    if (error) {
      alert("Couldn't remove property: " + error.message);
      setRemoving(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/update-property-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert("Property removed, but billing sync failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Property removed, but billing sync failed: " + err.message);
    }

    router.push("/dashboard");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const { data: prop } = await supabase.from("properties").select("*").eq("id", propertyId).single();
    setProperty(prop);

    const { data: documents } = await supabase.from("documents").select("*").eq("property_id", propertyId);
    const grouped = {};
    (documents || []).forEach((d) => { grouped[d.requirement_key] = d; });
    setDocs(grouped);

    const { data: activity } = await supabase
      .from("activity_log")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(20);
    setLog(activity || []);

    getMyTier().then(setTier);

    setLoading(false);
  }

  async function handleUpload(requirementKey, requirementName) {
    if (!issueDate) {
      alert("Please set the issue date at least.");
      return;
    }

    let filePath = null;
    if (file) {
      const ext = file.name.split(".").pop();
      filePath = `${propertyId}/${requirementKey}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) {
        alert("Upload failed: " + uploadError.message);
        return;
      }
    }

    const { error } = await supabase.from("documents").insert({
      property_id: propertyId,
      requirement_key: requirementKey,
      file_path: filePath,
      issue_date: issueDate,
      expiry_date: expiryDate || null,
    });

    if (!error) {
      await supabase.from("activity_log").insert({
        property_id: propertyId,
        message: `${requirementName} uploaded`,
      });
      setUploadingKey(null);
      setIssueDate("");
      setExpiryDate("");
      setFile(null);
      await load();
    }
  }

  async function viewDocument(filePath) {
    if (!filePath) {
      alert("No file was attached to this document — only dates were recorded.");
      return;
    }
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 60);

    if (error) {
      alert("Couldn't open the document: " + error.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  function startEdit(doc) {
    setUploadingKey(null);
    setEditingKey(doc.requirement_key);
    setEditIssueDate(doc.issue_date || "");
    setEditExpiryDate(doc.expiry_date || "");
  }

  async function saveEdit(requirementKey, requirementName) {
    const doc = docs[requirementKey];
    if (!doc) return;
    if (!editIssueDate) {
      alert("Please set the issue date at least.");
      return;
    }
    setSavingEdit(true);

    const { error } = await supabase
      .from("documents")
      .update({
        issue_date: editIssueDate,
        expiry_date: editExpiryDate || null,
      })
      .eq("id", doc.id);

    if (!error) {
      await supabase.from("activity_log").insert({
        property_id: propertyId,
        message: `${requirementName} dates updated`,
      });
      setEditingKey(null);
      await load();
    } else {
      alert("Couldn't save changes: " + error.message);
    }
    setSavingEdit(false);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-ink/50">Loading...</p></div>;
  }

  if (!property) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-ink/50">Property not found.</p></div>;
  }

  const score = Math.round(
    (REQUIREMENTS.filter((r) => getStatus(docs[r.key]) === "ok").length / REQUIREMENTS.length) * 100
  );

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center justify-between">
        <span className="text-xs text-red-700">Managing this property</span>
        <button
          onClick={removeProperty}
          disabled={removing}
          className="text-xs font-mono text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {removing ? "Removing..." : "Remove this property"}
        </button>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={() => router.push("/dashboard")} className="text-sm text-ink/50 hover:text-ink mb-6">
          &larr; All properties
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-mono uppercase tracking-wide text-forest mb-1">{property.address}</p>
            <h1 className="text-2xl font-semibold text-forestDeep">{property.name}</h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-forestDeep">{score}%</p>
            <p className="text-xs text-ink/45">compliant</p>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <a
            href="https://www.gov.uk/renting-out-a-property/tenancy-agreements"
            target="_blank" rel="noopener noreferrer"
            className="text-sm border border-ink/15 rounded-lg px-4 py-2.5 hover:bg-ink/5"
          >
            Official gov.uk guidance ↗
          </a>
          <button
            onClick={() => router.push(`/dashboard/${propertyId}/report`)}
            className="text-sm border border-ink/15 rounded-lg px-4 py-2.5 hover:bg-ink/5"
          >
            Export compliance report
          </button>
        </div>

        <p className="text-xs font-mono uppercase tracking-wide text-ink/40 mb-3">Compliance documents</p>
        <div className="bg-white border border-ink/10 rounded-xl overflow-hidden mb-10">
          {REQUIREMENTS.map((req) => {
            const doc = docs[req.key];
            const status = getStatus(doc);
            const isUploading = uploadingKey === req.key;
            const isEditing = editingKey === req.key;
            return (
              <div key={req.key} className="border-b border-ink/10 last:border-b-0">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor[status]}`}>
                      <ReqIcon reqKey={req.key} className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{req.name}</p>
                      <p className="text-xs text-ink/45">
                        {req.note}
                        {doc?.expiry_date ? ` · expires ${doc.expiry_date}` : ""}
                        {doc?.issue_date && !doc?.expiry_date ? ` · issued ${doc.issue_date}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full whitespace-nowrap ${statusColor[status]}`}>
                      {status === "ok" ? <CheckIcon className="w-3 h-3" /> : <AlertIcon className="w-3 h-3" />}
                      {STATUS_LABEL[status]}
                    </span>
                    {doc?.file_path && (
                      <button
                        onClick={() => viewDocument(doc.file_path)}
                        className="text-xs font-mono border border-ink/20 rounded-md px-3 py-1.5 hover:bg-ink/5 whitespace-nowrap"
                      >
                        View
                      </button>
                    )}
                    {doc && (
                      <button
                        onClick={() => startEdit(doc)}
                        className="text-xs font-mono border border-ink/20 rounded-md px-3 py-1.5 hover:bg-ink/5 whitespace-nowrap"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingKey(null); setUploadingKey(isUploading ? null : req.key); }}
                      className="text-xs font-mono border border-ink/20 rounded-md px-3 py-1.5 hover:bg-ink/5 whitespace-nowrap"
                    >
                      {doc ? "Replace" : "Upload"}
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <div className="px-5 pb-5 flex flex-col gap-3 bg-paper/50">
                    <p className="text-xs text-ink/50 -mb-1">Editing dates for this document — the uploaded file itself stays the same.</p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-ink/50 block mb-1">Issue date</label>
                        <input type="date" value={editIssueDate} onChange={(e) => setEditIssueDate(e.target.value)}
                          className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm outline-none focus:border-forest" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-ink/50 block mb-1">Expiry date (if any)</label>
                        <input type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)}
                          className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm outline-none focus:border-forest" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(req.key, req.name)}
                        disabled={savingEdit}
                        className="bg-forest text-white rounded-lg py-2 text-sm font-semibold hover:bg-forestDeep px-5 disabled:opacity-60"
                      >
                        {savingEdit ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="text-sm text-ink/50 hover:text-ink px-4"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {isUploading && (
                  <div className="px-5 pb-5 flex flex-col gap-3 bg-paper/50">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-ink/50 block mb-1">Issue date</label>
                        <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
                          className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm outline-none focus:border-forest" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-ink/50 block mb-1">Expiry date (if any)</label>
                        <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm outline-none focus:border-forest" />
                      </div>
                    </div>
                    <input type="file" onChange={(e) => setFile(e.target.files[0])}
                      className="text-sm" />
                    {hasAiAccess(tier) ? (
                      <button
                        onClick={autoFillWithAI}
                        disabled={aiLoading}
                        className="text-xs font-mono border border-gold/40 bg-gold/10 text-gold rounded-lg py-2 px-4 self-start hover:bg-gold/20 disabled:opacity-50"
                      >
                        {aiLoading ? "Reading document..." : "✨ Auto-fill dates with AI"}
                      </button>
                    ) : (
                      <a
                        href="/dashboard/billing"
                        className="text-xs font-mono border border-ink/15 text-ink/45 rounded-lg py-2 px-4 self-start"
                      >
                        ✨ Auto-fill with AI — Pro feature, see plans
                      </a>
                    )}
                    <button
                      onClick={() => handleUpload(req.key, req.name)}
                      className="bg-forest text-white rounded-lg py-2 text-sm font-semibold hover:bg-forestDeep self-start px-5"
                    >
                      Save document
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs font-mono uppercase tracking-wide text-ink/40 mb-3">Activity log — this property</p>
        <div className="bg-white border border-ink/10 rounded-xl">
          {log.length === 0 && <p className="text-sm text-ink/45 px-5 py-4">No activity yet.</p>}
          {log.map((l) => (
            <div key={l.id} className="flex gap-4 px-5 py-3 border-b border-ink/10 last:border-b-0">
              <span className="text-xs font-mono text-ink/40 w-32 flex-shrink-0">
                {new Date(l.created_at).toLocaleDateString("en-GB")}
              </span>
              <span className="text-sm text-ink/75">{l.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
