
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiscordBotConfig } from "@/components/DiscordBotConfig";
import { useAuth } from "@/context/AuthContext";
import { Settings as SettingsIcon, UserCircle, Bell, Plug, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize the active tab from the URL if present
    const hash = window.location.hash.replace('#', '');
    if (hash && ['account', 'notifications', 'integrations', 'admin'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update the URL when the tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
    
    // Add sound effect for tab change
    const audio = new Audio('/info.mp3');
    audio.volume = 0.1;
    audio.play().catch(() => {});
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="max-w-5xl mx-auto">
          <Card className="border border-border/40 shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                Einstellungen
              </CardTitle>
              <CardDescription>
                Du musst angemeldet sein, um auf diese Seite zuzugreifen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="hover-lift-up"
              >
                Anmelden
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
          <p className="text-muted-foreground">
            Verwalte deine Einstellungen und Präferenzen.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-1">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="account" className="flex items-center">
                <UserCircle className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Konto</span>
                <span className="sm:hidden">Konto</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Benachrichtigungen</span>
                <span className="sm:hidden">Benach.</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center">
                <Plug className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Integrationen</span>
                <span className="sm:hidden">Integ.</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">Admin</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="account" className="animate-fade-in">
            <Card className="border border-border/40 shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCircle className="mr-2 h-5 w-5 text-primary" />
                  Kontoeinstellungen
                </CardTitle>
                <CardDescription>
                  Verwalte deine Kontoeinstellungen und Präferenzen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Benutzerprofil</h3>
                  <div className="bg-muted/50 rounded-lg p-4 flex flex-col sm:flex-row gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">Konto-ID: {user.id.substring(0, 8)}...</p>
                      <p className="text-sm text-muted-foreground">
                        Registriert am {new Date(user.created_at || Date.now()).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Funktion in Entwicklung",
                        description: "Diese Funktion ist noch nicht verfügbar.",
                        variant: "default"
                      });
                    }}
                  >
                    Profil bearbeiten
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="animate-fade-in">
            <Card className="border border-border/40 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-primary" />
                  Benachrichtigungseinstellungen
                </CardTitle>
                <CardDescription>
                  Konfiguriere, wie du über Statusänderungen benachrichtigt werden möchtest.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p>Benachrichtigungseinstellungen werden bald verfügbar sein.</p>
                </div>
                <div className="pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Funktion in Entwicklung",
                        description: "Diese Funktion ist noch nicht verfügbar.",
                        variant: "default"
                      });
                    }}
                  >
                    Benachrichtigungen konfigurieren
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-8 animate-fade-in">
            <DiscordBotConfig />
          </TabsContent>
          
          <TabsContent value="admin" className="animate-fade-in">
            <Card className="border border-border/40 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  Administrator-Einstellungen
                </CardTitle>
                <CardDescription>
                  Erweiterte Einstellungen für Administratoren.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p>Administrator-Einstellungen werden bald verfügbar sein.</p>
                </div>
                <div className="pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Funktion in Entwicklung",
                        description: "Diese Funktion ist noch nicht verfügbar.",
                        variant: "default"
                      });
                    }}
                  >
                    Administrator-Bereich
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
