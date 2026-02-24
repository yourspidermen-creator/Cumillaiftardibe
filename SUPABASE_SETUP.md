# Supabase Setup Instructions

To make the voting functionality work, you need to set up a Supabase project.

## 1. Create Project
1. Go to [database.new](https://database.new) and create a new project.
2. Wait for the database to start.

## 2. Run SQL
Go to the **SQL Editor** in your Supabase dashboard and run the following script:

```sql
-- Create the votes table
create table if not exists votes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  mosque_id text not null,
  vote_type text check (vote_type in ('true', 'fake')) not null
);

-- Enable Row Level Security (RLS)
alter table votes enable row level security;

-- Allow public access to insert votes
create policy "Enable insert for everyone" 
on votes for insert 
with check (true);

-- Allow public access to read votes (for counting)
create policy "Enable read for everyone" 
on votes for select 
using (true);

-- Optional: Create a realtime publication
alter publication supabase_realtime add table votes;
```

## 3. Get API Keys
1. Go to **Project Settings** > **API**.
2. Copy the `Project URL` and `anon` public key.
3. Update your `.env` file (or Vercel environment variables) with these values:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 4. Deploy to Vercel
When deploying to Vercel, make sure to add the environment variables in the Vercel project settings.
