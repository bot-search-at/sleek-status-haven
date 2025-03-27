
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Handle sign up
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message || "An error occurred during sign up.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign Up Successful",
            description: "Please check your email for verification (if required).",
          });
          setIsSignUp(false); // Switch back to login view
        }
      } else {
        // Handle sign in
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message || "Invalid credentials. Please try again.",
            variant: "destructive",
          });
        } else {
          navigate("/admin");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary mx-auto">
              <div className="h-4 w-4 rounded-full bg-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold">
            {isSignUp ? "Create an Account" : "Log in to Status Haven"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isSignUp 
              ? "Sign up to access the admin panel" 
              : "Enter your credentials to access the admin panel"}
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>{isSignUp ? "Sign Up" : "Admin Login"}</CardTitle>
              <CardDescription>
                {isSignUp 
                  ? "Create your account to access admin features" 
                  : "Access restricted admin features"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <Link 
                      to="#" 
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading 
                  ? (isSignUp ? "Creating Account..." : "Logging in...") 
                  : (isSignUp ? "Create Account" : "Log in")}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <button 
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-primary hover:underline"
                    >
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button 
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-primary hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="text-primary hover:underline">
            Return to Status Page
          </Link>
        </div>
      </div>
    </div>
  );
}
