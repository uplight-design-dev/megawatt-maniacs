import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Plus, Home, Pencil, Check, X, Eye } from "lucide-react";

interface Game {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_active?: boolean;
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
  explanation: string | null;
  question_type: string;
  question_image_url?: string;
  image_caption?: string;
  category?: string;
}

interface QuestionBankItem {
  id: string;
  Category: string;
  Question: string;
  A: string;
  B: string;
  C: string;
  "Correct Answer": string;
  "Source (Include a url)": string | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [activeGameId, setActiveGameId] = useState<string>("");
  
  // Question bank state
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<Set<string>>(new Set());
  const [bankCategoryFilter, setBankCategoryFilter] = useState<string>("");
  const [editingBankQuestionId, setEditingBankQuestionId] = useState<string | null>(null);
  
  // Game form
  const [gameTitle, setGameTitle] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  
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
  
  // Display name in header
  const userName = "Admin";

  useEffect(() => {
    if (isAuthenticated) {
      loadGames();
      loadQuestionBank();
      loadActiveGame();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedGameId) {
      loadQuestions(selectedGameId);
    }
  }, [selectedGameId]);

  // Auto-adjust correct answer if D is cleared
  useEffect(() => {
    if (correctAnswer === "D" && !answerD.trim()) {
      setCorrectAnswer("A");
    }
  }, [answerD, correctAnswer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple hardcoded admin check
    if (username === "admin" && password === "mwm123") {
      try {
        // Sign in with Supabase auth for database access
        const { error } = await supabase.auth.signInWithPassword({
          email: "eric.leach@uplight.com",
          password: "mwm123",
        });

        if (error) {
          console.log("Sign in failed, attempting to create admin user:", error.message);
          // If admin user doesn't exist, create it
          const { error: signUpError } = await supabase.auth.signUp({
            email: "admin@megawattmaniacs.com",
            password: "mwm123admin",
          });
          
          if (signUpError) {
            console.error("Sign up error:", signUpError);
            toast.error(`Authentication error: ${signUpError.message}`);
            return;
          }
          
          // Try to sign in again after creating the user
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: "admin@megawattmaniacs.com",
            password: "mwm123admin",
          });
          
          if (retryError) {
            console.error("Retry sign in error:", retryError);
            toast.error(`Authentication error: ${retryError.message}`);
            return;
          }
        }

        setIsAuthenticated(true);
        toast.success("Logged in successfully");
      } catch (err) {
        console.error("Login exception:", err);
        toast.error("Authentication failed");
      }
    } else {
      toast.error("Invalid credentials");
    }
  };

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Games load error:", error);
        toast.error(`Failed to load games: ${error.message}`);
        return;
      }

      setGames(data || []);
      if (data && data.length > 0 && !selectedGameId) {
        setSelectedGameId(data[0].id);
      }
    } catch (err) {
      console.error("Games load exception:", err);
      toast.error("Failed to load games");
    }
  };

  const loadQuestions = async (gameId: string) => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Questions load error:", error);
        toast.error(`Failed to load questions: ${error.message}`);
        return;
      }

      setQuestions(data || []);
    } catch (err) {
      console.error("Questions load exception:", err);
      toast.error("Failed to load questions");
    }
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
    setEditingBankQuestionId(null);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    setEditingBankQuestionId(null);
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
    setExplanation(question.explanation || "");
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditBankQuestion = (question: QuestionBankItem) => {
    setEditingBankQuestionId(question.id);
    setEditingQuestionId(null);
    setQuestionText(question.Question);
    setQuestionType("multiple_choice"); // Question bank only supports multiple choice
    setCategory(question.Category || "");
    setQuestionImageUrl(""); // Question bank doesn't support images
    setImageCaption(""); // Question bank doesn't support image captions
    setAnswerA(question.A);
    setAnswerB(question.B);
    setAnswerC(question.C);
    setAnswerD(""); // Question bank doesn't have answer_d
    setCorrectAnswer(question["Correct Answer"]);
    setExplanation(""); // Question bank doesn't have explanation
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateOrUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGameId) {
      toast.error("Please select a game first");
      return;
    }

    // Validate required fields
    if (!questionText.trim()) {
      toast.error("Question text is required");
      return;
    }
    if (questionType === "multiple_choice" && (!answerA.trim() || !answerB.trim() || !answerC.trim())) {
      toast.error("Answers A, B, and C are required for multiple choice questions");
      return;
    }

    const questionData: any = {
      game_id: selectedGameId,
      question_text: questionText,
      question_type: questionType,
      category: category || null,
      answer_a: answerA,
      answer_b: answerB,
      answer_c: answerC,
      answer_d: answerD,
      correct_answer: correctAnswer,
      explanation: explanation || null,
      question_image_url: questionImageUrl || null,
      image_caption: imageCaption || null,
    };

    try {
      if (editingQuestionId) {
        // Update existing question
        const { error } = await supabase
          .from("questions")
          .update(questionData)
          .eq("id", editingQuestionId);

        if (error) {
          console.error("Question update error:", error);
          toast.error(`Failed to update question: ${error.message}`);
          return;
        }

        toast.success("Question updated successfully");
      } else {
        // Create new question
        const { error } = await supabase
          .from("questions")
          .insert(questionData);

        if (error) {
          console.error("Question creation error:", error);
          toast.error(`Failed to create question: ${error.message}`);
          return;
        }

        toast.success("Question added successfully");
      }

      clearQuestionForm();
      loadQuestions(selectedGameId);
    } catch (err) {
      console.error("Question operation exception:", err);
      toast.error("Failed to save question");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (error) {
        console.error("Question delete error:", error);
        toast.error(`Failed to delete question: ${error.message}`);
        return;
      }

      toast.success("Question deleted successfully");
      loadQuestions(selectedGameId);
    } catch (err) {
      console.error("Question delete exception:", err);
      toast.error("Failed to delete question");
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // no-op
    } finally {
      setIsAuthenticated(false);
      navigate("/");
    }
  };

  // Active game management functions
  const loadActiveGame = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("id, is_active")
        .eq("is_active", true)
        .maybeSingle();
      
      if (!error && data) {
        setActiveGameId(data.id);
      }
    } catch (err) {
      console.error("Error loading active game:", err);
      // If is_active column doesn't exist yet, that's okay
    }
  };

  const handleSetActiveGame = async (gameId: string) => {
    try {
      console.log("Starting to set active game:", gameId);
      
      // Use a transaction-like approach: first deactivate all, then activate the selected one
      const { error: deactivateError } = await supabase
        .from("games")
        .update({ is_active: false })
        .neq("id", gameId); // Deactivate all games except the one we want to activate
      
      if (deactivateError) {
        console.error("Error deactivating games:", deactivateError);
        throw deactivateError;
      }
      
      // Then activate the selected game
      const { error } = await supabase
        .from("games")
        .update({ is_active: true })
        .eq("id", gameId);
      
      if (error) {
        console.error("Error activating game:", error);
        throw error;
      }
      
      console.log("Successfully activated game:", gameId);
      setActiveGameId(gameId);
      toast.success("Active game updated successfully");
    } catch (error) {
      console.error("Error setting active game:", error);
      toast.error(`Failed to update active game: ${error.message}`);
    }
  };

  // Question bank functions
  const loadQuestionBank = async () => {
    try {
      const { data, error } = await supabase
        .from("question_bank")
        .select("*")
        .order("Category", { ascending: true });

      if (error) {
        console.error("Question bank load error:", error);
        toast.error(`Failed to load question bank: ${error.message}`);
        return;
      }

      setQuestionBank((data as QuestionBankItem[]) || []);
      console.log("Question bank loaded successfully:", data?.length || 0, "questions");
    } catch (err) {
      console.error("Question bank load exception:", err);
      toast.error("Failed to load question bank");
    }
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(questionBank.map(q => q.Category))];
    return categories.sort();
  };

  const getFilteredQuestionBank = () => {
    if (!bankCategoryFilter) return questionBank;
    return questionBank.filter(q => q.Category === bankCategoryFilter);
  };

  const toggleBankQuestionSelection = (questionId: string) => {
    const newSelection = new Set(selectedBankQuestions);
    if (newSelection.has(questionId)) {
      newSelection.delete(questionId);
    } else {
      newSelection.add(questionId);
    }
    setSelectedBankQuestions(newSelection);
  };

  const selectAllBankQuestions = () => {
    const filtered = getFilteredQuestionBank();
    setSelectedBankQuestions(new Set(filtered.map(q => q.id)));
  };

  const deselectAllBankQuestions = () => {
    setSelectedBankQuestions(new Set());
  };

  const handleAddSelectedBankQuestions = async () => {
    if (!selectedGameId) {
      toast.error("Please select a game first");
      return;
    }
    
    if (selectedBankQuestions.size === 0) {
      toast.error("Please select questions to add");
      return;
    }
    
    try {
      const selectedQuestions = questionBank.filter(q => selectedBankQuestions.has(q.id));
      const questionsToAdd = selectedQuestions.map(q => ({
        game_id: selectedGameId,
        round_id: null,
        question_text: q.Question,
        question_type: 'multiple_choice', // Question bank only has multiple choice
        category: q.Category,
        answer_a: q.A,
        answer_b: q.B,
        answer_c: q.C,
        answer_d: "", // Question bank doesn't have answer_d
        correct_answer: q["Correct Answer"],
        explanation: null, // Question bank doesn't have explanation
        question_image_url: null, // Question bank doesn't support images
        image_caption: null // Question bank doesn't support image captions
      }));
      
      const { error } = await supabase
        .from("questions")
        .insert(questionsToAdd);
      
      if (error) {
        toast.error("Failed to add questions to game");
        return;
      }
      
      toast.success(`Successfully added ${questionsToAdd.length} questions to the game`);
      setSelectedBankQuestions(new Set());
      loadQuestions(selectedGameId);
    } catch (error) {
      toast.error("Failed to add questions");
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        {/* Top hero section with background */}
        <div
          className="w-full min-h-screen flex items-center justify-center"
          style={{
            backgroundImage: "url('/blue-background.jpg')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full flex items-center justify-center max-w-[900px] w-full mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10">
            {/* Admin Login Card */}
            <Card className="bg-white animate-fade-in max-w-[415px] w-full mx-auto" style={{ animationDelay: "0.2s", padding: "24px" }}>
              <h2 className="text-3xl font-bold mb-2 text-uplight-black">
                Admin Login
              </h2>
              <p className="mb-6" style={{ 
                color: "#000000", 
                fontSize: "15px", 
                lineHeight: "140%", 
                fontWeight: 400 
              }}>
                Enter your credentials to access the admin dashboard
              </p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 sm:h-[59px] text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
                  style={{ 
                    backgroundColor: "#FCFCFF",
                    borderColor: "#CCD6FF",
                    color: "#000000",
                    borderWidth: "1px",
                    borderRadius: "0px",
                    fontSize: "18px",
                    fontWeight: 400
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0047FF";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#CCD6FF";
                  }}
                  required
                />
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 sm:h-[59px] text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
                  style={{ 
                    backgroundColor: "#FCFCFF",
                    borderColor: "#CCD6FF",
                    color: "#000000",
                    borderWidth: "1px",
                    borderRadius: "0px",
                    fontSize: "18px",
                    fontWeight: 400
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0047FF";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#CCD6FF";
                  }}
                  required
                />
                
                <div className="space-y-3">
                  <Button 
                    type="submit"
                    size="lg"
                    className="rounded-[99px] text-white text-lg font-medium transition-all hover:opacity-90 w-full"
                    style={{
                      backgroundColor: "#0047FF",
                      boxShadow: "0px 6px 24px 0px rgba(0,71,255,0.47)",
                      border: "1px solid rgba(0,0,0,0.2)",
                      height: "51px"
                    }}
                  >
                    Login
                  </Button>
                  
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => navigate("/")}
                      className="text-sm transition-colors hover:text-[#0047FF] hover:bg-transparent"
                      style={{ color: "#88889C" }}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Back to Home
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pattern-background">
      {/* Header Navbar (matches Game page) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-[105px] flex items-center px-4 sm:px-8 md:px-12 bg-white/5 backdrop-blur-md w-full">
        <img src="/megawatt-maniac-white-logo.svg" alt="Megawatt Maniacs" className="h-10 sm:h-[62px] w-auto max-w-[204px]" />
        <div className="flex-1 flex justify-center" style={{ marginLeft: "-102px" }}>
          <div className="flex items-center gap-3">
            <img src="/default-avatar-white.svg" alt="User Avatar" className="w-8 h-8" />
            <span className="text-white font-medium">{userName}</span>
          </div>
        </div>
        <img src="/back-bento@2x.png" alt="Menu" className="w-8 h-8 sm:w-[37px] sm:h-[35px]" />
      </div>

      {/* Spacer to ensure proper background coverage */}
      <div className="h-4 sm:h-[20px]"></div>

      <div className="mx-auto max-w-[900px] w-full px-4 sm:px-6 md:px-8 pt-24 sm:pt-[140px] pb-8 md:pb-10">
        <Card className="bg-white rounded-2xl shadow-lg text-black px-4 sm:px-6 md:px-10 py-6 md:py-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
            <Button variant="ghost" onClick={handleSignOut} className="text-sm transition-colors hover:text-[#0047FF] hover:bg-transparent" style={{ color: "#88889C" }}>
              Sign Out
            </Button>
          </div>

          <div className="space-y-8">
            {/* Game Management Section */}
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-black mb-6">Game Management</h1>
              
              {/* Games List */}
              <Card className="p-6 bg-white border border-border rounded-2xl text-black">
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
                          <p className="text-sm" style={{ color: "#4B5563" }}>{game.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedGameId(game.id)}
                            className="p-2 hover:bg-transparent text-[#0047FF]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGame(game.id)}
                            className="p-2 hover:bg-transparent text-[#EF4444]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Create Game */}
              <Card className="p-6 bg-white border border-border rounded-2xl text-black">
                <h2 className="text-2xl font-bold mb-4">Create New Game</h2>
                <form onSubmit={handleCreateGame} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="game-title">Title</Label>
                    <Input
                      id="game-title"
                      type="text"
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                      className="h-12 sm:h-[59px] text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-black placeholder:text-gray-400"
                      style={{ 
                        backgroundColor: "#FCFCFF",
                        borderColor: "#CCD6FF",
                        color: "#000000",
                        borderWidth: "1px",
                        borderRadius: "0px",
                        fontSize: "18px",
                        fontWeight: 400
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = "#0047FF";
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = "#CCD6FF";
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="game-description">Description</Label>
                    <Textarea
                      id="game-description"
                      value={gameDescription}
                      onChange={(e) => setGameDescription(e.target.value)}
                      className="text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-black placeholder:text-gray-400"
                      style={{ 
                        backgroundColor: "#FCFCFF",
                        borderColor: "#CCD6FF",
                        color: "#000000",
                        borderWidth: "1px",
                        borderRadius: "0px",
                        fontSize: "18px",
                        fontWeight: 400
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLTextAreaElement).style.borderColor = "#0047FF";
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLTextAreaElement).style.borderColor = "#CCD6FF";
                      }}
                    />
                  </div>
                  <Button 
                    type="submit"
                    size="lg"
                    className="rounded-[99px] text-white text-lg font-medium transition-all hover:opacity-90"
                    style={{
                      backgroundColor: "#0047FF",
                      boxShadow: "0px 6px 24px 0px rgba(0,71,255,0.47)",
                      border: "1px solid rgba(0,0,0,0.2)",
                      width: "197px",
                      height: "51px"
                    }}
                  >
                    Create Game
                  </Button>
                </form>
              </Card>

              {/* Active Game Selection */}
              <Card className="p-6 bg-white border border-border rounded-2xl text-black">
                <h2 className="text-2xl font-bold mb-4">Set Active Game</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Select which game players will automatically play when they start a new game.
                </p>
                {games.length === 0 ? (
                  <p className="text-muted-foreground">No games available</p>
                ) : (
                  <div className="space-y-3">
                    {games.map((game) => (
                      <div
                        key={game.id}
                        className={`flex items-center justify-between p-4 border rounded-[24px] transition-colors ${
                          activeGameId === game.id 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-border hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <h3 className="font-bold text-lg">{game.title}</h3>
                          <p className="text-sm text-gray-600">{game.description}</p>
                          {activeGameId === game.id && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Currently Active
                            </span>
                          )}
                        </div>
                        <Button
                          onClick={() => handleSetActiveGame(game.id)}
                          disabled={activeGameId === game.id}
                          className="rounded-[99px] text-white text-sm font-medium transition-all"
                          style={{
                            backgroundColor: activeGameId === game.id ? "#10B981" : "#0047FF",
                            opacity: activeGameId === game.id ? 0.7 : 1,
                            boxShadow: activeGameId === game.id ? "none" : "0px 6px 24px 0px rgba(0,71,255,0.47)",
                            border: "1px solid rgba(0,0,0,0.2)",
                            height: "40px",
                            width: "120px"
                          }}
                        >
                          {activeGameId === game.id ? 'Active' : 'Set Active'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Questions in Active Game */}
              {activeGameId && (
                <Card className="p-6 bg-white border border-border rounded-2xl text-black">
                  <h2 className="text-2xl font-bold mb-4">
                    Questions in {games.find(game => game.id === activeGameId)?.title || 'Active Game'}
                  </h2>
                  {questions.filter(question => question.game_id === activeGameId).length === 0 ? (
                    <p className="text-muted-foreground">No questions yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {questions.filter(question => question.game_id === activeGameId).map((question) => (
                        <div
                          key={question.id}
                          className="p-4 border border-white rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex gap-2 mb-2">
                                <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                                  {question.category || 'No category'}
                                </span>
                                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                                  {question.question_type}
                                </span>
                              </div>
                              <h3 className="font-medium text-sm mb-2">
                                {question.question_text}
                              </h3>
                              {question.question_type === 'multiple_choice' && (
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div>A: {question.answer_a}</div>
                                  <div>B: {question.answer_b}</div>
                                  <div>C: {question.answer_c}</div>
                                  {question.answer_d && <div>D: {question.answer_d}</div>}
                                </div>
                              )}
                              <p className="text-xs text-green-600 font-medium mt-2">
                                Correct: {question.correct_answer}
                              </p>
                              {question.explanation && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Explanation: {question.explanation}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditQuestion(question)}
                                className="p-2 hover:bg-transparent text-[#0047FF]"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="p-2 hover:bg-transparent text-[#EF4444]"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Question Management Section */}
            {selectedGameId && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-black mb-6">Question Management</h1>
                
                {/* Create/Edit Question */}
                <Card className="p-6 bg-white border border-border rounded-2xl text-black">
                  <h2 className="text-2xl font-bold mb-4">
                    {editingQuestionId ? "Edit Question" : "Add New Question"}
                  </h2>
                  <form onSubmit={handleCreateOrUpdateQuestion} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="question-type">Question Type</Label>
                        <select
                          id="question-type"
                          className="w-full p-2 bg-background border border-border rounded-md text-black h-12 sm:h-[59px] text-lg font-normal focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
                          style={{ 
                            backgroundColor: "#FCFCFF",
                            borderColor: "#CCD6FF",
                            color: "#000000",
                            borderWidth: "1px",
                            borderRadius: "0px",
                            fontSize: "18px",
                            fontWeight: 400
                          }}
                          onFocus={(e) => {
                            (e.target as HTMLSelectElement).style.borderColor = "#0047FF";
                          }}
                          onBlur={(e) => {
                            (e.target as HTMLSelectElement).style.borderColor = "#CCD6FF";
                          }}
                          value={questionType}
                          onChange={(e) => setQuestionType(e.target.value as "multiple_choice" | "text_input")}
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="text_input">Text Input</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="e.g., Energy History"
                          className="h-12 sm:h-[59px] text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-black placeholder:text-gray-400"
                          style={{ 
                            backgroundColor: "#FCFCFF",
                            borderColor: "#CCD6FF",
                            color: "#000000",
                            borderWidth: "1px",
                            borderRadius: "0px",
                            fontSize: "18px",
                            fontWeight: 400
                          }}
                          onFocus={(e) => {
                            (e.target as HTMLInputElement).style.borderColor = "#0047FF";
                          }}
                          onBlur={(e) => {
                            (e.target as HTMLInputElement).style.borderColor = "#CCD6FF";
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="question-text">Question</Label>
                      <Textarea
                        id="question-text"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        className="text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-black placeholder:text-gray-400"
                        style={{ 
                          backgroundColor: "#FCFCFF",
                          borderColor: "#CCD6FF",
                          color: "#000000",
                          borderWidth: "1px",
                          borderRadius: "0px",
                          fontSize: "18px",
                          fontWeight: 400
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLTextAreaElement).style.borderColor = "#0047FF";
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLTextAreaElement).style.borderColor = "#CCD6FF";
                        }}
                        required
                      />
                    </div>

                    {questionType === "multiple_choice" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="answer-a">Answer A</Label>
                          <Input
                            id="answer-a"
                            value={answerA}
                            onChange={(e) => setAnswerA(e.target.value)}
                            className="h-12 sm:h-[59px] text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-black placeholder:text-gray-400"
                            style={{ 
                              backgroundColor: "#FCFCFF",
                              borderColor: "#CCD6FF",
                              color: "#000000",
                              borderWidth: "1px",
                              borderRadius: "0px",
                              fontSize: "18px",
                              fontWeight: 400
                            }}
                            onFocus={(e) => {
                              (e.target as HTMLInputElement).style.borderColor = "#0047FF";
                            }}
                            onBlur={(e) => {
                              (e.target as HTMLInputElement).style.borderColor = "#CCD6FF";
                            }}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="answer-b">Answer B</Label>
                          <Input
                            id="answer-b"
                            value={answerB}
                            onChange={(e) => setAnswerB(e.target.value)}
                            className="h-12 sm:h-[59px] text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-black placeholder:text-gray-400"
                            style={{ 
                              backgroundColor: "#FCFCFF",
                              borderColor: "#CCD6FF",
                              color: "#000000",
                              borderWidth: "1px",
                              borderRadius: "0px",
                              fontSize: "18px",
                              fontWeight: 400
                            }}
                            onFocus={(e) => {
                              (e.target as HTMLInputElement).style.borderColor = "#0047FF";
                            }}
                            onBlur={(e) => {
                              (e.target as HTMLInputElement).style.borderColor = "#CCD6FF";
                            }}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="answer-c">Answer C</Label>
                          <Input
                            id="answer-c"
                            value={answerC}
                            onChange={(e) => setAnswerC(e.target.value)}
                            className="h-12 sm:h-[59px] text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-black placeholder:text-gray-400"
                            style={{ 
                              backgroundColor: "#FCFCFF",
                              borderColor: "#CCD6FF",
                              color: "#000000",
                              borderWidth: "1px",
                              borderRadius: "0px",
                              fontSize: "18px",
                              fontWeight: 400
                            }}
                            onFocus={(e) => {
                              (e.target as HTMLInputElement).style.borderColor = "#0047FF";
                            }}
                            onBlur={(e) => {
                              (e.target as HTMLInputElement).style.borderColor = "#CCD6FF";
                            }}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="answer-d">Answer D (optional)</Label>
                          <Input
                            id="answer-d"
                            value={answerD}
                            onChange={(e) => setAnswerD(e.target.value)}
                            placeholder="Leave blank if not needed"
                            className="h-12 sm:h-[59px] text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-black placeholder:text-gray-400"
                            style={{ 
                              backgroundColor: "#FCFCFF",
                              borderColor: "#CCD6FF",
                              color: "#000000",
                              borderWidth: "1px",
                              borderRadius: "0px",
                              fontSize: "18px",
                              fontWeight: 400
                            }}
                            onFocus={(e) => {
                              (e.target as HTMLInputElement).style.borderColor = "#0047FF";
                            }}
                            onBlur={(e) => {
                              (e.target as HTMLInputElement).style.borderColor = "#CCD6FF";
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {questionType === "multiple_choice" && (
                      <div className="space-y-2">
                        <Label htmlFor="correct-answer">Correct Answer</Label>
                        <select
                          id="correct-answer"
                          className="w-full p-2 bg-background border border-border rounded-md text-black h-12 sm:h-[59px] text-lg font-normal focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
                          style={{ 
                            backgroundColor: "#FCFCFF",
                            borderColor: "#CCD6FF",
                            color: "#000000",
                            borderWidth: "1px",
                            borderRadius: "0px",
                            fontSize: "18px",
                            fontWeight: 400
                          }}
                          onFocus={(e) => {
                            (e.target as HTMLSelectElement).style.borderColor = "#0047FF";
                          }}
                          onBlur={(e) => {
                            (e.target as HTMLSelectElement).style.borderColor = "#CCD6FF";
                          }}
                          value={correctAnswer}
                          onChange={(e) => setCorrectAnswer(e.target.value)}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          {answerD.trim() && <option value="D">D</option>}
                        </select>
                      </div>
                    )}

                    {questionType === "text_input" && (
                      <div className="space-y-2">
                        <Label htmlFor="correct-text-answer">Correct Answer</Label>
                        <Input
                          id="correct-text-answer"
                          value={correctAnswer}
                          onChange={(e) => setCorrectAnswer(e.target.value)}
                          placeholder="Enter the correct answer"
                          className="h-12 sm:h-[59px] text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-black placeholder:text-gray-400"
                          style={{ 
                            backgroundColor: "#FCFCFF",
                            borderColor: "#CCD6FF",
                            color: "#000000",
                            borderWidth: "1px",
                            borderRadius: "0px",
                            fontSize: "18px",
                            fontWeight: 400
                          }}
                          onFocus={(e) => {
                            (e.target as HTMLInputElement).style.borderColor = "#0047FF";
                          }}
                          onBlur={(e) => {
                            (e.target as HTMLInputElement).style.borderColor = "#CCD6FF";
                          }}
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="explanation">Explanation (optional)</Label>
                      <Textarea
                        id="explanation"
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="Explain why this is the correct answer"
                        className="text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-black placeholder:text-gray-400"
                        style={{ 
                          backgroundColor: "#FCFCFF",
                          borderColor: "#CCD6FF",
                          color: "#000000",
                          borderWidth: "1px",
                          borderRadius: "0px",
                          fontSize: "18px",
                          fontWeight: 400
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLTextAreaElement).style.borderColor = "#0047FF";
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLTextAreaElement).style.borderColor = "#CCD6FF";
                        }}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      {editingQuestionId ? (
                        <Button 
                          type="submit"
                          size="lg"
                          className="rounded-[99px] text-white text-lg font-medium transition-all hover:opacity-90"
                          style={{
                            backgroundColor: "#0047FF",
                            boxShadow: "0px 6px 24px 0px rgba(0,71,255,0.47)",
                            border: "1px solid rgba(0,0,0,0.2)",
                            width: "197px",
                            height: "51px"
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Update Question
                        </Button>
                      ) : (
                        <Button 
                          type="submit"
                          size="lg"
                          className="rounded-[99px] text-white text-lg font-medium transition-all hover:opacity-90"
                          style={{
                            backgroundColor: "#0047FF",
                            boxShadow: "0px 6px 24px 0px rgba(0,71,255,0.47)",
                            border: "1px solid rgba(0,0,0,0.2)",
                            width: "197px",
                            height: "51px"
                          }}
                        >
                          Add Question
                        </Button>
                      )}
                      {editingQuestionId && (
                        <Button type="button" variant="ghost" onClick={clearQuestionForm}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Card>

                {/* Questions List */}
                <Card className="p-6 bg-white border border-border rounded-2xl text-black">
                  <h2 className="text-2xl font-bold mb-4">Questions in Selected Game</h2>
                  {questions.length === 0 ? (
                    <p className="text-muted-foreground">No questions yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {questions.map((question) => (
                        <div
                          key={question.id}
                          className="p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex gap-2 mb-2">
                                <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                                  {question.category || 'No category'}
                                </span>
                                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                                  {question.question_type}
                                </span>
                              </div>
                              <h3 className="font-medium text-sm mb-2">
                                {question.question_text}
                              </h3>
                              {question.question_type === 'multiple_choice' && (
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div>A: {question.answer_a}</div>
                                  <div>B: {question.answer_b}</div>
                                  <div>C: {question.answer_c}</div>
                                  {question.answer_d && <div>D: {question.answer_d}</div>}
                                </div>
                              )}
                              <p className="text-xs text-green-600 font-medium mt-2">
                                Correct: {question.correct_answer}
                              </p>
                              {question.explanation && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Explanation: {question.explanation}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditQuestion(question)}
                                className="p-2 hover:bg-transparent text-[#0047FF]"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="p-2 hover:bg-transparent text-[#EF4444]"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Question Bank Section */}
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-black mb-6">Question Bank</h1>
              
              {/* Question Bank List */}
              <Card className="p-6 bg-white border border-border rounded-2xl text-black">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">All Questions in Bank</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllBankQuestions}
                      className="text-sm text-white border-black border-[1px] rounded-[99px] hover:bg-[#0047FF] hover:text-white hover:border-[#0047FF] transition-all"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAllBankQuestions}
                      className="text-sm text-white border-black border-[1px] rounded-[99px] hover:bg-[#0047FF] hover:text-white hover:border-[#0047FF] transition-all"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-4">
                  <Label htmlFor="category-filter">Filter by Category</Label>
                  <select
                    id="category-filter"
                    className="w-full mt-2 p-2 bg-white border border-black rounded-md text-black"
                    value={bankCategoryFilter}
                    onChange={(e) => setBankCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {getUniqueCategories().map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Questions List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getFilteredQuestionBank().map((question, index) => (
                    <div
                      key={question.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        selectedBankQuestions.has(question.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                          </div>
                          <div 
                            className="cursor-pointer"
                            onClick={() => toggleBankQuestionSelection(question.id)}
                          >
                            {selectedBankQuestions.has(question.id) ? (
                              <Check className="w-5 h-5 text-blue-600" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                            )}
                          </div>
                        </div>
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => toggleBankQuestionSelection(question.id)}
                        >
                          <div className="flex gap-2 mb-2">
                            <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                              {question.Category}
                            </span>
                          </div>
                          <h3 className="font-medium text-sm mb-2">
                            {question.Question}
                          </h3>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>A: {question.A}</div>
                            <div>B: {question.B}</div>
                            <div>C: {question.C}</div>
                          </div>
                          <p className="text-xs text-green-600 font-medium mt-2">
                            Correct: {question["Correct Answer"]}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditBankQuestion(question);
                            }}
                            className="p-2 hover:bg-transparent text-[#0047FF]"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Add Selected Questions to Game */}
              {selectedGameId && selectedBankQuestions.size > 0 && (
                <Card className="p-6 bg-white border border-border rounded-2xl text-black">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold">Add Selected Questions to Game</h3>
                      <p className="text-sm text-gray-600">
                        {selectedBankQuestions.size} question(s) selected
                      </p>
                    </div>
                    <Button
                      onClick={handleAddSelectedBankQuestions}
                      className="rounded-[99px] text-white text-lg font-medium transition-all hover:opacity-90"
                      style={{
                        backgroundColor: "#0047FF",
                        boxShadow: "0px 6px 24px 0px rgba(0,71,255,0.47)",
                        border: "1px solid rgba(0,0,0,0.2)",
                        height: "51px"
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Selected Questions
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>

        </Card>
      </div>

      {/* Footer (matches Game page) */}
      <div className="text-center" style={{ marginTop: "160px", paddingBottom: "32px" }}>
        <img src="/uplight-white-green-logo@2x.png" alt="Uplight" className="max-w-[222px] w-full h-auto mx-auto mb-2" />
        <p className="text-white text-sm">Copyright © 2026 Uplight, Inc. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Admin;