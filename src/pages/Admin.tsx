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
import { Trash2, Plus, Home } from "lucide-react";

interface Game {
  id: string;
  title: string;
  description: string;
}

interface Question {
  id: string;
  game_id: string;
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: string;
  explanation: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  
  // Game form
  const [gameTitle, setGameTitle] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  
  // Question form
  const [questionText, setQuestionText] = useState("");
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
      loadQuestions(selectedGameId);
    }
  }, [selectedGameId]);

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

  const loadQuestions = async (gameId: string) => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true });

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
    if (!confirm("Are you sure? This will delete all questions in this game.")) return;

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

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGameId) {
      toast.error("Please select a game first");
      return;
    }

    const { error } = await supabase
      .from("questions")
      .insert({
        game_id: selectedGameId,
        question_text: questionText,
        answer_a: answerA,
        answer_b: answerB,
        answer_c: answerC,
        answer_d: answerD,
        correct_answer: correctAnswer,
        explanation: explanation,
      });

    if (error) {
      toast.error("Failed to create question");
      return;
    }

    toast.success("Question created successfully");
    setQuestionText("");
    setAnswerA("");
    setAnswerB("");
    setAnswerC("");
    setAnswerD("");
    setCorrectAnswer("A");
    setExplanation("");
    loadQuestions(selectedGameId);
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
    loadQuestions(selectedGameId);
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
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
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

            {/* Create Question */}
            {selectedGameId && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-bold mb-4">Create New Question</h2>
                <form onSubmit={handleCreateQuestion} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question</Label>
                    <Textarea
                      id="question"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      required
                    />
                  </div>
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
                  <div className="space-y-2">
                    <Label htmlFor="explanation">Explanation</Label>
                    <Textarea
                      id="explanation"
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="uplight">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Question
                  </Button>
                </form>
              </Card>
            )}

            {/* Questions List */}
            {selectedGameId && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-bold mb-4">Questions</h2>
                {questions.length === 0 ? (
                  <p className="text-muted-foreground">No questions yet</p>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="p-4 border border-border rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold">
                            Q{index + 1}: {question.question_text}
                          </h3>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p>A: {question.answer_a}</p>
                          <p>B: {question.answer_b}</p>
                          <p>C: {question.answer_c}</p>
                          <p>D: {question.answer_d}</p>
                          <p className="text-primary font-bold">
                            Correct: {question.correct_answer}
                          </p>
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