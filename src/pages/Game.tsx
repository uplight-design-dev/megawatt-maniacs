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
    setSelectedAnswer(answer);
  };

  const handleTextSubmit = () => {
    // Just allow text input, no immediate feedback
  };

  const handleNextQuestion = () => {
    // Check if answer is correct and update score
    if (selectedAnswer === questions[currentQuestionIndex].correct_answer) {
      setScore(score + 1);
    } else if (textAnswer.trim().toLowerCase() === questions[currentQuestionIndex].correct_answer.toLowerCase()) {
      setScore(score + 1);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTextAnswer("");
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    const userId = sessionStorage.getItem("userId");
    if (!userId || userId === "guest") {
      sessionStorage.setItem("finalScore", score.toString());
      navigate("/results");
      return;
    }

    try {
      // Save individual game score to leaderboard
      await supabase.from("leaderboard").insert({
        user_id: userId,
        game_id: gameId,
        score: score,
      });

      // Update user's total cumulative score
      const { data: userData } = await supabase
        .from("users")
        .select("total_score")
        .eq("id", userId)
        .single();

      const newTotalScore = (userData?.total_score || 0) + score;

      await supabase
        .from("users")
        .update({ total_score: newTotalScore })
        .eq("id", userId);

      sessionStorage.setItem("finalScore", score.toString());
      sessionStorage.setItem("totalScore", newTotalScore.toString());
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

  const userName = sessionStorage.getItem("userName") || "Guest";

  return (
    <div className="min-h-screen pattern-background">
      {/* Header Navbar */}
      <div style={{ 
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        zIndex: "50",
        height: "105px",
        display: "flex",
        alignItems: "center",
        paddingLeft: "50px", 
        paddingRight: "50px",
        backgroundColor: "rgba(255, 255, 255, 0.01)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        width: "100vw"
      }}>
        <img src="/megawatt-maniac-white-logo.svg" alt="Megawatt Maniacs" className="w-[204px] h-[62px]" />
        <div className="flex-1 flex justify-center" style={{ marginLeft: "-102px" }}>
          <div className="flex items-center gap-3">
            <img src="/default-avatar-white.svg" alt="User Avatar" className="w-8 h-8" />
            <span className="text-white font-medium">{userName}</span>
          </div>
        </div>
        <img src="/back-bento@2x.png" alt="Menu" className="w-[37px] h-[35px]" />
      </div>

      {/* Spacer to ensure proper background coverage */}
      <div className="h-[20px]"></div>

      <div className="mx-auto pb-6" style={{ width: "900px", marginTop: "195px" }}>

        {/* Question */}
        <Card className="mb-6 bg-white rounded-2xl shadow-lg" style={{ paddingLeft: "90px", paddingRight: "90px", paddingTop: "70px", paddingBottom: "70px" }}>
          {/* Question Labels */}
          <div className="flex gap-3 mb-6">
            <span className="px-4 bg-white text-black rounded-full text-xs font-normal border border-black" style={{ fontFamily: 'Mark OT', fontSize: '12px', height: '27px', display: 'flex', alignItems: 'center' }}>
              ROUND 1
            </span>
            {currentQuestion.category && (
              <span className="px-4 bg-black text-white rounded-full text-sm font-bold" style={{ height: '27px', display: 'flex', alignItems: 'center' }}>
                Question {currentQuestionIndex + 1}: {currentQuestion.category}
              </span>
            )}
          </div>
          
          <h2 className="mb-6 text-black" style={{ fontFamily: 'Mark OT', fontSize: '42px', lineHeight: '110%', fontWeight: '400' }}>
            {currentQuestion.question_text}
          </h2>

          {/* Question Image */}
          {currentQuestion.question_image_url && (
            <div className="mb-6">
              <img 
                src={currentQuestion.question_image_url} 
                alt="Question illustration"
                className="w-full max-w-md mx-auto rounded-3xl"
              />
            </div>
          )}

          {/* Multiple Choice Answers */}
          {currentQuestion.question_type === 'multiple_choice' && (
            <div className="space-y-2 mb-8">
              {answers.map((answer) => {
                const isSelected = selectedAnswer === answer.letter;

                return (
                  <label
                    key={answer.letter}
                    className="flex items-center gap-4 cursor-pointer p-4 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="answer"
                        value={answer.letter}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(answer.letter)}
                        className="sr-only"
                      />
                      <div className={`
                        w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                        ${isSelected 
                          ? 'border-green-500 bg-green-500' 
                          : 'border-gray-300 bg-white'
                        }
                      `}>
                        {isSelected && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <span className="text-lg text-black flex-1">{answer.text}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Text Input Answer */}
          {currentQuestion.question_type === 'text_input' && (
            <div className="space-y-4 mb-8">
              {currentQuestion.explanation && (
                <p className="text-gray-600 text-sm">{currentQuestion.explanation}</p>
              )}
              <Input
                type="text"
                placeholder="Enter your answer here..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                className="bg-gray-50 border-gray-300 text-black"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTextSubmit();
                  }
                }}
              />
            </div>
          )}

          {/* Next Question Button */}
          <div className="flex justify-end" style={{ marginRight: "70px" }}>
            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer && !textAnswer.trim()}
              className="rounded-[99px] text-white text-lg font-medium transition-all hover:opacity-90 flex items-center gap-2"
              style={{
                backgroundColor: "#0047FF",
                boxShadow: "0px 6px 24px 0px rgba(0,71,255,0.47)",
                border: "1px solid rgba(0,0,0,0.2)",
                width: "197px",
                height: "51px"
              }}
            >
              {currentQuestionIndex < questions.length - 1 ? "Next Question" : "See Results"}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center" style={{ marginTop: "275px", paddingBottom: "32px" }}>
        <img src="/uplight-white-green-logo@2x.png" alt="Uplight" className="w-[222px] mx-auto mb-2" />
        <p className="text-white text-sm">Copyright © 2026 Uplight, Inc. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Game;