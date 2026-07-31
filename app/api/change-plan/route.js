import Stripe from "stripe";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Switches an existing subscription between the Starter (£9) and
// Pro (£15) price, keeping the same quantity. If there's no
// subscription yet (only the one free property so far), just
// records the chosen plan for when they add a paid property later.
export async function POST(request) {
  try {
    const { userId, newPlan } = await request.json();
    if (!userId || !["starter", "pro"].includes(newPlan)) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    const newPriceId = newPlan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_STARTER;

    if (profile?.stripe_subscription_item_id) {
      await stripe.subscriptionItems.update(profile.stripe_subscription_item_id, {
        price: newPriceId,
      });
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        plan: newPlan,
        tier: newPlan === "pro" && profile?.stripe_subscription_id ? "pro" : "free",
      })
      .eq("user_id", userId);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("change-plan error:", err);
    return Response.json({ error: "Could not change plan" }, { status: 500 });
  }
}
