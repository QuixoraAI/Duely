export async function POST(request) {
  try {
    const { messages } = await request.json();

    const systemPrompt = `You are the Tenfa Compliance Assistant, built into a UK landlord compliance tracking app.

Your job: help landlords understand their general compliance obligations — gas safety, EICR, EPC, deposit protection, Right to Rent, the Renters' Rights Act 2025, tenancy basics, and related topics.

Rules you always follow:
- Keep answers concise, practical, and UK-specific.
- You give GENERAL INFORMATION, never legal advice. For anything involving a live dispute, a specific legal grounds decision, or a situation with real financial/legal stakes, clearly tell them to consult a solicitor or a qualified letting professional.
- Never state something as definite legal fact if you're not confident — say so plainly instead of guessing.
- If asked about something unrelated to UK landlord compliance, politely redirect back to what you can help with.
- Do not draft or generate official legal documents, notices, or letters intended to be sent to a tenant — instead, point them to the relevant official gov.uk page or a solicitor.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 500,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic chat error:", errText);
      return Response.json({ error: "Chat request failed" }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.content?.find((c) => c.type === "text")?.text || "Sorry, I couldn't generate a response.";

    return Response.json({ reply });
  } catch (err) {
    console.error("Chat route error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
