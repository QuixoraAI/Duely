export async function POST(request) {
  try {
    const { type, plan, message, fromEmail } = await request.json();

    let subject = "";
    let html = "";

    if (type === "interest") {
      subject = `Someone clicked "${plan}" on Tenfa`;
      html = `<p>Someone just clicked the <b>${plan}</b> plan button on the Tenfa pricing page.</p>`;
    } else if (type === "message") {
      subject = `New message from Tenfa "Talk to us"`;
      html = `
        <p><b>From:</b> ${fromEmail || "not provided"}</p>
        <p><b>Message:</b></p>
        <p>${(message || "").replace(/\n/g, "<br/>")}</p>
      `;
    } else {
      return Response.json({ error: "Unknown type" }, { status: 400 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Tenfa <noreply@tenfa.co.uk>",
        to: "teokalendar@gmail.com",
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", errText);
      return Response.json({ error: "Failed to send" }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
