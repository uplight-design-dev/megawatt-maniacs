# Supabase Configuration Setup

## Environment Variables

You need to create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ziaaiizciqhdbsjqhtab.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_actual_publishable_key_here

# Database Connection (for direct PostgreSQL access if needed)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.ziaaiizciqhdbsjqhtab.supabase.co:5432/postgres
```

## Getting Your Supabase Keys

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/ziaaiizciqhdbsjqhtab
2. Navigate to Settings → API
3. Copy the following values:
   - **Project URL**: `https://ziaaiizciqhdbsjqhtab.supabase.co` (already provided above)
   - **anon/public key**: This is your `VITE_SUPABASE_PUBLISHABLE_KEY`

## Database Connection

The PostgreSQL connection string you provided:
```
postgresql://postgres:[YOUR_PASSWORD]@db.ziaaiizciqhdbsjqhtab.supabase.co:5432/postgres
```

Replace `[YOUR_PASSWORD]` with your actual database password from:
- Supabase Dashboard → Settings → Database → Database password

## Current Project Configuration

- **Project ID**: `ziaaiizciqhdbsjqhtab` (updated in config.toml)
- **Database**: PostgreSQL
- **Tables**: 
  - `question_bank` - Contains your trivia questions
  - `games`, `questions`, `rounds`, `users`, `leaderboard` - Game management tables

## Next Steps

1. Create the `.env.local` file with your actual keys
2. Test the connection by running the development server
3. Verify that questions can be loaded from the `question_bank` table

## Security Note

Never commit the `.env.local` file to version control. It contains sensitive information.
