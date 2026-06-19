-- Ladderless Windows — Supabase schema

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  service_date date not null,
  service_time time not null,
  window_count int not null default 1,
  address text not null,
  first_name text,
  last_name text,
  phone text,
  email text,
  notes text,
  needs_estimate boolean default false,
  estimate_deadline date,
  total_price numeric(8,2) not null,
  status text not null default 'pending'
);

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time_slot time,
  is_blocked boolean not null default false,
  reason text,
  unique (date, time_slot)
);

-- RLS: public can insert bookings, not read
alter table bookings enable row level security;
create policy "Anyone can insert a booking"
  on bookings for insert to anon with check (true);
create policy "Service role can do anything on bookings"
  on bookings for all to service_role using (true) with check (true);

-- RLS: availability is public read, service role write
alter table availability enable row level security;
create policy "Anyone can read availability"
  on availability for select to anon using (true);
create policy "Service role can do anything on availability"
  on availability for all to service_role using (true) with check (true);

-- Post-job gig completions and customer review tokens
create table if not exists gig_completions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  booking_id uuid references bookings(id),
  worker_notes text not null,
  completed_at timestamptz default now(),
  review_token text unique not null,
  review_status text not null default 'pending', -- pending | approved | rejected
  customer_phone text,
  customer_review_text text,
  customer_stars int,
  review_submitted_at timestamptz
);

alter table gig_completions enable row level security;
create policy "Service role can do anything on gig_completions"
  on gig_completions for all to service_role using (true) with check (true);

-- Site settings — key/value store for feature flags and config
create table if not exists site_settings (
  key text primary key,
  value text not null default ''
);

insert into site_settings (key, value) values ('promo_enabled', 'false')
  on conflict (key) do nothing;

-- Public can read settings, service role manages them
alter table site_settings enable row level security;
create policy "Anyone can read site_settings"
  on site_settings for select to anon using (true);
create policy "Service role can do anything on site_settings"
  on site_settings for all to service_role using (true) with check (true);

-- Promo codes — managed by admin, validated against customer input
create table if not exists promo_codes (
  code text primary key,
  notes text,
  created_at timestamptz default now()
);

alter table promo_codes enable row level security;
create policy "Service role can do anything on promo_codes"
  on promo_codes for all to service_role using (true) with check (true);
