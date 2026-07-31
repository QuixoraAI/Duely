import { createClient } from "@supabase/supabase-js";

// This client uses the SECRET service role key, not the public anon key.
// It can read/write across every user's data, bypassing Row Level Security.
// This file must only ever be imported inside app/api/*/route.js files,
// which run on the server - never inside a "use client" component.

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
