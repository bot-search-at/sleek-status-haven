
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
              title: "Profile data not found",
              description: "Your profile information couldn't be loaded",
              variant: "warning"
            });
          }
        } catch (error) {
          console.error("Error loading profile data:", error);
          toast({
            title: "Error",
            description: "Could not load profile data",
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
        title: "Settings saved",
        description: "Your settings have been successfully updated.",
        variant: "success"
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving",
        description: error.message || "Your settings could not be saved.",
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
      title: "New API key generated",
      description: "Please save this key safely. It will only be shown once.",
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
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings and application preferences.
            </p>
          </div>
          
          {isAdmin && (
            <Badge variant="outline" className="mt-2 md:mt-0 bg-primary/10 text-primary border-primary/30 px-3 py-1">
              <Shield className="mr-1 h-3.5 w-3.5" />
              Admin Access
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
              Account
            </TabsTrigger>
            
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:border-primary data-[state=active]:border-b-2"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            
            <TabsTrigger 
              value="integrations" 
              className="data-[state=active]:border-primary data-[state=active]:border-b-2"
            >
              <Cloud className="mr-2 h-4 w-4" />
              Integrations
            </TabsTrigger>
            
            {isAdmin && (
              <TabsTrigger 
                value="admin" 
                className="data-[state=active]:border-primary data-[state=active]:border-b-2"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Admin Panel
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        value={profileData.username}
                        onChange={e => setProfileData({...profileData, username: e.target.value})}
                        placeholder="your_username" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={profileData.email} 
                        disabled
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input 
                      id="display-name" 
                      value={profileData.displayName}
                      onChange={e => setProfileData({...profileData, displayName: e.target.value})}
                      placeholder="Your Display Name" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Profile Picture URL</Label>
                    <Input 
                      id="avatar" 
                      value={profileData.avatar}
                      onChange={e => setProfileData({...profileData, avatar: e.target.value})}
                      placeholder="https://example.com/image.jpg" 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 flex justify-between border-t px-6 py-4">
                <Button variant="outline">Reset</Button>
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the application's appearance to suit your needs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable dark mode for an eye-friendly experience.
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
                <CardTitle>API Access</CardTitle>
                <CardDescription>
                  Manage your API access and keys.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="api-key" 
                      value={apiKey} 
                      placeholder="No API key generated" 
                      readOnly
                      className="font-mono"
                    />
                    <Button 
                      variant="secondary" 
                      onClick={generateNewApiKey}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    API keys grant full access to your account. They should be stored securely.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how you'd like to be notified about status changes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about important events via email.
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
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive real-time notifications about status changes in the browser.
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
                    <h3 className="text-sm font-medium">Notification Types</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3">
                        <Zap className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Incidents</h4>
                          <p className="text-sm text-muted-foreground">
                            When a new incident is detected.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Resolutions</h4>
                          <p className="text-sm text-muted-foreground">
                            When an incident is resolved.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Updates</h4>
                          <p className="text-sm text-muted-foreground">
                            When there is an update to an incident.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <ActivitySquare className="h-5 w-5 text-violet-500 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Maintenance</h4>
                          <p className="text-sm text-muted-foreground">
                            When maintenance is scheduled.
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
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
                        Admin Dashboard
                      </div>
                    </CardTitle>
                    <Badge variant="secondary">
                      Admin Zone
                    </Badge>
                  </div>
                  <CardDescription>
                    Administrator tools and system management.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Administrator Area</AlertTitle>
                    <AlertDescription>
                      Here you can manage system settings and perform administrative tasks.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" asChild className="h-auto py-4 px-4 flex flex-col items-center justify-center text-left space-y-2">
                      <Link to="/admin">
                        <div className="flex flex-col items-center text-center space-y-2 w-full">
                          <UserCog className="h-8 w-8 text-primary mb-2" />
                          <div>
                            <h3 className="font-medium">Admin Area</h3>
                            <p className="text-sm text-muted-foreground">
                              Access all administrative functions
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
                            <h3 className="font-medium">System Status</h3>
                            <p className="text-sm text-muted-foreground">
                              Complete system monitoring
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
                            <h3 className="font-medium">API Configuration</h3>
                            <p className="text-sm text-muted-foreground">
                              Manage API access and webhooks
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
                              Access code repository
                            </p>
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium">System Activity</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Latest activities in the system
                    </p>
                    
                    <div className="space-y-4">
                      <div className="bg-muted/30 p-3 rounded-md border border-border/30 flex items-start space-x-3">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">New user registered</p>
                          <p className="text-xs text-muted-foreground">Today, 14:32</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-md border border-border/30 flex items-start space-x-3">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Discord Bot Status updated</p>
                          <p className="text-xs text-muted-foreground">Yesterday, 18:05</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-md border border-border/30 flex items-start space-x-3">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          <ChevronsUpDown className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">System update completed</p>
                          <p className="text-xs text-muted-foreground">24.03.2025, 09:15</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="#">
                          View all activities
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-primary/5 px-6 py-4 rounded-b-lg flex justify-between">
                  <Button variant="outline">
                    Download log
                  </Button>
                  <Button>
                    <Shield className="mr-2 h-4 w-4" />
                    Open Admin Area
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
