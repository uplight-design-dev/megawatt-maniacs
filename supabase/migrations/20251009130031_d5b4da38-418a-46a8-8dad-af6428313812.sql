-- Add total_score column to users table to track cumulative score across all games
ALTER TABLE public.users 
ADD COLUMN total_score integer NOT NULL DEFAULT 0;