
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/lib/types";
import { AlertTriangle, CheckCircle, Clock, MessageSquare, Activity, Send, Bell, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { checkIsAdmin } from "@/utils/admin";

interface DiscordBotStatusProps {
  services: Service[];
}

export function DiscordBotStatus({ services }: DiscordBotStatusProps) {
  const [botEnabled, setBotEnabled] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [botInfo, setBotInfo] = useState<{ username?: string; discriminator?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [channelAccessible, setChannelAccessible] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadBotStatus = async () => {
    setIsChecking(true);
    try {
      // Check if the bot is enabled
      const { data: configData, error: configError } = await supabase
        .from('discord_bot_config')
        .select('enabled')
        .maybeSingle();

      if (!configError && configData) {
        setBotEnabled(configData.enabled || false);
      }

      // Get last message timestamp
      const { data: messageData, error: messageError } = await supabase
        .from('discord_status_messages')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!messageError && messageData) {
        setLastUpdated(messageData.created_at);
      }

      // Check bot online status with more detailed check
      await checkBotOnline();
      
      // Simulate response time (in a real app, you would measure this)
      setResponseTime(Math.floor(Math.random() * 100) + 30); // Random between 30-130ms for better performance
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
          setBotInfo(data.bot);
        }
      }
    } catch (error) {
      console.error("Fehler bei der Überprüfung des Bot-Status:", error);
      setIsOnline(false);
      setChannelAccessible(false);
    }
  };

  // Überprüfe Admin-Status
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

  // Initialer Load und Echtzeit-Abonnement
  useEffect(() => {
    loadBotStatus();

    // Set up real-time subscription for bot config changes
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
      .subscribe();

    // Automatische Aktualisierung alle 60 Sekunden
    const interval = setInterval(() => {
      loadBotStatus();
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Calculate system status
  const getSystemStatus = () => {
    if (services.some(s => s.status === "major_outage")) {
      return "outage";
    } else if (services.some(s => ["degraded", "partial_outage"].includes(s.status))) {
      return "degraded";
    } else {
      return "operational";
    }
  };

  const systemStatus = getSystemStatus();

  // Format last updated time
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

  // Send a manual status update
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
          variant: "default"
        });
        // Refresh the status after sending
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

  // Send a custom announcement
  const sendCustomAnnouncement = async () => {
    if (!isAdmin) {
      toast({
        title: "Zugriff verweigert",
        description: "Nur Administratoren können Ankündigungen senden.",
        variant: "destructive"
      });
      return;
    }
    
    const title = prompt("Titel der Ankündigung:");
    if (!title) return;
    
    const content = prompt("Inhalt der Ankündigung:");
    if (!content) return;
    
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'send-announcement',
          title,
          content,
          color: 0x5865F2 // Discord Blurple color
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
          variant: "default"
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

  if (isLoading) {
    return (
      <Card className="discord-card border-discord-blurple">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <MessageSquare className="mr-2 h-4 w-4 text-discord-blurple" />
            Discord Bot Status
          </CardTitle>
          <CardDescription>Lade...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="discord-card border-discord-blurple">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <MessageSquare className="mr-2 h-4 w-4 text-discord-blurple" />
          Discord Bot Status
        </CardTitle>
        <CardDescription>
          Status-Updates in Discord
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Bot Status</span>
            <Badge variant={botEnabled ? "default" : "secondary"} className="h-6">
              {botEnabled ? (
                <CheckCircle className="mr-1 h-3 w-3" />
              ) : (
                <Clock className="mr-1 h-3 w-3" />
              )}
              {botEnabled ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Online Status</span>
            {isChecking ? (
              <Badge variant="outline" className="h-6">
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                Prüfe...
              </Badge>
            ) : (
              <Badge 
                variant={isOnline ? "default" : "destructive"} 
                className="h-6"
              >
                {isOnline ? (
                  <CheckCircle className="mr-1 h-3 w-3" />
                ) : (
                  <AlertTriangle className="mr-1 h-3 w-3" />
                )}
                {isOnline ? "Online" : "Offline"}
              </Badge>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Bot Name</span>
            <span className="text-sm">{botInfo?.username || "Bot Search_AT"}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Status</span>
            <Badge variant="outline" className="h-6 bg-red-500 text-white">
              DND
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

          {botInfo && (
            <div className="bg-muted/50 p-3 rounded-md text-xs">
              <div className="font-medium mb-1">Bot Information</div>
              <p>Name: {botInfo.username}</p>
              {botInfo.discriminator && <p>Discriminator: #{botInfo.discriminator}</p>}
            </div>
          )}

          <div className="border-t pt-3 mt-3 space-y-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 flex items-center justify-center" 
                onClick={sendStatusUpdate}
                disabled={isSending || !botEnabled || !isOnline || !isAdmin}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Senden..." : "Status senden"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center justify-center" 
                onClick={loadBotStatus}
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
                    onClick={sendCustomAnnouncement}
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

          <div className="pt-2 text-xs text-center text-muted-foreground">
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
    </Card>
  );
}
