import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/lib/types";
import { AlertTriangle, CheckCircle, Clock, MessageSquare, Activity, Send, Bell, RefreshCw, 
  Zap, Shield, Server, Github, Cloud, Globe, Settings, Sparkles, Heart, User, Ban,
  Users, FileCode, Bot, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { checkIsAdmin } from "@/utils/admin";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";

interface DiscordBotStatusProps {
  services: Service[];
  token?: string;
  channelId?: string;
}

// Funktion definieren, bevor sie benutzt wird
const getSystemStatus = (services: Service[]) => {
  if (services.some(s => s.status === "major_outage")) {
    return "outage";
  } else if (services.some(s => ["degraded", "partial_outage"].includes(s.status))) {
    return "degraded";
  } else {
    return "operational";
  }
};

export function DiscordBotStatus({ services, token, channelId }: DiscordBotStatusProps) {
  const [botEnabled, setBotEnabled] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [botInfo, setBotInfo] = useState<{ username?: string; discriminator?: string; avatar?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [channelAccessible, setChannelAccessible] = useState(false);
  const [lastSystemCheck, setLastSystemCheck] = useState<Date | null>(null);
  const [updateInterval, setUpdateInterval] = useState<number | null>(null);
  const [embedUpdateInterval, setEmbedUpdateInterval] = useState<number | null>(null);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
    title: "",
    content: "",
    color: "#5865F2" // Discord Blurple als Standard
  });
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [uptime, setUptime] = useState<string | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [statusChannelId, setStatusChannelId] = useState<string | null>(null);

  const loadBotStatus = async () => {
    setIsChecking(true);
    try {
      const { data: configData, error: configError } = await supabase
        .from('discord_bot_config')
        .select('enabled')
        .maybeSingle();

      if (!configError && configData) {
        setBotEnabled(configData.enabled || false);
      }

      const { data: messageData, error: messageError } = await supabase
        .from('discord_status_messages')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!messageError && messageData) {
        setLastUpdated(messageData.created_at);
      }

      await checkBotOnline();
      
      // Simuliere Metriken für Demo-Zwecke
      setResponseTime(Math.floor(Math.random() * 100) + 30);
      setMemoryUsage(Math.floor(Math.random() * 60) + 30);
      setCpuUsage(Math.floor(Math.random() * 40) + 10);
      
      const currentDate = new Date();
      const uptimeHours = Math.floor(Math.random() * 48) + 12; // 12 bis 60 Stunden
      const uptimeDate = new Date(currentDate.getTime() - (uptimeHours * 60 * 60 * 1000));
      setUptime(`${uptimeHours} Stunden (seit ${uptimeDate.toLocaleDateString('de-DE')})`);
      
    } catch (error) {
      console.error("Fehler beim Laden des Bot-Status:", error);
    } finally {
      setIsChecking(false);
      setIsLoading(false);
    }
  };

  const checkBotOnline = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: JSON.stringify({ action: 'check-status' })
      });
      
      if (error) {
        console.error("Fehler beim Überprüfen des Bot-Status:", error);
        setIsOnline(false);
        setChannelAccessible(false);
      } else {
        console.log("Bot status check response:", data);
        setIsOnline(data.online || false);
        setChannelAccessible(data.channelAccessible || false);
        
        if (data.bot) {
          setBotInfo({
            username: data.bot.username || "Bot Search_AT",
            discriminator: data.bot.discriminator,
            avatar: data.bot.avatar ? `https://cdn.discordapp.com/avatars/${data.bot.id}/${data.bot.avatar}.png` : null
          });
        }
      }
    } catch (error) {
      console.error("Fehler bei der Überprüfung des Bot-Status:", error);
      setIsOnline(false);
      setChannelAccessible(false);
    }
  };

  const checkSystemStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: JSON.stringify({ action: 'check-system-status' })
      });
      
      if (error) {
        console.error("Fehler bei der Überprüfung des Systemstatus:", error);
      } else {
        console.log("System status check response:", data);
        setLastSystemCheck(new Date());
        
        if (data.statusChanged) {
          toast({
            title: "Systemstatus hat sich geändert",
            description: `Status ist jetzt: ${
              data.status === "operational" ? "Betriebsbereit" :
              data.status === "degraded" ? "Beeinträchtigt" : "Ausfall"
            }`,
            variant: data.status === "operational" ? "default" : "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Fehler bei der Systemstatus-Überprüfung:", error);
    }
  };

  const triggerAutoUpdate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: JSON.stringify({ action: 'auto-update-embed' })
      });
      
      if (error) {
        console.error("Fehler bei der automatischen Aktualisierung des Embeds:", error);
      } else {
        console.log("Auto-update response:", data);
        if (data.success) {
          setLastUpdated(new Date().toISOString());
        }
      }
    } catch (error) {
      console.error("Fehler bei der automatischen Aktualisierung des Embeds:", error);
    }
  };

  useEffect(() => {
    if (user) {
      const checkAdminStatus = async () => {
        const isAdminUser = await checkIsAdmin(user.id);
        setIsAdmin(isAdminUser);
      };
      
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      setToken(token);
    }
    if (channelId) {
      setStatusChannelId(channelId);
    }
  }, [token, channelId]);

  useEffect(() => {
    loadBotStatus();
    checkSystemStatus();

    const channel = supabase
      .channel('discord_bot_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'discord_bot_config' 
      }, () => {
        loadBotStatus();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'discord_status_messages' 
      }, () => {
        loadBotStatus();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services'
      }, () => {
        checkSystemStatus();
      })
      .subscribe();

    // Clear existing intervals if any
    if (updateInterval) clearInterval(updateInterval);
    if (embedUpdateInterval) clearInterval(embedUpdateInterval);

    // Setup new intervals
    const statusUpdateInterval = window.setInterval(() => {
      console.log("Automatische Aktualisierung des Bot-Status...");
      loadBotStatus();
      checkSystemStatus();
    }, 60000);

    const discordEmbedUpdateInterval = window.setInterval(() => {
      console.log("Automatische Aktualisierung des Discord Embeds...");
      triggerAutoUpdate();
    }, 60000);

    // Store interval IDs
    setUpdateInterval(statusUpdateInterval);
    setEmbedUpdateInterval(discordEmbedUpdateInterval);

    return () => {
      // Clean up
      supabase.removeChannel(channel);
      clearInterval(statusUpdateInterval);
      clearInterval(discordEmbedUpdateInterval);
    };
  }, []);

  const systemStatus = getSystemStatus(services);

  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return "Nie";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const sendStatusUpdate = async () => {
    if (!isAdmin) {
      toast({
        title: "Zugriff verweigert",
        description: "Nur Administratoren können Status-Updates senden.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: JSON.stringify({ action: 'update-status' })
      });
      
      console.log("Antwort von Discord Bot Funktion:", data, error);
      
      if (error) {
        console.error("Fehler beim Senden des Status-Updates:", error);
        toast({
          title: "Fehler beim Senden des Status-Updates",
          description: error.message,
          variant: "destructive"
        });
      } else if (data?.error) {
        console.error("API hat einen Fehler zurückgegeben:", data.error);
        toast({
          title: "Fehler beim Senden des Status-Updates",
          description: data.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Status-Update gesendet",
          description: "Der Status wurde erfolgreich an Discord gesendet.",
          variant: "success"
        });
        loadBotStatus();
      }
    } catch (error: any) {
      console.error("Fehler beim Senden des Status-Updates:", error);
      toast({
        title: "Fehler beim Senden des Status-Updates",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendCustomAnnouncement = async () => {
    if (!isAdmin) {
      toast({
        title: "Zugriff verweigert",
        description: "Nur Administratoren können Ankündigungen senden.",
        variant: "destructive"
      });
      return;
    }
    
    if (!announcementData.title || !announcementData.content) {
      toast({
        title: "Fehlende Informationen",
        description: "Bitte fülle alle erforderlichen Felder aus.",
        variant: "warning"
      });
      return;
    }
    
    setIsSending(true);
    try {
      const colorHex = announcementData.color.replace('#', '');
      const colorDecimal = parseInt(colorHex, 16);
      
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'send-announcement',
          title: announcementData.title,
          content: announcementData.content,
          color: colorDecimal
        })
      });
      
      if (error) {
        console.error("Fehler beim Senden der Ankündigung:", error);
        toast({
          title: "Fehler beim Senden der Ankündigung",
          description: error.message,
          variant: "destructive"
        });
      } else if (data?.error) {
        console.error("API hat einen Fehler zurückgegeben:", data.error);
        toast({
          title: "Fehler beim Senden der Ankündigung",
          description: data.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Ankündigung gesendet",
          description: "Die Ankündigung wurde erfolgreich an Discord gesendet.",
          variant: "success"
        });
        setShowAnnouncementDialog(false);
        setAnnouncementData({
          title: "",
          content: "",
          color: "#5865F2"
        });
      }
    } catch (error: any) {
      console.error("Fehler beim Senden der Ankündigung:", error);
      toast({
        title: "Fehler beim Senden der Ankündigung",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleManualRefresh = () => {
    loadBotStatus();
    checkSystemStatus();
    triggerAutoUpdate();
    toast({
      title: "Status aktualisiert",
      description: "Discord Bot Status wurde manuell aktualisiert",
      variant: "success"
    });
  };

  if (isLoading) {
    return (
      <Card className="discord-card border-discord-blurple animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <MessageSquare className="mr-2 h-4 w-4 text-discord-blurple" />
            Discord Bot Status
          </CardTitle>
          <CardDescription>Lade...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="discord-card border-discord-blurple">
      <CardHeader className="pb-2 bg-gradient-to-r from-transparent to-muted/20 rounded-t-lg">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center">
            <MessageSquare className="mr-2 h-4 w-4 text-discord-blurple" />
            Discord Bot Status
          </CardTitle>
          <Badge 
            variant={isOnline ? "default" : "destructive"} 
            className="h-6 animate-pulse"
          >
            {isOnline ? (
              <CheckCircle className="mr-1 h-3 w-3" />
            ) : (
              <AlertTriangle className="mr-1 h-3 w-3" />
            )}
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
        <CardDescription>
          Status-Updates in Discord
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {botInfo?.avatar && (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative">
                <img 
                  src={botInfo.avatar} 
                  alt="Bot Avatar" 
                  className="w-16 h-16 rounded-full border-2 border-discord-blurple p-1"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <p className="mt-2 font-medium text-sm">{botInfo.username}</p>
              <Badge variant="outline" className="mt-1 bg-red-500 text-white">
                DND
              </Badge>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Bot Status</span>
            <Badge 
              variant={botEnabled ? "default" : "secondary"} 
              className="h-6"
            >
              {botEnabled ? (
                <CheckCircle className="mr-1 h-3 w-3" />
              ) : (
                <Clock className="mr-1 h-3 w-3" />
              )}
              {botEnabled ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Kanal-Zugriff</span>
            <Badge 
              variant={channelAccessible ? "default" : "destructive"} 
              className="h-6"
            >
              {channelAccessible ? (
                <CheckCircle className="mr-1 h-3 w-3" />
              ) : (
                <AlertTriangle className="mr-1 h-3 w-3" />
              )}
              {channelAccessible ? "OK" : "Fehler"}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Letztes Update</span>
            <span className="text-sm">{formatLastUpdated(lastUpdated)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Letzte Prüfung</span>
            <span className="text-sm">
              {lastSystemCheck 
                ? new Intl.DateTimeFormat('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }).format(lastSystemCheck)
                : "Nie"}
            </span>
          </div>
          
          {botEnabled && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Systemstatus</span>
                <Badge 
                  variant={
                    systemStatus === "operational" ? "default" : 
                    systemStatus === "degraded" ? "outline" : "destructive"
                  }
                  className="h-6"
                >
                  {systemStatus === "operational" ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : systemStatus === "degraded" ? (
                    <AlertTriangle className="mr-1 h-3 w-3" />
                  ) : (
                    <AlertTriangle className="mr-1 h-3 w-3" />
                  )}
                  {systemStatus === "operational" ? "Betriebsbereit" : 
                   systemStatus === "degraded" ? "Beeinträchtigt" : "Ausfall"}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Antwortzeit</span>
                <div className="flex items-center">
                  <Activity className="mr-1 h-3 w-3 text-status-operational" />
                  <span className="text-sm">{responseTime}ms</span>
                </div>
              </div>
            </>
          )}
          
          {showAdvancedControls && (
            <>
              <Separator />
              
              <div className="space-y-3 bg-muted/30 p-3 rounded-md">
                <h4 className="text-sm font-medium">Bot-Metriken</h4>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span>Speichernutzung</span>
                    <span>{memoryUsage}%</span>
                  </div>
                  <Progress value={memoryUsage} className="h-1.5" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span>CPU-Auslastung</span>
                    <span>{cpuUsage}%</span>
                  </div>
                  <Progress value={cpuUsage} className="h-1.5" />
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span>Uptime</span>
                  <span>{uptime}</span>
                </div>
              </div>
            </>
          )}

          <div className="bg-muted/50 p-3 rounded-md text-xs">
            <div className="font-medium mb-1 flex items-center">
              <Bot className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Bot Information
            </div>
            <p>Name: {botInfo?.username || "Bot Search_AT"}</p>
            {botInfo?.discriminator && <p>Discriminator: #{botInfo.discriminator}</p>}
            <div className="mt-1 text-muted-foreground flex items-center">
              <RefreshCw className="mr-1 h-3 w-3" />
              Auto-Update alle 60 Sekunden
            </div>
          </div>

          <div className="border-t pt-3 mt-3 space-y-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 flex items-center justify-center hover:bg-primary/10 transition-colors" 
                onClick={sendStatusUpdate}
                disabled={isSending || !botEnabled || !isOnline || !isAdmin}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Senden..." : "Status senden"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center justify-center hover:bg-primary/10 transition-colors" 
                onClick={handleManualRefresh}
                disabled={isChecking}
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full flex items-center justify-center" 
                    onClick={() => setShowAnnouncementDialog(true)}
                    disabled={isSending || !botEnabled || !isOnline || !isAdmin}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Ankündigung senden
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sende eine benutzerdefinierte Ankündigung an Discord</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="pt-2 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors w-full"
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
            >
              {showAdvancedControls ? "Weniger anzeigen" : "Mehr anzeigen"}
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            {!isAdmin 
              ? "Nur Administratoren können Updates senden"
              : isOnline 
                ? "Discord-Bot ist online und bereit"
                : botEnabled 
                  ? "Discord-Bot ist offline oder nicht erreichbar"
                  : "Discord-Benachrichtigungen sind deaktiviert"}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-muted/20 to-transparent px-6 py-3 rounded-b-lg flex justify-between items-center">
        <Link 
          to="/settings#integrations" 
          className="text-xs text-muted-foreground hover:text-primary flex items-center transition-colors"
        >
          <Settings className="mr-1 h-3 w-3" />
          Einstellungen
        </Link>
        
        <Badge variant="outline" className="text-xs bg-discord-blurple/10">
          <MessageSquare className="mr-1 h-3 w-3" />
          Discord
        </Badge>
      </CardFooter>
      
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ankündigung senden</DialogTitle>
            <DialogDescription>
              Erstelle eine benutzerdefinierte Ankündigung, die an den Discord-Kanal gesendet wird.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Grundlegend</TabsTrigger>
              <TabsTrigger value="advanced">Erweitert</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="announcement-title" className="text-sm font-medium">
                    Titel
                  </label>
                  <Input 
                    id="announcement-title" 
                    value={announcementData.title} 
                    onChange={(e) => setAnnouncementData({...announcementData, title: e.target.value})}
                    placeholder="Ankündigungstitel" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="announcement-content" className="text-sm font-medium">
                    Inhalt
                  </label>
                  <Textarea 
                    id="announcement-content" 
                    value={announcementData.content}
                    onChange={(e) => setAnnouncementData({...announcementData, content: e.target.value})}
                    placeholder="Gib hier den Text deiner Ankündigung ein..."
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="announcement-color" className="text-sm font-medium">
                    Farbe (Hex)
                  </label>
                  <div className="flex gap-3">
                    <Input
                      id="announcement-color" 
                      type="color"
                      value={announcementData.color}
                      onChange={(e) => setAnnouncementData({...announcementData, color: e.target.value})}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      value={announcementData.color}
                      onChange={(e) => setAnnouncementData({...announcementData, color: e.target.value})}
                      placeholder="#5865F2" 
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vorschau</label>
                  <div className="border rounded-md p-3 bg-muted/30">
                    <div className="border-l-4" style={{ borderColor: announcementData.color }}>
                      <div className="pl-3">
                        <h4 className="font-bold">{announcementData.title || "Ankündigungstitel"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {announcementData.content || "Ankündigungstext wird hier angezeigt..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAnnouncementDialog(false)}
              disabled={isSending}
            >
              Abbrechen
            </Button>
            <Button 
              onClick={sendCustomAnnouncement} 
              disabled={isSending || !announcementData.title || !announcementData.content}
              className="bg-discord-blurple hover:bg-discord-blurple/80 text-white"
            >
              {isSending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Senden...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Senden
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
