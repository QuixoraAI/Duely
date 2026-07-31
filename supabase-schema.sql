-- Duely database schema
-- Run this once inside Supabase: Dashboard -> SQL Editor -> New query -> paste all of this -> Run

-- 1. Properties table: one row per rental property, owned by one landlord (user)
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  tenant_name text,
  created_at timestamptz not null default now()
);

-- 2. Documents table: one row per uploaded compliance document
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  requirement_key text not null, -- e.g. 'gas_safety', 'eicr', 'epc', etc.
  file_path text,                -- path inside Supabase Storage
  issue_date date,
  expiry_date date,               -- null for one-off documents that don't expire
  created_at timestamptz not null default now()
);

-- 3. Activity log: timestamped proof of what happened, per property
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- ========== ROW LEVEL SECURITY ==========
-- This is what guarantees one landlord can NEVER see another landlord's data,
-- enforced by the database itself, not just by the app's code.

alter table properties enable row level security;
alter table documents enable row level security;
alter table activity_log enable row level security;

-- Properties: a user can only see/edit their own properties
create policy "Users manage their own properties"
  on properties for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Documents: a user can only see/edit documents belonging to their own properties
create policy "Users manage documents on their own properties"
  on documents for all
  using (
    exists (
      select 1 from properties
      where properties.id = documents.property_id
      and properties.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from properties
      where properties.id = documents.property_id
      and properties.user_id = auth.uid()
    )
  );

-- Activity log: same rule, tied to property ownership
create policy "Users manage activity for their own properties"
  on activity_log for all
  using (
    exists (
      select 1 from properties
      where properties.id = activity_log.property_id
      and properties.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from properties
      where properties.id = activity_log.property_id
      and properties.user_id = auth.uid()
    )
  );

-- 4. Profiles table: tracks each landlord's plan tier (free / pro / portfolio)
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = user_id);

-- Automatically create a free-tier profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, tier)
  values (new.id, 'free');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Reminder log: tracks which threshold reminders have already been sent,
-- so the same reminder is never sent twice for the same document.
create table if not exists reminder_log (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  threshold_days int not null,
  sent_at timestamptz not null default now(),
  unique (document_id, threshold_days)
);

alter table reminder_log enable row level security;
-- No client-facing policies needed: this table is only ever read/written
-- by the server-side cron job using the service role key, which bypasses RLS.

-- ========== STORAGE ==========
-- After running this file, also go to Supabase -> Storage -> create a new bucket
-- called "documents" and set it to Private (not public).

-- 6. Billing columns on profiles: tracks each landlord's Stripe subscription
-- and which plan applies to their paid properties (starter = £9/mo, pro = £15/mo)
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;
alter table profiles add column if not exists stripe_subscription_item_id text;
alter table profiles add column if not exists plan text not null default 'starter';
