-- Add question_type and question_image_url to questions table
ALTER TABLE public.questions 
ADD COLUMN question_type text NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'text_input')),
ADD COLUMN question_image_url text;

-- Add category field for question categorization
ALTER TABLE public.questions 
ADD COLUMN category text;