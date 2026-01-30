create table payment_locks (
  user_id uuid primary key references auth.users(id),
  payment_intent_id text,
  status text check (status in ('pending', 'succeeded', 'failed', 'canceled')),
  created_at timestamptz default now()
);

-- Optional: Enable RLS
alter table payment_locks enable row level security;

create policy "Users can view their own locks"
  on payment_locks for select
  using (auth.uid() = user_id);
