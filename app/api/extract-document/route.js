// This route runs on the server, never in the browser — so the Anthropic API key
// stays secret. The client sends a file, this route reads it, asks Claude to find
// the issue and expiry dates, and sends back clean JSON.

export async function POST(request) {
  try {
    const { fileBase64, mediaType, requirementName } = await request.json();

    if (!fileBase64 || !mediaType) {
      return Response.json({ error: "Missing file data" }, { status: 400 });
    }

    const isPdf = mediaType === "application/pdf";

    const contentBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: mediaType, data: fileBase64 } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: fileBase64 } };

    const prompt = `This is a UK landlord compliance document: "${requirementName}". 
Find the issue date and expiry date printed on it. 
Respond with ONLY a JSON object, no other text, in this exact format:
{"issue_date": "YYYY-MM-DD" or null, "expiry_date": "YYYY-MM-DD" or null}
If a date genuinely isn't visible or you're not confident, use null for that field rather than guessing.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [contentBlock, { type: "text", text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return Response.json({ error: "AI extraction failed" }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.content?.find((c) => c.type === "text")?.text || "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { issue_date: null, expiry_date: null };
    }

    return Response.json(parsed);
  } catch (err) {
    console.error("Extract document error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
