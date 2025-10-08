import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  question_type: string;
  question_image_url?: string;
  category?: string;
}

const Game = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
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

  const handleTextSubmit = () => {
    if (showExplanation || !textAnswer.trim()) return;
    
    setShowExplanation(true);
    
    // Check if text answer matches correct answer (case insensitive)
    const isCorrect = textAnswer.trim().toLowerCase() === 
      questions[currentQuestionIndex].correct_answer.toLowerCase();
    
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTextAnswer("");
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
    <div className="min-h-screen pattern-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <span className="px-4 py-2 bg-white text-uplight-black rounded-full text-sm font-bold">
                ROUND 1
              </span>
              {currentQuestion.category && (
                <span className="px-4 py-2 bg-uplight-black text-white rounded-full text-sm font-bold">
                  Question {currentQuestionIndex + 1}: {currentQuestion.category}
                </span>
              )}
            </div>
            <div className="text-xl font-bold text-white">
              Score: <span className="text-primary">{score}</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <Card className="p-6 md:p-8 mb-6 bg-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-uplight-black">
            {currentQuestion.question_text}
          </h2>

          {/* Question Image */}
          {currentQuestion.question_image_url && (
            <div className="mb-6">
              <img 
                src={currentQuestion.question_image_url} 
                alt="Question illustration"
                className="w-full max-w-md mx-auto rounded-lg"
              />
            </div>
          )}

          {/* Multiple Choice Answers */}
          {currentQuestion.question_type === 'multiple_choice' && (
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
                      ${!showExplanation && "hover:border-secondary hover:bg-secondary/10"}
                      ${showCorrect && "border-primary bg-primary/20"}
                      ${showIncorrect && "border-destructive bg-destructive/20"}
                      ${!showExplanation && isSelected && "border-secondary"}
                      ${!showExplanation && !isSelected && "border-border"}
                      ${showExplanation && !isCorrect && !isSelected && "opacity-50"}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                        ${showCorrect && "bg-primary text-primary-foreground"}
                        ${showIncorrect && "bg-destructive text-destructive-foreground"}
                        ${!showExplanation && "bg-uplight-gray text-white"}
                      `}>
                        {answer.letter}
                      </div>
                      <span className="flex-1 text-base md:text-lg text-uplight-black">{answer.text}</span>
                      {showCorrect && <CheckCircle2 className="w-6 h-6 text-primary" />}
                      {showIncorrect && <XCircle className="w-6 h-6 text-destructive" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Text Input Answer */}
          {currentQuestion.question_type === 'text_input' && (
            <div className="space-y-4">
              {currentQuestion.explanation && !showExplanation && (
                <p className="text-uplight-gray">{currentQuestion.explanation}</p>
              )}
              <Input
                type="text"
                placeholder="Enter your answer here..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={showExplanation}
                className="bg-uplight-light-gray border-0 text-uplight-black"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTextSubmit();
                  }
                }}
              />
              {!showExplanation && (
                <Button
                  variant="uplight"
                  size="lg"
                  onClick={handleTextSubmit}
                  disabled={!textAnswer.trim()}
                  className="w-full md:w-auto"
                >
                  Submit & Continue
                </Button>
              )}
              {showExplanation && (
                <div className={`p-4 rounded-lg ${
                  textAnswer.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase()
                    ? "bg-primary/20 border-2 border-primary"
                    : "bg-destructive/20 border-2 border-destructive"
                }`}>
                  <p className="font-bold text-uplight-black">
                    {textAnswer.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase()
                      ? `Correct! ⚡`
                      : `Not quite... The correct answer is: ${currentQuestion.correct_answer}`
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Explanation for Multiple Choice */}
        {showExplanation && currentQuestion.question_type === 'multiple_choice' && (
          <Card className="p-6 mb-6 bg-white animate-fade-in">
            <h3 className="font-bold text-xl mb-2 text-uplight-black">
              {selectedAnswer === currentQuestion.correct_answer ? "Correct! ⚡" : "Not quite..."}
            </h3>
            <p className="text-uplight-gray">{currentQuestion.explanation}</p>
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