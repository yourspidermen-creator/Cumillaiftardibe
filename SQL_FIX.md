# Fix Voting Issues

If voting is not working, it is likely because the database table is missing the `mosque_id` column or the table wasn't created correctly.

Please run the following SQL in your Supabase SQL Editor to fix the table structure:

```sql
-- 1. Add mosque_id column if it doesn't exist
alter table votes add column if not exists mosque_id text;

-- 2. Ensure RLS policies exist
alter table votes enable row level security;

create policy "Enable insert for everyone" 
on votes for insert 
with check (true);

create policy "Enable read for everyone" 
on votes for select 
using (true);

-- 3. Verify the table has the correct columns
select * from votes limit 1;
```

After running this, try voting again.
