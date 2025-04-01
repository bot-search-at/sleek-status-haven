
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
          toast.error(error.message || "Bei der Registrierung ist ein Fehler aufgetreten.");
        } else {
          toast.success("Registrierung erfolgreich. Bitte überprüfen Sie Ihre E-Mail für die Verifizierung (falls erforderlich).");
          setIsSignUp(false); // Switch back to login view
        }
      } else {
        // Handle sign in
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || "Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.");
        } else {
          navigate("/admin");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
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
            {isSignUp ? "Konto erstellen" : "Anmelden bei Status Haven"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isSignUp 
              ? "Registrieren Sie sich, um auf das Admin-Panel zuzugreifen" 
              : "Geben Sie Ihre Anmeldedaten ein, um auf das Admin-Panel zuzugreifen"}
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>{isSignUp ? "Registrieren" : "Admin-Anmeldung"}</CardTitle>
              <CardDescription>
                {isSignUp 
                  ? "Erstellen Sie Ihr Konto, um auf Admin-Funktionen zuzugreifen" 
                  : "Zugriff auf eingeschränkte Admin-Funktionen"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@beispiel.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Passwort</Label>
                  {!isSignUp && (
                    <Link 
                      to="#" 
                      className="text-xs text-primary hover:underline"
                    >
                      Passwort vergessen?
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
                  ? (isSignUp ? "Konto wird erstellt..." : "Anmeldung läuft...") 
                  : (isSignUp ? "Konto erstellen" : "Anmelden")}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                {isSignUp ? (
                  <>
                    Haben Sie bereits ein Konto?{" "}
                    <button 
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-primary hover:underline"
                    >
                      Anmelden
                    </button>
                  </>
                ) : (
                  <>
                    Haben Sie noch kein Konto?{" "}
                    <button 
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-primary hover:underline"
                    >
                      Registrieren
                    </button>
                  </>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="text-primary hover:underline">
            Zurück zur Statusseite
          </Link>
        </div>
      </div>
    </div>
  );
}
