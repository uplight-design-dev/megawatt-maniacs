import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import megawattLogo from "@/assets/megawatt-logo.png";

interface LeaderboardEntry {
  id: string;
  score: number;
  created_at: string;
  totalScore: number;
  gamesPlayed: number;
  earliestGame: string;
  users: {
    name: string;
  };
}

const Index = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select(`
          id, 
          score, 
          created_at, 
          users!inner(name)
        `)
        .order("score", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Sum up all scores per user to get cumulative total and count games played
      const userScores = new Map();
      data?.forEach(entry => {
        const userName = entry.users.name;
        const score = Number(entry.score) || 0; // Ensure score is a number
        
        if (!userScores.has(userName)) {
          userScores.set(userName, {
            ...entry,
            totalScore: score,
            gamesPlayed: 1, // First game
            earliestGame: entry.created_at
          });
        } else {
          const existing = userScores.get(userName);
          userScores.set(userName, {
            ...existing,
            totalScore: (existing.totalScore || 0) + score,
            gamesPlayed: (existing.gamesPlayed || 0) + 1, // Increment game count
            // Keep the earliest game date for tie-breaking
            earliestGame: entry.created_at < existing.earliestGame ? entry.created_at : existing.earliestGame
          });
        }
      });
      
      const deduplicatedData = Array.from(userScores.values())
        .sort((a, b) => {
          // Sort by total score first, then by earliest game date for tie-breaking
          const aScore = Number(a.totalScore) || 0;
          const bScore = Number(b.totalScore) || 0;
          if (bScore !== aScore) {
            return bScore - aScore;
          }
          return new Date(a.earliestGame).getTime() - new Date(b.earliestGame).getTime();
        })
        .slice(0, 10);
      
      setLeaderboard(deduplicatedData);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || (!isLogin && !name.trim())) {
      toast.error(isLogin ? "Please enter your email" : "Please enter your name and email");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Login flow - find existing user by email
        const { data: existingUser, error } = await supabase
          .from("users")
          .select("id, name")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (error) throw error;

        if (!existingUser) {
          toast.error("No account found with this email. Please sign up first.");
          setLoading(false);
          return;
        }

        sessionStorage.setItem("userId", existingUser.id);
        sessionStorage.setItem("userName", existingUser.name);
        toast.success(`Welcome back, ${existingUser.name}!`);
        navigate("/game");
      } else {
        // Signup flow - check if user already exists
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, name")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (existingUser) {
          toast.error("An account with this email already exists. Please login instead.");
          setLoading(false);
          return;
        }

        // Create new user
        const { data: newUser, error } = await supabase
          .from("users")
          .insert({ name: name.trim(), email: email.toLowerCase() })
          .select()
          .single();

        if (error) throw error;

        sessionStorage.setItem("userId", newUser.id);
        sessionStorage.setItem("userName", newUser.name);
        toast.success("Welcome to Megawatt Maniacs!");
        navigate("/game");
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(isLogin ? "Failed to login. Please try again." : "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPlay = () => {
    sessionStorage.setItem("userId", "guest");
    sessionStorage.setItem("userName", "Guest");
    navigate("/game");
  };

  return (
    <div className="min-h-screen">
      {/* Top hero section with background */}
      <div
        className="w-full min-h-[60vh] md:min-h-[570px]"
        style={{
          backgroundImage: "url('/upper-header-background-hero@2x.jpg')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <div className="w-full h-full max-w-[1000px] w-full mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10">
          {/* Main Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center h-full">
          {/* Left Side - Hero Mascot Logo */}
          <div className="text-center lg:text-left animate-fade-in">
            <img src="/hero-mascot-logo@2x.png" alt="Megawatt Maniacs Hero" className="w-full max-w-md mx-auto lg:mx-0" />
          </div>

          {/* Right Side - Signup/Login Card */}
          <Card className="bg-white animate-fade-in max-w-[650px] w-full mx-auto lg:mx-0" style={{ animationDelay: "0.2s", padding: "40px" }}>
            <h2 className="text-3xl font-bold mb-2 text-uplight-black">
              {isLogin ? "Welcome Back!" : "Sign-Up to play as a"}<br />
              {!isLogin && "Megawatt Maniac!"}
            </h2>
            <p className="mb-6" style={{ 
              color: "#000000", 
              fontSize: "15px", 
              lineHeight: "140%", 
              fontWeight: 400 
            }}>
              {isLogin 
                ? "Login to continue your trivia journey!"
                : "You'll be able to track your score over time and compete against your fellow colleagues!"
              }
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <Input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  disabled={loading}
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                disabled={loading}
              />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Button 
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="rounded-[99px] text-white text-lg font-medium transition-all hover:opacity-90 w-full sm:w-auto md:w-[197px] h-12 md:h-[51px]"
                    style={{
                      backgroundColor: "#0047FF",
                      boxShadow: "0px 6px 24px 0px rgba(0,71,255,0.47)",
                      border: "1px solid rgba(0,0,0,0.2)"
                    }}
                  >
                    {isLogin ? "Login" : "Start Playing!"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleGuestPlay}
                    className="text-sm transition-colors hover:text-[#0047FF] hover:bg-transparent"
                    style={{ color: "#88889C" }}
                    disabled={loading}
                  >
                    Play as guest
                  </Button>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setName("");
                      setEmail("");
                    }}
                    className="text-sm transition-colors hover:text-[#0047FF] hover:bg-transparent"
                    style={{ color: "#88889C" }}
                    disabled={loading}
                  >
                    {isLogin ? "Need an account? Sign up" : "Already have an account? Login"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
        </div>
      </div>

      {/* Lower section background */}
      <div
        className="w-full"
        style={{
          backgroundImage: "url('/lite-lower-background@2x.jpg')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top center",
          paddingTop: "60px",
          paddingBottom: "120px",
        }}
      >
        {/* Leaderboard Island */}
        <div 
          className="bg-white mx-auto animate-fade-in max-w-[900px] w-full px-4 sm:px-6 md:px-[70px] py-8 md:py-[50px] md:pb-[70px] rounded-3xl" 
          style={{ 
            animationDelay: "0.4s"
          }}
        >
          <h2 className="mb-8 text-uplight-black font-normal" style={{ fontFamily: 'Mark OT', fontWeight: 400, fontSize: '42px' }}>
            Top 10 Leaderboard
          </h2>
          
          {leaderboardLoading ? (
            <div className="text-center py-12">
              <p className="text-lg" style={{ color: "#88889C" }}>Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg" style={{ color: "#88889C" }}>No scores yet. Be the first to play!</p>
            </div>
          ) : (
            <div>
              {/* Column headers */}
              {/* Mobile: Stack layout */}
              <div className="block md:hidden pb-4">
                <div className="text-center text-sm text-gray-500 mb-2">Leaderboard</div>
              </div>
              
              {/* Desktop: Grid layout */}
              <div
                className="hidden md:grid items-center pb-6"
                style={{
                  gridTemplateColumns: '1fr minmax(100px,140px) minmax(100px,140px)',
                  color: '#88889C',
                  fontFamily: 'Mark OT',
                  fontWeight: 500,
                  fontSize: '15px',
                }}
              >
                <div></div>
                <div className="text-center">Points</div>
                <div className="text-center">Games Played</div>
              </div>

              {/* Rows */}
              <div>
                {leaderboard.map((entry, index) => {
                  const isTopThree = index < 3;
                  const badgeSrc = index === 0
                    ? "/first-place-avatar.svg"
                    : index === 1
                    ? "/second-place-avatar.svg"
                    : index === 2
                    ? "/third-place-avatar.svg"
                    : undefined;
                  const gamesPlayed = entry.gamesPlayed || 0;

                  return (
                    <React.Fragment key={entry.id}>
                      {/* Mobile: Stack layout */}
                      <div className="block md:hidden py-4 border-b last:border-b-0" style={{ borderColor: '#E6E9F3' }}>
                      <div className="flex items-center gap-3 mb-2">
                        {badgeSrc ? (
                          <img src={badgeSrc} alt={`Rank ${index + 1}`} className="w-8 h-8 sm:w-[45px] sm:h-[45px]" />
                        ) : (
                          <div className="w-8 h-8 sm:w-[45px] sm:h-[45px]"></div>
                        )}
                        <div
                          className="truncate flex-1"
                          style={{
                            fontFamily: 'Mark OT',
                            fontWeight: isTopThree ? 700 : 400,
                            fontSize: isTopThree ? '18px' : '16px',
                            color: '#000000',
                          }}
                        >
                          {`${index + 1}. ${entry.users.name}`}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ fontFamily: 'Mark OT', fontWeight: 500, color: '#000000' }}>
                          Points: {entry.totalScore.toLocaleString()}
                        </span>
                        <span style={{ fontFamily: 'Mark OT', fontWeight: 500, color: '#000000' }}>
                          Games: {gamesPlayed}
                        </span>
                      </div>
                    </div>

                      {/* Desktop: Grid layout */}
                      <div
                        className="hidden md:grid items-center py-4 border-b last:border-b-0"
                        style={{
                          gridTemplateColumns: '1fr minmax(100px,140px) minmax(100px,140px)',
                          borderColor: '#E6E9F3',
                        }}
                      >
                      {/* Name + Rank */}
                      <div className="flex items-center gap-4 min-w-0">
                        {badgeSrc ? (
                          <img src={badgeSrc} alt={`Rank ${index + 1}`} className="w-[45px] h-[45px]" />
                        ) : (
                          <div className="w-[45px] h-[45px]"></div>
                        )}
                        <div
                          className="truncate"
                          style={{
                            fontFamily: 'Mark OT',
                            fontWeight: isTopThree ? 700 : 400,
                            fontSize: isTopThree ? '21px' : '16px',
                            color: '#000000',
                          }}
                        >
                          {`${index + 1}. ${entry.users.name}`}
                        </div>
                      </div>

                      {/* Points */}
                      <div
                        className="text-center"
                        style={{ fontFamily: 'Mark OT', fontWeight: 500, fontSize: '18px', color: '#000000' }}
                      >
                        {entry.totalScore.toLocaleString()}
                      </div>

                      {/* Games Played */}
                      <div
                        className="text-center"
                        style={{ fontFamily: 'Mark OT', fontWeight: 500, fontSize: '18px', color: '#000000' }}
                      >
                        {gamesPlayed}
                      </div>
                    </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0)' }}>
        <div className="flex justify-center items-center relative">
          <img 
            src="/uplight-footer@2x.png" 
            alt="Uplight Footer" 
            className="max-w-[425px] w-full h-auto px-4 sm:px-0"
          />
          {/* Admin link - positioned at right side */}
          <div className="absolute" style={{ right: '25px' }}>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/admin")}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Admin Access
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;