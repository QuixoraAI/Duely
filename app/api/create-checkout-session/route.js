import Stripe from "stripe";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Starts checkout for a landlord's FIRST paid property. The property is
// NOT created yet at this point - its details are stored in the Stripe
// session metadata, and only actually inserted into the database once
// the webhook confirms payment succeeded. This closes the loophole where
// someone could add unlimited properties for free by abandoning checkout.
export async function POST(request) {
  try {
    const { userId, email, plan, propertyName, propertyAddress } = await request.json();
    if (!userId || !email) {
      return Response.json({ error: "Missing user info" }, { status: 400 });
    }

    const priceId = plan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_STARTER;

    const origin = request.headers.get("origin");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        userId,
        propertyName: propertyName || "",
        propertyAddress: propertyAddress || "",
      },
      success_url: `${origin}/dashboard?paid=true`,
      cancel_url: `${origin}/dashboard`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return Response.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
