-- Create rounds table
CREATE TABLE IF NOT EXISTS public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(game_id, round_number)
);

-- Enable RLS on rounds
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

-- Create policies for rounds
CREATE POLICY "Anyone can view rounds"
  ON public.rounds
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert rounds"
  ON public.rounds
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rounds"
  ON public.rounds
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete rounds"
  ON public.rounds
  FOR DELETE
  USING (true);

-- Add round_id and image_caption to questions table
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS image_caption TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_round_id ON public.questions(round_id);
CREATE INDEX IF NOT EXISTS idx_rounds_game_id ON public.rounds(game_id);