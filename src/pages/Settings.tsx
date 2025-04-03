
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiscordBotConfig } from "@/components/DiscordBotConfig";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ActivitySquare, Bell, Check, CheckCircle, ChevronsUpDown, Cloud, CogIcon, ExternalLink, Github, Globe, Key, Mail, MessageSquare, RefreshCw, Save, Shield, User, UserCog, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { checkIsAdmin } from "@/utils/admin";
import { getProfile, updateProfile } from "@/lib/profiles";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    displayName: "",
    avatar: ""
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize the active tab from the URL if present
    const hash = window.location.hash.replace('#', '');
    if (hash && ['account', 'notifications', 'integrations', 'admin'].includes(hash)) {
      setActiveTab(hash);
    }
    
    const loadUserData = async () => {
      if (user) {
        // Check if user is an admin
        const adminStatus = await checkIsAdmin(user.id);
        setIsAdmin(adminStatus);
        
        // Fetch profile info using our custom profile API
        try {
          const profileData = await getProfile(user.id);
          
          if (profileData) {
            setProfileData({
              username: profileData.username || "",
              email: user.email || "",
              displayName: profileData.display_name || "",
              avatar: profileData.avatar_url || ""
            });
          } else {
            // If we couldn't get profile data, just use the email
            setProfileData({
              username: "",
              email: user.email || "",
              displayName: "",
              avatar: ""
            });
            
            toast({
              title: "Profildaten nicht gefunden",
              description: "Deine Profilinformationen konnten nicht geladen werden",
              variant: "warning"
            });
          }
        } catch (error) {
          console.error("Error loading profile data:", error);
          toast({
            title: "Fehler",
            description: "Profildaten konnten nicht geladen werden",
            variant: "destructive"
          });
        }
      }
    };
    
    loadUserData();
  }, [user]);

  // Update the URL when the tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // If user is logged in, update their profile
      if (user) {
        const result = await updateProfile(user.id, {
          username: profileData.username || null,
          display_name: profileData.displayName || null,
          avatar_url: profileData.avatar || null
        });
          
        if (!result.success) {
          throw new Error(result.error || "Unknown error");
        }
      }
      
      toast({
        title: "Einstellungen gespeichert",
        description: "Deine Einstellungen wurden erfolgreich aktualisiert.",
        variant: "success"
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Fehler beim Speichern",
        description: error.message || "Deine Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateNewApiKey = () => {
    const newKey = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
    
    toast({
      title: "Neuer API-Schlüssel generiert",
      description: "Bitte bewahre diesen Schlüssel sicher auf. Er wird nur einmal angezeigt.",
      variant: "info"
    });
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="max-w-5xl mx-auto">
          <Card className="border-border/40 shadow-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Einstellungen</CardTitle>
              <CardDescription className="text-center">
                Du musst angemeldet sein, um auf diese Seite zuzugreifen.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pt-4">
              <Button onClick={() => window.location.href = '/login'} className="w-full max-w-xs">
                <User className="mr-2 h-4 w-4" />
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
            <p className="text-muted-foreground mt-1">
              Verwalte deine Kontoeinstellungen und Anwendungspräferenzen.
            </p>
          </div>
          
          {isAdmin && (
            <Badge variant="outline" className="mt-2 md:mt-0 bg-primary/10 text-primary border-primary/30 px-3 py-1">
              <Shield className="mr-1 h-3.5 w-3.5" />
              Administrator-Zugang
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-2 bg-transparent">
            <TabsTrigger 
              value="account" 
              className="data-[state=active]:border-primary data-[state=active]:border-b-2"
            >
              <User className="mr-2 h-4 w-4" />
              Konto
            </TabsTrigger>
            
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:border-primary data-[state=active]:border-b-2"
            >
              <Bell className="mr-2 h-4 w-4" />
              Benachrichtigungen
            </TabsTrigger>
            
            <TabsTrigger 
              value="integrations" 
              className="data-[state=active]:border-primary data-[state=active]:border-b-2"
            >
              <Cloud className="mr-2 h-4 w-4" />
              Integrationen
            </TabsTrigger>
            
            {isAdmin && (
              <TabsTrigger 
                value="admin" 
                className="data-[state=active]:border-primary data-[state=active]:border-b-2"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Admin-Bereich
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Kontoeinstellungen</CardTitle>
                <CardDescription>
                  Verwalte deine Kontoeinstellungen und persönlichen Informationen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Benutzername</Label>
                      <Input 
                        id="username" 
                        value={profileData.username}
                        onChange={e => setProfileData({...profileData, username: e.target.value})}
                        placeholder="dein_benutzername" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail-Adresse</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={profileData.email} 
                        disabled
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">E-Mail-Adresse kann nicht geändert werden.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Anzeigename</Label>
                    <Input 
                      id="display-name" 
                      value={profileData.displayName}
                      onChange={e => setProfileData({...profileData, displayName: e.target.value})}
                      placeholder="Dein Anzeigename" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Profilbild-URL</Label>
                    <Input 
                      id="avatar" 
                      value={profileData.avatar}
                      onChange={e => setProfileData({...profileData, avatar: e.target.value})}
                      placeholder="https://beispiel.de/bild.jpg" 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 flex justify-between border-t px-6 py-4">
                <Button variant="outline">Zurücksetzen</Button>
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Speichern
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Erscheinungsbild</CardTitle>
                <CardDescription>
                  Passe das Erscheinungsbild der Anwendung nach deinen Wünschen an.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Dunkelmodus</Label>
                    <p className="text-sm text-muted-foreground">
                      Aktiviere den Dunkelmodus für ein augenfreundliches Erlebnis.
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>API-Zugriff</CardTitle>
                <CardDescription>
                  Verwalte deinen API-Zugang und Schlüssel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API-Schlüssel</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="api-key" 
                      value={apiKey} 
                      placeholder="Kein API-Schlüssel generiert" 
                      readOnly
                      className="font-mono"
                    />
                    <Button 
                      variant="secondary" 
                      onClick={generateNewApiKey}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Generieren
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    API-Schlüssel gewähren vollen Zugriff auf dein Konto. Sie sollten sicher aufbewahrt werden.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Benachrichtigungseinstellungen</CardTitle>
                <CardDescription>
                  Konfiguriere, wie du über Statusänderungen informiert werden möchtest.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">E-Mail-Benachrichtigungen</Label>
                      <p className="text-sm text-muted-foreground">
                        Erhalte Benachrichtigungen über wichtige Ereignisse per E-Mail.
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Push-Benachrichtigungen</Label>
                      <p className="text-sm text-muted-foreground">
                        Erhalte Echtzeit-Benachrichtigungen über Statusänderungen im Browser.
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Benachrichtigungstypen</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3">
                        <Zap className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Vorfälle</h4>
                          <p className="text-sm text-muted-foreground">
                            Wenn ein neuer Vorfall erkannt wird.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Lösungen</h4>
                          <p className="text-sm text-muted-foreground">
                            Wenn ein Vorfall behoben wird.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Aktualisierungen</h4>
                          <p className="text-sm text-muted-foreground">
                            Wenn es ein Update zu einem Vorfall gibt.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <ActivitySquare className="h-5 w-5 text-violet-500 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Wartung</h4>
                          <p className="text-sm text-muted-foreground">
                            Wenn eine Wartung geplant ist.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t px-6 py-4">
                <Button 
                  className="ml-auto" 
                  onClick={handleSaveSettings} 
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Speichern
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <DiscordBotConfig />
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="admin" className="space-y-4">
              <Card className="border-border/40 shadow-sm">
                <CardHeader className="bg-primary/5 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      <div className="flex items-center">
                        <Shield className="mr-2 h-5 w-5 text-primary" />
                        Admin-Dashboard
                      </div>
                    </CardTitle>
                    <Badge variant="secondary">
                      Admin-Bereich
                    </Badge>
                  </div>
                  <CardDescription>
                    Administratorwerkzeuge und Systemverwaltung.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Administrator-Bereich</AlertTitle>
                    <AlertDescription>
                      Hier kannst du Systemeinstellungen verwalten und administrative Aufgaben ausführen.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" asChild className="h-auto py-4 px-4 flex flex-col items-center justify-center text-left space-y-2">
                      <Link to="/admin">
                        <div className="flex flex-col items-center text-center space-y-2 w-full">
                          <UserCog className="h-8 w-8 text-primary mb-2" />
                          <div>
                            <h3 className="font-medium">Administrationsbereich</h3>
                            <p className="text-sm text-muted-foreground">
                              Zugang zu allen Verwaltungsfunktionen
                            </p>
                          </div>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="h-auto py-4 px-4 flex flex-col items-center justify-center text-left space-y-2">
                      <Link to="#">
                        <div className="flex flex-col items-center text-center space-y-2 w-full">
                          <Globe className="h-8 w-8 text-primary mb-2" />
                          <div>
                            <h3 className="font-medium">Systemstatus</h3>
                            <p className="text-sm text-muted-foreground">
                              Vollständige Systemüberwachung
                            </p>
                          </div>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="h-auto py-4 px-4 flex flex-col items-center justify-center text-left space-y-2">
                      <Link to="#">
                        <div className="flex flex-col items-center text-center space-y-2 w-full">
                          <CogIcon className="h-8 w-8 text-primary mb-2" />
                          <div>
                            <h3 className="font-medium">API-Konfiguration</h3>
                            <p className="text-sm text-muted-foreground">
                              API-Zugang und Webhooks verwalten
                            </p>
                          </div>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="h-auto py-4 px-4 flex flex-col items-center justify-center text-left space-y-2">
                      <Link to="#">
                        <div className="flex flex-col items-center text-center space-y-2 w-full">
                          <Github className="h-8 w-8 text-primary mb-2" />
                          <div>
                            <h3 className="font-medium">Repository</h3>
                            <p className="text-sm text-muted-foreground">
                              Zugriff auf Code-Repository
                            </p>
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium">Systemaktivität</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Neueste Aktivitäten im System
                    </p>
                    
                    <div className="space-y-4">
                      <div className="bg-muted/30 p-3 rounded-md border border-border/30 flex items-start space-x-3">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Neuer Benutzer registriert</p>
                          <p className="text-xs text-muted-foreground">Heute, 14:32</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-md border border-border/30 flex items-start space-x-3">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Discord Bot Status aktualisiert</p>
                          <p className="text-xs text-muted-foreground">Gestern, 18:05</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-md border border-border/30 flex items-start space-x-3">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          <ChevronsUpDown className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Systemupdate abgeschlossen</p>
                          <p className="text-xs text-muted-foreground">24.03.2025, 09:15</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="#">
                          Alle Aktivitäten anzeigen
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-primary/5 px-6 py-4 rounded-b-lg flex justify-between">
                  <Button variant="outline">
                    Log herunterladen
                  </Button>
                  <Button>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin-Bereich öffnen
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PageLayout>
  );
}
