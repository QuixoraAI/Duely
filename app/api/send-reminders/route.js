import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { REQUIREMENTS } from "../../../lib/requirements";

const THRESHOLDS = [90, 30, 7];

export async function GET(request) {
  // Only Vercel's own cron scheduler (or someone with the secret) can trigger this.
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: documents, error } = await supabaseAdmin
      .from("documents")
      .select("id, requirement_key, expiry_date, property_id, properties(id, name, user_id)")
      .not("expiry_date", "is", null);

    if (error) throw error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group reminders that need sending, by landlord user_id
    const byUser = {};

    for (const doc of documents || []) {
      const expiry = new Date(doc.expiry_date);
      expiry.setHours(0, 0, 0, 0);
      const daysLeft = Math.round((expiry - today) / (1000 * 60 * 60 * 24));

      if (!THRESHOLDS.includes(daysLeft)) continue;

      // Skip if this exact reminder was already sent
      const { data: existing } = await supabaseAdmin
        .from("reminder_log")
        .select("id")
        .eq("document_id", doc.id)
        .eq("threshold_days", daysLeft)
        .maybeSingle();

      if (existing) continue;

      const userId = doc.properties?.user_id;
      if (!userId) continue;

      if (!byUser[userId]) byUser[userId] = [];
      byUser[userId].push({
        documentId: doc.id,
        thresholdDays: daysLeft,
        propertyName: doc.properties?.name || "Your property",
        requirementName: REQUIREMENTS.find((r) => r.key === doc.requirement_key)?.name || doc.requirement_key,
        expiryDate: doc.expiry_date,
      });
    }

    let emailsSent = 0;

    for (const [userId, items] of Object.entries(byUser)) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = userData?.user?.email;
      if (!email) continue;

      const listHtml = items
        .map(
          (i) =>
            `<li><b>${i.requirementName}</b> at ${i.propertyName} — expires ${i.expiryDate} (${i.thresholdDays} days away)</li>`
        )
        .join("");

      const emailBody = `
        <div style="font-family:sans-serif; max-width:480px;">
          <h2 style="color:#1E3320;">A reminder from Tenfa</h2>
          <p>The following compliance items are coming up:</p>
          <ul>${listHtml}</ul>
          <p><a href="https://tenfa.co.uk/dashboard" style="color:#12233F;">View your dashboard</a></p>
        </div>
      `;

      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Tenfa <noreply@tenfa.co.uk>",
          to: email,
          subject: `${items.length} compliance item${items.length > 1 ? "s" : ""} coming up`,
          html: emailBody,
        }),
      });

      if (sendRes.ok) {
        emailsSent++;
        // Mark every item in this email as sent, so it's never sent twice
        for (const item of items) {
          await supabaseAdmin.from("reminder_log").insert({
            document_id: item.documentId,
            threshold_days: item.thresholdDays,
          });
        }
      } else {
        console.error("Resend send failed:", await sendRes.text());
      }
    }

    return Response.json({ ok: true, emailsSent });
  } catch (err) {
    console.error("send-reminders error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
