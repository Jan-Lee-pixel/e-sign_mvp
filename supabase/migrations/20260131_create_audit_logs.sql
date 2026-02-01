-- Create audit_logs table
create table public.audit_logs (
  id uuid not null default gen_random_uuid (),
  envelope_id uuid not null references public.envelopes (id) on delete cascade,
  action text not null, -- 'CREATED', 'VIEWED', 'SIGNED', 'COMPLETED', 'VOIDED'
  actor_name text null,
  actor_email text null,
  ip_address text null,
  user_agent text null,
  created_at timestamp with time zone not null default now(),
  constraint audit_logs_pkey primary key (id)
);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Policies
-- 1. Insert: Server (service role) needs to insert. authenticated users might insert via server (but server bypasses RLS usually if using service key). 
-- If using client-side insert (not recommended for strict audit), we'd need policy. 
-- We are using SERVER-SIDE insert in this plan. So specific insert policy for user might not be needed if we stick to the plan.
-- 2. Select: Users should view logs for ENVELOPES they own (sender) or where they are recipient?
-- For MVP, let's allow Sender to view logs.

create policy "Users can view audit logs for envelopes they created"
on public.audit_logs
for select
to authenticated
using (
  exists (
    select 1 from public.envelopes
    where envelopes.id = audit_logs.envelope_id
    and envelopes.sender_id = auth.uid()
  )
);

-- Index for performance
create index idx_audit_logs_envelope_id on public.audit_logs (envelope_id);
create index idx_audit_logs_created_at on public.audit_logs (created_at desc);
