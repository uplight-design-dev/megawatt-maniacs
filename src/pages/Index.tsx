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
      <div className="container mx-auto px-4 py-12">
        {/* Main Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left Side - Logo and Tagline */}
          <div className="text-center lg:text-left animate-fade-in">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
              <img src={megawattLogo} alt="Megawatt Maniacs" className="w-24 h-24" />
              <h1 className="text-5xl md:text-6xl font-bold text-white">
                MEGAWATT<br />MANIACS
              </h1>
            </div>
            <p className="text-2xl text-primary font-bold">
              Test your clean energy knowledge!
            </p>
          </div>

          {/* Right Side - Signup/Login Card */}
          <Card className="p-8 bg-white animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-2 text-uplight-black">
              {isLogin ? "Welcome Back!" : "Sign-Up to play as a"}<br />
              {!isLogin && "Megawatt Maniac!"}
            </h2>
            <p className="text-uplight-gray mb-6">
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
                  className="bg-uplight-light-gray border-0 text-uplight-black placeholder:text-uplight-gray"
                  disabled={loading}
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-uplight-light-gray border-0 text-uplight-black placeholder:text-uplight-gray"
                disabled={loading}
              />
              
              <div className="space-y-3">
                <Button 
                  type="submit"
                  variant="uplight"
                  size="lg"
                  disabled={loading}
                  className="w-full"
                >
                  {isLogin ? "Login" : "Start Playing!"}
                </Button>
                
                <div className="flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setName("");
                      setEmail("");
                    }}
                    className="text-uplight-gray hover:text-uplight-black text-sm"
                    disabled={loading}
                  >
                    {isLogin ? "Need an account? Sign up" : "Already have an account? Login"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleGuestPlay}
                    className="text-uplight-gray hover:text-uplight-black text-sm"
                    disabled={loading}
                  >
                    Play as guest
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