# Database Setup Guide

PropReady now uses Supabase for data storage. The app will work with localStorage as a fallback if Supabase is not configured, but for production, you should set up Supabase.

## Quick Setup

### 1. Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `propready-ikhayalami` (or your preferred name)
   - Database Password: (choose a strong password)
   - Region: Choose closest to South Africa
5. Click "Create new project"
6. Wait for the project to be created (takes 1-2 minutes)

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

### 3. Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" to execute the SQL
5. Verify tables were created by going to **Table Editor**

### 4. (Optional) Property image uploads – create Storage bucket

If agents will **upload** property images (not only paste URLs), create a Supabase Storage bucket so uploads work:

1. In Supabase dashboard go to **Storage**
2. Click **New bucket**
3. Name: `property-images`
4. Enable **Public bucket** (so listing images can be displayed via public URLs)
5. Click **Create bucket**
6. In **Settings** → **API**, copy the **service_role** key and add it to your env as `SUPABASE_SERVICE_ROLE_KEY` (server-side only; never expose in client code)

Without this bucket, agents can still add images by pasting image URLs.

### 5. Add Environment Variables to Netlify

1. Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
2. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

(`SUPABASE_SERVICE_ROLE_KEY` is required for property image uploads; add it only if you use the `property-images` bucket.)

3. Click "Save"
4. Redeploy your site

### 6. Verify Setup

After deployment, test the following:
- User registration (quiz completion)
- Agent registration
- Login functionality
- Data persistence (data should persist across sessions)
- **Leads (buyers, sellers, investors)**: Complete the buyer quiz or seller quiz; open the agent dashboard — leads appear under Buyers or Sellers tab from the same `leads` table (filtered by type).

**If leads stay empty on the agent dashboard:**

1. **Check the leads API:** Open `https://your-site.netlify.app/api/leads/debug` in a browser. You should see:
   - `configured: true` – env vars are set
   - `tableOk: true` – leads table exists and is readable
   - `leadCount` – number of leads in the DB (0 is ok)

   If you see `tableOk: false` and an `error`, use the `hint` in the response or run the SQL below in Supabase.

2. **Create or fix the leads table** (Supabase → SQL Editor):
   - Run the full `supabase-schema.sql` to create all tables.
   - Run `supabase-migration-leads-seller-columns.sql` for seller fields.
   - Run `supabase-migration-leads-location.sql` for city/location matching.
   - Run `supabase-migration-viewings.sql` for viewing appointments (so viewings sync to the database).
   - If `agent_id` was NOT NULL: `ALTER TABLE leads ALTER COLUMN agent_id DROP NOT NULL;`
   - If inserts are blocked by RLS, run:
     ```sql
     DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;
     CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true) WITH CHECK (true);
     ```

3. **After submitting the quiz:** Open DevTools (F12) → Console. If lead save failed, you’ll see `Lead save to database failed:` with the API error.

## Database Schema

The database includes the following tables:
- `users` - User accounts
- `quiz_results` - Pre-qualification quiz results
- `agents` - Registered real estate agents
- `documents` - User-uploaded documents
- `properties` - Property listings
- `leads` - All leads (buyers, sellers, investors); one table with `lead_type`, seller fields, and `city` for location matching
- `viewing_appointments` - Property viewing appointments (created by `supabase-migration-viewings.sql`)

See `supabase-schema.sql` for the complete schema. Run `supabase-migration-viewings.sql` so viewings scheduled by agents are stored in the database and appear on buyer/seller dashboards.

## Fallback Mode

If Supabase credentials are not configured, the app will automatically use localStorage as a fallback. This is useful for development but not recommended for production.

## Security Notes

- Row Level Security (RLS) is enabled but currently allows all operations
- In production, you should create proper RLS policies
- Passwords are stored in plain text - implement proper hashing before production
- Consider using Supabase Auth for authentication instead of custom password handling
