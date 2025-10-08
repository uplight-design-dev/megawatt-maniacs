import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignupModal } from "@/components/SignupModal";
import { Zap } from "lucide-react";

const Index = () => {
  const [showSignup, setShowSignup] = useState(false);
  const navigate = useNavigate();

  const handleSignupSuccess = (userId: string, userName: string) => {
    // Store user info in session storage for the game
    sessionStorage.setItem("userId", userId);
    sessionStorage.setItem("userName", userName);
    navigate("/game");
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-12">
        {/* Logo placeholder */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-16 h-16 text-primary" />
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gradient">
                Megawatt
              </h1>
              <h1 className="text-5xl md:text-6xl font-bold text-gradient">
                Maniacs
              </h1>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="text-center max-w-2xl mb-12 space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Join the Clean Energy <br />
            <span className="text-primary">Trivia Revolution</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
            Test your knowledge. Climb the leaderboard. Earn bragging rights.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Button 
            variant="uplight" 
            size="xl"
            onClick={() => setShowSignup(true)}
            className="min-w-[200px]"
          >
            Start Playing
          </Button>
          <Button 
            variant="uplight-outline" 
            size="xl"
            onClick={() => navigate("/results")}
            className="min-w-[200px]"
          >
            View Leaderboard
          </Button>
        </div>

        {/* Admin link */}
        <div className="mt-16 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/admin")}
            className="text-muted-foreground hover:text-foreground"
          >
            Admin Access
          </Button>
        </div>
      </div>

      <SignupModal 
        open={showSignup}
        onOpenChange={setShowSignup}
        onSuccess={handleSignupSuccess}
      />
    </div>
  );
};

export default Index;