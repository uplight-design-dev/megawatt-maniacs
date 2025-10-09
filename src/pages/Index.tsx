import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import megawattLogo from "@/assets/megawatt-logo.png";

const Index = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen pattern-background">
      <div className="w-full py-12" style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Main Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left Side - Hero Mascot Logo */}
          <div className="text-center lg:text-left animate-fade-in">
            <img src="/hero-mascot-logo@2x.png" alt="Megawatt Maniacs Hero" className="w-full max-w-md mx-auto lg:mx-0" />
          </div>

          {/* Right Side - Signup/Login Card */}
          <Card className="bg-white animate-fade-in max-w-[415px] w-full mx-auto lg:mx-0" style={{ animationDelay: "0.2s", padding: "40px" }}>
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
                  className="h-[59px] text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
                  style={{ 
                    backgroundColor: "#FCFCFF",
                    borderColor: "#CCD6FF",
                    color: "#000000",
                    borderWidth: "1px",
                    borderRadius: "0px",
                    fontSize: "18px",
                    fontWeight: 400,
                    "--focus-border-color": "#0047FF"
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
                className="h-[59px] text-lg font-normal border focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
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
                    className="rounded-[99px] text-white text-lg font-medium transition-all hover:opacity-90"
                    style={{
                      backgroundColor: "#0047FF",
                      boxShadow: "0px 6px 24px 0px rgba(0,71,255,0.47)",
                      border: "1px solid rgba(0,0,0,0.2)",
                      width: "197px",
                      height: "51px"
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

        {/* Admin link - positioned at bottom right */}
        <div className="fixed bottom-4 right-4">
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
    </div>
  );
};

export default Index;