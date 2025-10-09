import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Home, Pencil } from "lucide-react";

interface Game {
  id: string;
  title: string;
  description: string;
}

interface Round {
  id: string;
  game_id: string;
  title: string;
  round_number: number;
}

interface Question {
  id: string;
  game_id: string;
  round_id: string | null;
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: string;
  explanation: string;
  question_type: string;
  question_image_url?: string;
  image_caption?: string;
  category?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // Game form
  const [gameTitle, setGameTitle] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  
  // Round form
  const [roundTitle, setRoundTitle] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  
  // Question form
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"multiple_choice" | "text_input">("multiple_choice");
  const [category, setCategory] = useState("");
  const [questionImageUrl, setQuestionImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [answerA, setAnswerA] = useState("");
  const [answerB, setAnswerB] = useState("");
  const [answerC, setAnswerC] = useState("");
  const [answerD, setAnswerD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      loadGames();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedGameId) {
      loadRounds(selectedGameId);
      setSelectedRoundId("");
    }
  }, [selectedGameId]);

  useEffect(() => {
    if (selectedRoundId) {
      loadQuestions(selectedRoundId);
    } else if (selectedGameId) {
      loadQuestions(selectedGameId);
    }
  }, [selectedRoundId, selectedGameId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple hardcoded admin check
    if (username === "admin" && password === "mwm123") {
      // Sign in with Supabase auth for database access
      const { error } = await supabase.auth.signInWithPassword({
        email: "admin@megawattmaniacs.com",
        password: "mwm123admin",
      });

      if (error) {
        // If admin user doesn't exist, create it
        const { error: signUpError } = await supabase.auth.signUp({
          email: "admin@megawattmaniacs.com",
          password: "mwm123admin",
        });
        
        if (signUpError) {
          toast.error("Authentication error");
          return;
        }
      }

      setIsAuthenticated(true);
      toast.success("Logged in successfully");
    } else {
      toast.error("Invalid credentials");
    }
  };

  const loadGames = async () => {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load games");
      return;
    }

    setGames(data || []);
    if (data && data.length > 0 && !selectedGameId) {
      setSelectedGameId(data[0].id);
    }
  };

  const loadRounds = async (gameId: string) => {
    const { data, error } = await supabase
      .from("rounds")
      .select("*")
      .eq("game_id", gameId)
      .order("round_number", { ascending: true });

    if (error) {
      toast.error("Failed to load rounds");
      return;
    }

    setRounds(data || []);
  };

  const loadQuestions = async (roundOrGameId: string) => {
    let query = supabase.from("questions").select("*");
    
    if (selectedRoundId) {
      query = query.eq("round_id", roundOrGameId);
    } else {
      query = query.eq("game_id", roundOrGameId);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load questions");
      return;
    }

    setQuestions(data || []);
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from("games")
      .insert({ title: gameTitle, description: gameDescription })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create game");
      return;
    }

    toast.success("Game created successfully");
    setGameTitle("");
    setGameDescription("");
    loadGames();
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm("Are you sure? This will delete all rounds and questions in this game.")) return;

    const { error } = await supabase
      .from("games")
      .delete()
      .eq("id", gameId);

    if (error) {
      toast.error("Failed to delete game");
      return;
    }

    toast.success("Game deleted successfully");
    loadGames();
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGameId) {
      toast.error("Please select a game first");
      return;
    }

    const { error } = await supabase
      .from("rounds")
      .insert({ 
        game_id: selectedGameId, 
        title: roundTitle, 
        round_number: roundNumber 
      });

    if (error) {
      toast.error("Failed to create round");
      return;
    }

    toast.success("Round created successfully");
    setRoundTitle("");
    setRoundNumber(rounds.length + 2);
    loadRounds(selectedGameId);
  };

  const handleDeleteRound = async (roundId: string) => {
    if (!confirm("Are you sure? This will delete all questions in this round.")) return;

    const { error } = await supabase
      .from("rounds")
      .delete()
      .eq("id", roundId);

    if (error) {
      toast.error("Failed to delete round");
      return;
    }

    toast.success("Round deleted successfully");
    loadRounds(selectedGameId);
  };

  const clearQuestionForm = () => {
    setQuestionText("");
    setQuestionType("multiple_choice");
    setCategory("");
    setQuestionImageUrl("");
    setImageCaption("");
    setAnswerA("");
    setAnswerB("");
    setAnswerC("");
    setAnswerD("");
    setCorrectAnswer("A");
    setExplanation("");
    setEditingQuestionId(null);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    setQuestionText(question.question_text);
    setQuestionType(question.question_type as "multiple_choice" | "text_input");
    setCategory(question.category || "");
    setQuestionImageUrl(question.question_image_url || "");
    setImageCaption(question.image_caption || "");
    setAnswerA(question.answer_a);
    setAnswerB(question.answer_b);
    setAnswerC(question.answer_c);
    setAnswerD(question.answer_d);
    setCorrectAnswer(question.correct_answer);
    setExplanation(question.explanation);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateOrUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGameId) {
      toast.error("Please select a game first");
      return;
    }

    const questionData: any = {
      game_id: selectedGameId,
      question_text: questionText,
      question_type: questionType,
      correct_answer: correctAnswer,
      explanation: explanation,
    };

    if (selectedRoundId) questionData.round_id = selectedRoundId;
    if (category) questionData.category = category;
    if (questionImageUrl) questionData.question_image_url = questionImageUrl;
    if (imageCaption) questionData.image_caption = imageCaption;

    // For multiple choice, include all answers
    if (questionType === "multiple_choice") {
      questionData.answer_a = answerA;
      questionData.answer_b = answerB;
      questionData.answer_c = answerC;
      questionData.answer_d = answerD;
    } else {
      // For text input, just use empty strings for unused fields
      questionData.answer_a = "";
      questionData.answer_b = "";
      questionData.answer_c = "";
      questionData.answer_d = "";
    }

    if (editingQuestionId) {
      // Update existing question
      const { error } = await supabase
        .from("questions")
        .update(questionData)
        .eq("id", editingQuestionId);

      if (error) {
        toast.error("Failed to update question");
        return;
      }

      toast.success("Question updated successfully");
    } else {
      // Create new question
      const { error } = await supabase
        .from("questions")
        .insert(questionData);

      if (error) {
        toast.error("Failed to create question");
        return;
      }

      toast.success("Question created successfully");
    }

    clearQuestionForm();
    loadQuestions(selectedRoundId || selectedGameId);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure?")) return;

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      toast.error("Failed to delete question");
      return;
    }

    toast.success("Question deleted successfully");
    loadQuestions(selectedRoundId || selectedGameId);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-card border-border">
          <h1 className="text-3xl font-bold mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="uplight" size="lg" className="w-full">
              Login
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <Home className="w-5 h-5 mr-2" />
            Home
          </Button>
        </div>

        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="games">Manage Games</TabsTrigger>
            <TabsTrigger value="questions">Manage Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="space-y-6">
            {/* Create Game */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-2xl font-bold mb-4">Create New Game</h2>
              <form onSubmit={handleCreateGame} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="game-title">Title</Label>
                  <Input
                    id="game-title"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="game-description">Description</Label>
                  <Textarea
                    id="game-description"
                    value={gameDescription}
                    onChange={(e) => setGameDescription(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="uplight">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Game
                </Button>
              </form>
            </Card>

            {/* Games List */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-2xl font-bold mb-4">Existing Games</h2>
              {games.length === 0 ? (
                <p className="text-muted-foreground">No games yet</p>
              ) : (
                <div className="space-y-3">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-4 border border-border rounded-[24px]"
                    >
                      <div>
                        <h3 className="font-bold text-lg">{game.title}</h3>
                        <p className="text-sm text-muted-foreground">{game.description}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteGame(game.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            {/* Select Game */}
            {games.length > 0 && (
              <Card className="p-6 bg-card border-border">
                <Label htmlFor="game-select">Select Game</Label>
                <select
                  id="game-select"
                  className="w-full mt-2 p-2 bg-background border border-border rounded-md"
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                >
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.title}
                    </option>
                  ))}
                </select>
              </Card>
            )}

            {/* Manage Rounds */}
            {selectedGameId && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-bold mb-4">Manage Rounds</h2>
                
                {/* Create Round Form */}
                <form onSubmit={handleCreateRound} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="round-title">Round Title</Label>
                      <Input
                        id="round-title"
                        value={roundTitle}
                        onChange={(e) => setRoundTitle(e.target.value)}
                        placeholder="e.g., Opening Round"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="round-number">Round Number</Label>
                      <Input
                        id="round-number"
                        type="number"
                        min="1"
                        value={roundNumber}
                        onChange={(e) => setRoundNumber(parseInt(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="uplight">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Round
                  </Button>
                </form>

                {/* Rounds List */}
                {rounds.length === 0 ? (
                  <p className="text-muted-foreground">No rounds yet. Create one to organize questions.</p>
                ) : (
                  <div className="space-y-3">
                    <Label>Select Round (optional - leave unselected to view all questions)</Label>
                    <div className="space-y-2">
                      {rounds.map((round) => (
                        <div
                          key={round.id}
                          className={`flex items-center justify-between p-4 border rounded-[24px] cursor-pointer transition-colors ${
                            selectedRoundId === round.id 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedRoundId(selectedRoundId === round.id ? "" : round.id)}
                        >
                          <div>
                            <h3 className="font-bold">
                              Round {round.round_number}: {round.title}
                            </h3>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRound(round.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Create/Edit Question */}
            {selectedGameId && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-bold mb-4">
                  {editingQuestionId ? "Edit Question" : "Create New Question"}
                </h2>
                <form onSubmit={handleCreateOrUpdateQuestion} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question-type">Question Type</Label>
                    <select
                      id="question-type"
                      className="w-full p-2 bg-background border border-border rounded-md"
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value as "multiple_choice" | "text_input")}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="text_input">Text Input</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category (optional)</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., History, Science"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="question">Question</Label>
                    <Textarea
                      id="question"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image-url">Image URL (optional)</Label>
                    <Input
                      id="image-url"
                      value={questionImageUrl}
                      onChange={(e) => setQuestionImageUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image-caption">Image Caption/Reference (optional)</Label>
                    <Input
                      id="image-caption"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      placeholder="Additional context about the image"
                    />
                  </div>

                  {questionType === "multiple_choice" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="answer-a">Answer A</Label>
                          <Input
                            id="answer-a"
                            value={answerA}
                            onChange={(e) => setAnswerA(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="answer-b">Answer B</Label>
                          <Input
                            id="answer-b"
                            value={answerB}
                            onChange={(e) => setAnswerB(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="answer-c">Answer C</Label>
                          <Input
                            id="answer-c"
                            value={answerC}
                            onChange={(e) => setAnswerC(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="answer-d">Answer D</Label>
                          <Input
                            id="answer-d"
                            value={answerD}
                            onChange={(e) => setAnswerD(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="correct">Correct Answer</Label>
                        <select
                          id="correct"
                          className="w-full p-2 bg-background border border-border rounded-md"
                          value={correctAnswer}
                          onChange={(e) => setCorrectAnswer(e.target.value)}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="text-answer">Correct Answer (text)</Label>
                      <Input
                        id="text-answer"
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        placeholder="Enter the exact answer"
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Note: Answer matching is case-insensitive
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="explanation">
                      {questionType === "text_input" ? "Context/Additional Info (optional)" : "Explanation"}
                    </Label>
                    <Textarea
                      id="explanation"
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      placeholder={questionType === "text_input" ? "Provide context or information about the question" : "Explain why this is the correct answer"}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="uplight">
                      {editingQuestionId ? (
                        <>
                          <Pencil className="w-4 h-4 mr-2" />
                          Update Question
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Question
                        </>
                      )}
                    </Button>
                    {editingQuestionId && (
                      <Button type="button" variant="ghost" onClick={clearQuestionForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Card>
            )}

            {/* Questions List */}
            {selectedGameId && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-bold mb-4">
                  Questions {selectedRoundId && rounds.find(r => r.id === selectedRoundId) && 
                    `- ${rounds.find(r => r.id === selectedRoundId)?.title}`}
                </h2>
                {questions.length === 0 ? (
                  <p className="text-muted-foreground">No questions yet</p>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="p-4 border border-border rounded-[24px]"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex gap-2 mb-2">
                              <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                                {question.question_type === "multiple_choice" ? "Multiple Choice" : "Text Input"}
                              </span>
                              {question.category && (
                                <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded">
                                  {question.category}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold">
                              Q{index + 1}: {question.question_text}
                            </h3>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditQuestion(question)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {question.question_image_url && (
                          <div className="mb-2">
                            <img src={question.question_image_url} alt="Question" className="w-32 h-32 object-cover rounded mb-1" />
                            {question.image_caption && (
                              <p className="text-xs text-muted-foreground italic">{question.image_caption}</p>
                            )}
                          </div>
                        )}
                        <div className="space-y-1 text-sm">
                          {question.question_type === "multiple_choice" ? (
                            <>
                              <p>A: {question.answer_a}</p>
                              <p>B: {question.answer_b}</p>
                              <p>C: {question.answer_c}</p>
                              <p>D: {question.answer_d}</p>
                              <p className="text-primary font-bold">
                                Correct: {question.correct_answer}
                              </p>
                            </>
                          ) : (
                            <p className="text-primary font-bold">
                              Correct Answer: {question.correct_answer}
                            </p>
                          )}
                          {question.explanation && (
                            <p className="text-muted-foreground italic">
                              {question.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;