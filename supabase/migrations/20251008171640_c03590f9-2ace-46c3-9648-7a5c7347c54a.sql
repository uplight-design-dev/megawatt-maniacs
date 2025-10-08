-- Create users table for trivia players
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  answer_a TEXT NOT NULL,
  answer_b TEXT NOT NULL,
  answer_c TEXT NOT NULL,
  answer_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create leaderboard table
CREATE TABLE public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Everyone can read users (for leaderboard display)
CREATE POLICY "Anyone can view users"
  ON public.users FOR SELECT
  USING (true);

-- Anyone can insert a new user (for signup)
CREATE POLICY "Anyone can create user"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- RLS Policies for games table
-- Everyone can read games
CREATE POLICY "Anyone can view games"
  ON public.games FOR SELECT
  USING (true);

-- Only authenticated users can manage games (admin)
CREATE POLICY "Authenticated users can insert games"
  ON public.games FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update games"
  ON public.games FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete games"
  ON public.games FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for questions table
-- Everyone can read questions
CREATE POLICY "Anyone can view questions"
  ON public.questions FOR SELECT
  USING (true);

-- Only authenticated users can manage questions (admin)
CREATE POLICY "Authenticated users can insert questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update questions"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete questions"
  ON public.questions FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for leaderboard table
-- Everyone can read leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard FOR SELECT
  USING (true);

-- Anyone can insert leaderboard entries
CREATE POLICY "Anyone can create leaderboard entry"
  ON public.leaderboard FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_questions_game_id ON public.questions(game_id);
CREATE INDEX idx_leaderboard_game_id ON public.leaderboard(game_id);
CREATE INDEX idx_leaderboard_score ON public.leaderboard(score DESC);
CREATE INDEX idx_users_email ON public.users(email);