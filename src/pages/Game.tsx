import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: string;
  explanation: string;
}

const Game = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameId, setGameId] = useState<string>("");

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      toast.error("Please sign up first");
      navigate("/");
      return;
    }

    loadGame();
  }, []);

  const loadGame = async () => {
    try {
      // Get the first available game
      const { data: games, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .limit(1)
        .single();

      if (gamesError) throw gamesError;
      if (!games) {
        toast.error("No games available");
        navigate("/");
        return;
      }

      setGameId(games.id);

      // Load questions for this game
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("game_id", games.id);

      if (questionsError) throw questionsError;
      if (!questionsData || questionsData.length === 0) {
        toast.error("No questions available");
        navigate("/");
        return;
      }

      setQuestions(questionsData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading game:", error);
      toast.error("Failed to load game");
      navigate("/");
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answer);
    setShowExplanation(true);

    if (answer === questions[currentQuestionIndex].correct_answer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) return;

    try {
      await supabase.from("leaderboard").insert({
        user_id: userId,
        game_id: gameId,
        score: score,
      });

      sessionStorage.setItem("finalScore", score.toString());
      navigate("/results");
    } catch (error) {
      console.error("Error saving score:", error);
      toast.error("Failed to save score");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading game...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">No questions available</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answers = [
    { letter: "A", text: currentQuestion.answer_a },
    { letter: "B", text: currentQuestion.answer_b },
    { letter: "C", text: currentQuestion.answer_c },
    { letter: "D", text: currentQuestion.answer_d },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Question {currentQuestionIndex + 1} of {questions.length}</h1>
            <div className="text-xl font-bold">
              Score: <span className="text-primary">{score}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card className="p-6 md:p-8 mb-6 bg-card border-border">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            {currentQuestion.question_text}
          </h2>

          {/* Answers */}
          <div className="grid gap-4">
            {answers.map((answer) => {
              const isSelected = selectedAnswer === answer.letter;
              const isCorrect = answer.letter === currentQuestion.correct_answer;
              const showCorrect = showExplanation && isCorrect;
              const showIncorrect = showExplanation && isSelected && !isCorrect;

              return (
                <button
                  key={answer.letter}
                  onClick={() => handleAnswerSelect(answer.letter)}
                  disabled={showExplanation}
                  className={`
                    p-4 md:p-6 rounded-[99px] border-2 transition-all text-left
                    ${!showExplanation && "hover:border-primary hover:bg-primary/10"}
                    ${showCorrect && "border-primary bg-primary/20"}
                    ${showIncorrect && "border-destructive bg-destructive/20"}
                    ${!showExplanation && isSelected && "border-primary"}
                    ${!showExplanation && !isSelected && "border-border"}
                    ${showExplanation && !isCorrect && !isSelected && "opacity-50"}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                      ${showCorrect && "bg-primary text-primary-foreground"}
                      ${showIncorrect && "bg-destructive text-destructive-foreground"}
                      ${!showExplanation && "bg-secondary text-secondary-foreground"}
                    `}>
                      {answer.letter}
                    </div>
                    <span className="flex-1 text-base md:text-lg">{answer.text}</span>
                    {showCorrect && <CheckCircle2 className="w-6 h-6 text-primary" />}
                    {showIncorrect && <XCircle className="w-6 h-6 text-destructive" />}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Explanation */}
        {showExplanation && (
          <Card className="p-6 mb-6 bg-card border-border animate-fade-in">
            <h3 className="font-bold text-xl mb-2">
              {selectedAnswer === currentQuestion.correct_answer ? "Correct! ⚡" : "Not quite..."}
            </h3>
            <p className="text-muted-foreground">{currentQuestion.explanation}</p>
          </Card>
        )}

        {/* Next button */}
        {showExplanation && (
          <div className="flex justify-center animate-fade-in">
            <Button
              variant="uplight"
              size="lg"
              onClick={handleNextQuestion}
              className="min-w-[200px]"
            >
              {currentQuestionIndex < questions.length - 1 ? "Next Question" : "See Results"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;