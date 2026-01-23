-- Add 'name' column to envelopes table
ALTER TABLE envelopes 
ADD COLUMN IF NOT EXISTS name text DEFAULT 'Untitled Envelope';

-- Policy to allow users to update their own envelopes (for renaming)
create policy "Users can update their own envelopes"
on envelopes for update
to authenticated
using ( auth.uid() = sender_id )
with check ( auth.uid() = sender_id );

-- Policy to allow users to delete their own envelopes
create policy "Users can delete their own envelopes"
on envelopes for delete
to authenticated
using ( auth.uid() = sender_id );
