# 🔴 Supabase Realtime Configuration for Real-Time Synchronization

## 📋 What does this do?

It allows changes in projects to **synchronize instantly** between different browsers, tabs, and devices without needing to reload the page.

## ⚙️ Steps to Enable Realtime

### 1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your Learning Box project.

### 2. **Enable Realtime on the `projects` table**

#### Option A: From the UI (Easiest)
1. Go to **Database** > **Tables**.
2. Find the `projects` table.
3. Click on the 3 dots (⋮) > **Edit table**.
4. Scroll to the bottom and find **Realtime**.
5. ✅ **Enable** the "Enable Realtime" switch.
6. Click **Save**.

#### Option B: From SQL Editor (Fastest)
1. Go to **SQL Editor**.
2. Create a new query.
3. Paste this code:

```sql
-- Enable Realtime on the projects table
ALTER TABLE public.projects
REPLICA IDENTITY FULL;

-- Verify that it is enabled
SELECT schemaname, tablename, replica_identity
FROM pg_tables
WHERE tablename = 'projects';
```

4. Click **Run**.
5. You should see `replica_identity = 'f'` (which means FULL).

### 3. **Verify it works**

After enabling Realtime:

1. Open two different browsers (or two incognito windows).
2. Log in with the same account in both.
3. In browser 1: Create a new project.
4. In browser 2: **You should see the project appear automatically** without reloading.

You will see in the console:
```
[Realtime] Setting up Supabase Realtime subscriptions
[Realtime] Subscription status: SUBSCRIBED
[Realtime] Projects table change detected: {...}
[Sync] Reloading data from Supabase
```

## 🔍 Troubleshooting

### "Subscription status: CHANNEL_ERROR"
- Verify that Realtime is enabled on the `projects` table.
- Ensure your Supabase plan supports Realtime (Free tier does).

### "I don't see real-time changes"
1. Check the browser console logs.
2. Ensure both sessions are authenticated.
3. Verify that the `user_id` filter is correct.

### "Too many reloads"
- It is normal for `loadUserData()` to be called when changes are detected.
- Consider implementing debouncing if necessary.

## 📊 Synchronized Tables

Currently, only the `projects` table is configured for Realtime.

If you want to sync **atoms**, **sessions**, etc., repeat the process for those tables:

```sql
-- For atoms
ALTER TABLE public.atoms REPLICA IDENTITY FULL;

-- For sessions
ALTER TABLE public.sessions REPLICA IDENTITY FULL;

-- For learning_path_items
ALTER TABLE public.learning_path_items REPLICA IDENTITY FULL;
```

## 💡 Alternatives (if you don't want to use Realtime)

If you prefer not to use Realtime, the app already has **focus-based** synchronization:
- When you switch tabs/windows, it reloads automatically.
- It works but is not instantaneous.

## 📝 Important Notes

- ✅ Realtime is included in the Supabase **Free tier**.
- ✅ Only synchronizes data for the current user (via the `user_id` filter).
- ✅ Does not negatively affect performance.
- ⚠️ Ensure you have Row Level Security (RLS) enabled.

## 🎯 Expected Result

With Realtime enabled:
- ✅ Instant changes between browsers.
- ✅ No need to manually reload.
- ✅ Better user experience.
- ✅ Synchronization in less than 1 second.
