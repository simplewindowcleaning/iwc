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
