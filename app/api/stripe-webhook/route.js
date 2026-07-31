import Stripe from "stripe";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function planFromPriceId(priceId) {
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return "starter";
}

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;

      // Get the subscription's line item so we know its plan and can
      // adjust quantity directly later, without another checkout.
      const subscription = await stripe.subscriptions.retrieve(session.subscription, {
        expand: ["items.data.price"],
      });
      const item = subscription.items.data[0];
      const plan = planFromPriceId(item.price.id);

      await supabaseAdmin
        .from("profiles")
        .update({
          plan,
          tier: plan === "pro" ? "pro" : "free",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          stripe_subscription_item_id: item.id,
        })
        .eq("user_id", userId);

      // Now that payment has actually succeeded, create the property that
      // was pending in the checkout session's metadata.
      const propertyName = session.metadata?.propertyName;
      if (propertyName) {
        const { data: newProperty } = await supabaseAdmin
          .from("properties")
          .insert({
            name: propertyName,
            address: session.metadata?.propertyAddress || "",
            user_id: userId,
          })
          .select()
          .single();

        if (newProperty) {
          await supabaseAdmin.from("activity_log").insert({
            property_id: newProperty.id,
            message: `Property "${propertyName}" added`,
          });
        }
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const isActive = subscription.status === "active" || subscription.status === "trialing";
      const item = subscription.items.data[0];
      const plan = item ? planFromPriceId(item.price.id) : "starter";

      await supabaseAdmin
        .from("profiles")
        .update({
          plan,
          tier: isActive && plan === "pro" ? "pro" : "free",
        })
        .eq("stripe_subscription_id", subscription.id);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;

      await supabaseAdmin
        .from("profiles")
        .update({
          tier: "free",
          plan: "starter",
          stripe_subscription_id: null,
          stripe_subscription_item_id: null,
        })
        .eq("stripe_subscription_id", subscription.id);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("Webhook handling error:", err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
