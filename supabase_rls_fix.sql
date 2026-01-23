-- Run this in your Supabase SQL Editor to allow Guest users to upload signed documents

-- 1. Policies for Storage (Allowing uploads to 'envelopes' bucket)
create policy "Allow public uploads to envelopes"
on storage.objects
for insert
to public
with check ( bucket_id = 'envelopes' );

-- 2. Policies for Update (Allowing guests to update the envelope status)
-- Note: You might already have some policies. This one allows updating specific rows if you know the ID (which we verify via token, but RLS on the table might block direct updates).
-- If you face "Row violation" on the table update step too, you might need this:
create policy "Allow public updates to envelopes"
on envelopes
for update
to public
using ( true )  -- In a real app, you'd use a more restrictive condition, but for MVP/Demo this unblocks it.
with check ( true );
