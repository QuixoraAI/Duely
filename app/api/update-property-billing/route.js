import Stripe from "stripe";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Called after a property is added or deleted. Recalculates how many
// PAID properties the account has (total minus the one free property)
// and updates the Stripe subscription quantity to match. If no
// subscription exists yet but one is now needed, tells the client to
// start checkout instead. If quantity would drop to zero, cancels the
// subscription entirely.
export async function POST(request) {
  try {
    const { userId, email } = await request.json();
    if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

    const { count } = await supabaseAdmin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const paidQuantity = Math.max((count || 0) - 1, 0);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // No paid properties needed, and no existing subscription — nothing to do.
    if (paidQuantity === 0 && !profile?.stripe_subscription_id) {
      return Response.json({ ok: true, needsCheckout: false });
    }

    // Paid properties exist, no subscription yet — client should start checkout.
    if (paidQuantity > 0 && !profile?.stripe_subscription_id) {
      return Response.json({ ok: true, needsCheckout: true });
    }

    // Subscription exists but no longer needed — cancel it.
    if (paidQuantity === 0 && profile?.stripe_subscription_id) {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      await supabaseAdmin
        .from("profiles")
        .update({ tier: "free", plan: "starter", stripe_subscription_id: null, stripe_subscription_item_id: null })
        .eq("user_id", userId);
      return Response.json({ ok: true, needsCheckout: false, cancelled: true });
    }

    // Subscription exists and is still needed — just update the quantity.
    if (profile?.stripe_subscription_item_id) {
      await stripe.subscriptionItems.update(profile.stripe_subscription_item_id, {
        quantity: paidQuantity,
      });
    }

    return Response.json({ ok: true, needsCheckout: false, quantity: paidQuantity });
  } catch (err) {
    console.error("update-property-billing error:", err);
    return Response.json({ error: "Could not update billing" }, { status: 500 });
  }
}
