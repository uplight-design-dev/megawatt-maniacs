-- Create question bank table for master question set
CREATE TABLE IF NOT EXISTS public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_a TEXT NOT NULL,
  answer_b TEXT NOT NULL,
  answer_c TEXT NOT NULL,
  answer_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on question bank
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

-- Create policies for question bank
CREATE POLICY "Anyone can view question bank"
  ON public.question_bank
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert question bank"
  ON public.question_bank
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update question bank"
  ON public.question_bank
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete question bank"
  ON public.question_bank
  FOR DELETE
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_question_bank_category ON public.question_bank(category);
