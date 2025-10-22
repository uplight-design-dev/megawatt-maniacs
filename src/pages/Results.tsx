import React, { useEffect, useState } from "react";
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
        .select(`
          id, 
          score, 
          created_at, 
          users!inner(name)
        `)
        .order("score", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Sum up all scores per user to get cumulative total
      const userScores = new Map();
      data?.forEach(entry => {
        const userName = entry.users.name;
        const score = Number(entry.score) || 0; // Ensure score is a number
        
        if (!userScores.has(userName)) {
          userScores.set(userName, {
            ...entry,
            totalScore: score,
            earliestGame: entry.created_at
          });
        } else {
          const existing = userScores.get(userName);
          userScores.set(userName, {
            ...existing,
            totalScore: (existing.totalScore || 0) + score,
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
      <div className="mx-auto max-w-[900px] w-full px-4 sm:px-6 md:px-8">
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
          className="bg-white mb-8 px-4 sm:px-6 md:px-[70px] py-8 md:py-[50px] md:pb-[70px] rounded-3xl"
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
                  const gamesPlayed = 4; // placeholder to match mockup layout

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

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="w-full sm:min-w-[180px]"
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