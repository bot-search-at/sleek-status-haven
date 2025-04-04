
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Settings } from "lucide-react";

export function DiscordBotConfig() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // This component is now just a placeholder redirecting to the admin panel
  }, []);

  const goToAdminPanel = () => {
    navigate("/admin#integrations");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5 text-primary" />
          Discord Bot Konfiguration
        </CardTitle>
        <CardDescription>
          Die Discord Bot Konfiguration ist nur für Administratoren verfügbar.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="bg-muted/50 rounded-full p-6">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <div className="text-center max-w-sm space-y-2">
          <h3 className="text-lg font-medium">Administratorzugriff erforderlich</h3>
          <p className="text-muted-foreground text-sm">
            Die Discord Bot Einstellungen wurden in den Admin-Bereich verschoben, um die Sicherheit zu erhöhen.
          </p>
        </div>
        
        {isAdmin ? (
          <Button onClick={goToAdminPanel}>
            <Settings className="mr-2 h-4 w-4" />
            Zu den Bot-Einstellungen
          </Button>
        ) : (
          <Button disabled variant="outline">
            <Lock className="mr-2 h-4 w-4" />
            Nur für Administratoren
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
