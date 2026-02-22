# Supabase Configuration for Learning Box

This guide will help you configure Supabase as the database and authentication system for Learning Box.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account.
2. Create a new project.
3. Wait for the project to initialize (it may take a few minutes).

## Step 2: Configure Environment Variables

1. in your Supabase project, go to `Settings` > `API`.
2. Copy the following credentials:
   - `Project URL`
   - `anon public key`  
   - `service_role key` (keep this key secret)

3. Update your `.env` file with these values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Execute the Database Schema

1. In your Supabase project, go to `SQL Editor`.
2. Copy all the content from the `database/schema.sql` file.
3. Paste it into the editor and run the script.
4. This will create all the necessary tables, indexes, security policies, and functions.

## Step 4: Configure Authentication

### Email Authentication

Email authentication is already configured by default.

### Google Authentication (Optional)

1. In your Supabase project, go to `Authentication` > `Settings` > `Auth Providers`.
2. Enable Google as a provider.
3. Configure Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing one.
   - Enable the Google+ API.
   - Create OAuth 2.0 credentials.
   - Configure redirection URLs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:9002` (for development)

## Step 5: Configure Security Policies (RLS)

Row Level Security policies are already included in the SQL schema and provide:

- **Profiles**: Users can only see and edit their own profiles.
- **Projects**: Users can only see their own projects or public projects.
- **Atoms, Sources, Sessions**: Only accessible by the project owner.
- **Automatic Security**: No need to manually validate permissions in the frontend.

## Step 6: Verify Configuration

1. Start your application: `npm run dev`.
2. Go to `/signup` and create a new account.
3. Verify that you can log in at `/login`.
4. Verify that a profile is automatically created in the `profiles` table.

## Database Structure

### Main Tables:

- **profiles**: Extends auth.users with additional user information.
- **projects**: Learning projects for each user.
- **atoms**: Knowledge atoms (questions/answers) with FSRS metrics.
- **sources**: Uploaded sources/materials for each project.
- **sessions**: Study sessions for each project.
- **learning_path_items**: Elements of the learning plan.
- **session_atoms**: Many-to-many relationship between sessions and atoms.

### Automatic Functions:

- **handle_new_user()**: Automatically creates a profile when a user registers.
- **update_updated_at_column()**: Automatically updates timestamps.

### Optimized Indexes:

- Fast queries by user, project, and status.
- Efficient searching of public projects.
- Rapid filtering by FSRS review dates.

## Existing Data Migration

If you already have data in localStorage, you can migrate it by running:

```typescript
// Migration code will be available in ProjectContext
await migrateLocalStorageToSupabase()
```

## Troubleshooting

### Error: "Invalid JWT"
- Verify that environment variables are correct.
- Ensure you have restarted the server after changing variables.

### Error: "Row Level Security"
- Verify that RLS policies were created correctly.
- Re-run the SQL script if necessary.

### Connection Error
- Verify that the Supabase project is active.
- Check that the project URL is correct.

## Next Steps

Once Supabase is configured:

1. Data will be automatically saved in the database.
2. Users can access their projects from any device.
3. Public projects will be available to the entire community.
4. FSRS metrics will be maintained persistently.

Your Learning Box application is now ready for production with Supabase!