-- Add is_active column to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Create index for better query performance on active games
CREATE INDEX IF NOT EXISTS idx_games_is_active ON public.games(is_active);
