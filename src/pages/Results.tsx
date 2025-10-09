import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Home, Play } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  score: number;
  created_at: string;
  users: {
    name: string;
  };
}

const Results = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const finalScore = sessionStorage.getItem("finalScore");
  const totalScore = sessionStorage.getItem("totalScore");
  const userName = sessionStorage.getItem("userName");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("id, score, created_at, users(name)")
        .order("score", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(10);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreMessage = (score: number) => {
    if (!score) return "Check out the leaderboard!";
    if (score >= 8) return "You're a 500 kW Brainiac! ⚡";
    if (score >= 5) return "Watts up! You're electrifying! 💡";
    if (score >= 3) return "Good energy! Keep charging up! 🔋";
    return "Keep learning, you'll power up! 🌱";
  };

  return (
    <div className="min-h-screen py-4 md:py-8">
      <div className="mx-auto" style={{ maxWidth: "900px" }}>
        {/* Results Header */}
        {finalScore && (
          <div className="text-center mb-12 animate-fade-in">
            <div className="mb-6">
              <Trophy className="w-20 h-20 mx-auto text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {userName}, you scored{" "}
              <span className="text-gradient">{finalScore}</span>!
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              {getScoreMessage(parseInt(finalScore))}
            </p>
            {totalScore && (
              <div className="mt-6 p-6 bg-primary/10 border-2 border-primary rounded-[99px] inline-block">
                <p className="text-lg text-foreground mb-1">Your Total Career Score</p>
                <p className="text-4xl font-bold text-primary">{totalScore} points</p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        <Card className="p-6 md:p-8 bg-card border-border mb-8">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            Top 10 Players
          </h2>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading leaderboard...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground">No scores yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`
                    flex items-center gap-4 p-4 rounded-[99px] border-2
                    ${index === 0 && "border-primary bg-primary/10"}
                    ${index === 1 && "border-secondary bg-secondary/10"}
                    ${index === 2 && "border-accent bg-accent/10"}
                    ${index > 2 && "border-border bg-background/50"}
                  `}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl
                    ${index === 0 && "bg-primary text-primary-foreground"}
                    ${index === 1 && "bg-secondary text-secondary-foreground"}
                    ${index === 2 && "bg-accent text-accent-foreground"}
                    ${index > 2 && "bg-muted text-muted-foreground"}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{entry.users.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {entry.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="uplight"
            size="lg"
            onClick={() => {
              sessionStorage.removeItem("finalScore");
              navigate("/");
            }}
            className="min-w-[180px]"
          >
            <Play className="w-5 h-5 mr-2" />
            Play Again
          </Button>
          <Button
            variant="uplight-outline"
            size="lg"
            onClick={() => navigate("/")}
            className="min-w-[180px]"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;