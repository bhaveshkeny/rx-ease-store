# Supabase Setup Instructions

## Quick Setup for Local Development

### Option 1: Use Remote Supabase (Recommended for Testing)

1. Go to https://app.supabase.com/project/qhszupmhhschvbuxywuo/settings/api
2. Copy the **Project URL** and paste it into `.env.local` for `VITE_SUPABASE_URL`
3. Copy the **Anon Public Key** and paste it into `.env.local` for `VITE_SUPABASE_PUBLISHABLE_KEY`

Your `.env.local` should look like:
```
VITE_SUPABASE_URL=https://qhszupmhhschvbuxywuo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Option 2: Use Local Supabase (For Complete Offline Development)

1. Install Supabase CLI if not already installed:
   ```
   npm install -g supabase
   ```

2. Start local Supabase:
   ```
   cd e:\rx-ease-store
   supabase start
   ```

3. The CLI will output the local credentials. Copy them to `.env.local`:
   ```
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
   ```

## Next Steps

After updating `.env.local` with your actual credentials:

```bash
npm install
npm run dev
```

Then open http://localhost:5173 to see your pharmacy shop page!
