-- Add source field to questions table
ALTER TABLE public.questions 
ADD COLUMN source TEXT;
