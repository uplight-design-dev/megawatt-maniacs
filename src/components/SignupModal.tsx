import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (userId: string, userName: string) => void;
}

export const SignupModal = ({ open, onOpenChange, onSuccess }: SignupModalProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, name")
        .eq("email", email)
        .maybeSingle();

      if (existingUser) {
        toast.success(`Welcome back, ${existingUser.name}!`);
        onSuccess(existingUser.id, existingUser.name);
        onOpenChange(false);
        return;
      }

      // Create new user
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({ name, email })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Welcome, ${newUser.name}!`);
      onSuccess(newUser.id, newUser.name);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast.error("Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Join the Challenge
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            variant="uplight" 
            size="lg" 
            className="w-full"
            disabled={loading}
          >
            {loading ? "Starting..." : "Start Playing"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};