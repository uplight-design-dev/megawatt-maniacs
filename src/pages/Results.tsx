import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// removed icon imports; no icons used on results actions

interface LeaderboardEntry {
  id: string;
  score: number;
  created_at: string;
  users: {
    name: string;
  };
}

// Formats a rank number into its ordinal form (e.g., 1 -> 1st)
function formatOrdinal(n: number): string {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
}

const Results = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const finalScore = sessionStorage.getItem("finalScore");
  const totalScore = sessionStorage.getItem("totalScore");
  const userName = sessionStorage.getItem("userName");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    loadLeaderboard();
    loadUserRank();
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

  const loadUserRank = async () => {
    try {
      if (!finalScore) return;
      const userId = sessionStorage.getItem("userId");
      let userScore = parseInt(finalScore);
      let createdAt: string | null = null;

      if (userId && userId !== "guest") {
        const { data: latestRow } = await supabase
          .from("leaderboard")
          .select("id, score, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestRow) {
          userScore = latestRow.score;
          createdAt = latestRow.created_at;
        }
      }

      const { count: countHigher } = await supabase
        .from("leaderboard")
        .select("id", { count: "exact", head: true })
        .gt("score", userScore);

      let countEarlierSame = 0;
      if (createdAt) {
        const { count } = await supabase
          .from("leaderboard")
          .select("id", { count: "exact", head: true })
          .eq("score", userScore)
          .lt("created_at", createdAt);
        countEarlierSame = count || 0;
      }

      const rank = (countHigher || 0) + countEarlierSame + 1;
      setUserRank(rank);
    } catch (e) {
      // If ranking fails, keep null and fall back to score message
      console.error("Error computing user rank:", e);
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
    <div 
      className="min-h-screen py-4 md:py-8"
      style={{
        backgroundImage: "url('/blue-background.jpg')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "900px" }}>
        {/* Results Header */}
        {finalScore && (
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {userName}, {userRank ? (
                <>
                  you placed <span style={{ color: '#00E297' }}>{formatOrdinal(userRank)}</span>!
                </>
              ) : (
                <>
                  you scored <span className="text-gradient">{finalScore}</span>!
                </>
              )}
            </h1>
            {!userRank && (
              <p className="text-xl md:text-2xl text-muted-foreground">
                {getScoreMessage(parseInt(finalScore))}
              </p>
            )}
            {totalScore && userId !== "guest" && (
              <div className="mt-6 p-6 bg-primary/10 border-2 border-primary rounded-[99px] inline-block">
                <p className="text-lg text-foreground mb-1">Your Total Career Score</p>
                <p className="text-4xl font-bold text-primary">{totalScore} points</p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard - styled to match Index page */}
        <div 
          className="bg-white mb-8"
          style={{ 
            padding: "50px 70px 70px 70px",
            borderRadius: "24px"
          }}
        >
          <h2 className="mb-8 text-uplight-black font-normal" style={{ fontFamily: 'Mark OT', fontWeight: 400, fontSize: '42px' }}>
            Leaderboard
          </h2>

          {loading ? (
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
              <div
                className="items-center pb-6"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 140px',
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
                  const gamesPlayed = 4; // placeholder to match mockup layout

                  return (
                    <div
                      key={entry.id}
                      className="items-center py-4 border-b last:border-b-0"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 140px 140px',
                        borderColor: '#E6E9F3',
                      }}
                    >
                      {/* Name + Rank */}
                      <div className="flex items-center gap-4 min-w-0">
                        {badgeSrc ? (
                          <img src={badgeSrc} alt={`Rank ${index + 1}`} style={{ width: '45px', height: '45px' }} />
                        ) : (
                          <div style={{ width: '45px', height: '45px' }}></div>
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
                        {entry.score.toLocaleString()}
                      </div>

                      {/* Games Played */}
                      <div
                        className="text-center"
                        style={{ fontFamily: 'Mark OT', fontWeight: 500, fontSize: '18px', color: '#000000' }}
                      >
                        {gamesPlayed}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="min-w-[180px]"
            style={{
              backgroundColor: '#00E297',
              color: '#0047FF',
              border: 'none',
              borderRadius: '999px',
              padding: '16px 20px'
            }}
          >
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;