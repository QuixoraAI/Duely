import { supabase } from "./supabase";

// Tier values stored in the database: "free", "pro", "pro_plus"
// (renamed from the old "starter"/"portfolio" naming)

export async function getMyTier() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return "free";

  const { data, error } = await supabase
    .from("profiles")
    .select("tier")
    .eq("user_id", session.user.id)
    .single();

  if (error || !data) return "free";
  return data.tier;
}

// AI chat assistant + AI auto-fill: included from Pro upward
export function hasAiAccess(tier) {
  return tier === "pro" || tier === "pro_plus";
}

// Portfolio (cross-property renewal) view: also included from Pro upward
export function hasPortfolioAccess(tier) {
  return tier === "pro" || tier === "pro_plus";
}
