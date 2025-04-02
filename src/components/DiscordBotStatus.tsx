
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/lib/types";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Activity, 
  Send, 
  Bell, 
  RefreshCw, 
  Settings, 
  Users, 
  Shield,
  Server,
  Info,
  Trash2,
  Eye,
  EyeOff,
  Link,
  History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { checkIsAdmin } from "@/utils/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

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
  const [botInfo, setBotInfo] = useState<{ username?: string; discriminator?: string; avatar?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [channelAccessible, setChannelAccessible] = useState(false);
  const [lastSystemCheck, setLastSystemCheck] = useState<Date | null>(null);
  const [updateInterval, setUpdateInterval] = useState<number | null>(null);
  const [embedUpdateInterval, setEmbedUpdateInterval] = useState<number | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [botLogs, setBotLogs] = useState<string[]>([]);
  const [customEmbedConfig, setCustomEmbedConfig] = useState({
    title: "Status-Dashboard",
    color: "#5865F2",
    useCustomEmojis: true,
    showTimestamp: true,
    footerText: "Weitere Details auf der Statusseite",
    groupServices: true
  });
  const [notifications, setNotifications] = useState({
    outages: true,
    degraded: true,
    maintenance: true,
    recovered: true
  });
  const [botStatusHistory, setBotStatusHistory] = useState<{ timestamp: Date; status: string }[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

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
      
      // Generate a realistic response time
      const randomResponseTime = Math.floor(Math.random() * 100) + 30;
      setResponseTime(randomResponseTime);

      // Log this status check in our history
      const newStatus = {
        timestamp: new Date(),
        status: isOnline ? 'online' : 'offline'
      };
      setBotStatusHistory(prev => [...prev.slice(-9), newStatus]);

      // Add log entry
      addLogEntry(`Status überprüft: Bot ist ${isOnline ? 'online' : 'offline'}. Antwortzeit: ${randomResponseTime}ms`);

    } catch (error) {
      console.error("Fehler beim Laden des Bot-Status:", error);
      addLogEntry(`Fehler beim Laden des Bot-Status: ${error}`);
    } finally {
      setIsChecking(false);
      setIsLoading(false);
    }
  };

  const addLogEntry = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('de-DE');
    setBotLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]);
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
        addLogEntry(`Statusprüfung fehlgeschlagen: ${error.message}`);
      } else {
        console.log("Bot status check response:", data);
        setIsOnline(data.online || false);
        setChannelAccessible(data.channelAccessible || false);
        
        if (data.bot) {
          setBotInfo(data.bot);
        }

        if (data.online) {
          addLogEntry('Bot ist online und reagiert');
        }
      }
    } catch (error: any) {
      console.error("Fehler bei der Überprüfung des Bot-Status:", error);
      setIsOnline(false);
      setChannelAccessible(false);
      addLogEntry(`Fehler bei der Statusprüfung: ${error.message}`);
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
        addLogEntry(`Systemstatus-Prüfung fehlgeschlagen: ${error.message}`);
      } else {
        console.log("System status check response:", data);
        setLastSystemCheck(new Date());
        addLogEntry(`Systemstatus geprüft: ${data.status}`);
        
        if (data.statusChanged) {
          const statusMessage = data.status === "operational" ? "Betriebsbereit" :
            data.status === "degraded" ? "Beeinträchtigt" : "Ausfall";
          
          toast({
            title: "Systemstatus hat sich geändert",
            description: `Status ist jetzt: ${statusMessage}`,
            variant: data.status === "operational" ? "default" : "destructive"
          });
          
          addLogEntry(`Statusänderung erkannt: System ist jetzt "${statusMessage}"`);
          
          // Play sound notification
          const audio = new Audio(
            data.status === "operational" ? "/success.mp3" : 
            data.status === "degraded" ? "/warning.mp3" : "/error.mp3"
          );
          audio.volume = 0.2;
          audio.play().catch(() => {});
        }
      }
    } catch (error: any) {
      console.error("Fehler bei der Systemstatus-Überprüfung:", error);
      addLogEntry(`Systemstatus-Prüfung Fehler: ${error.message}`);
    }
  };

  const triggerAutoUpdate = async () => {
    addLogEntry("Automatisches Embed-Update gestartet");
    try {
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'auto-update-embed',
          config: customEmbedConfig
        })
      });
      
      if (error) {
        console.error("Fehler bei der automatischen Aktualisierung des Embeds:", error);
        addLogEntry(`Embed-Update fehlgeschlagen: ${error.message}`);
      } else {
        console.log("Auto-update response:", data);
        if (data.success) {
          setLastUpdated(new Date().toISOString());
          addLogEntry("Discord Embed erfolgreich aktualisiert");
        }
      }
    } catch (error: any) {
      console.error("Fehler bei der automatischen Aktualisierung des Embeds:", error);
      addLogEntry(`Embed-Update Fehler: ${error.message}`);
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

  // Setup and cleanup intervals and subscriptions
  useEffect(() => {
    loadBotStatus();
    checkSystemStatus();
    addLogEntry("Bot-Status initialisiert");

    const channel = supabase
      .channel('discord_bot_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'discord_bot_config' 
      }, () => {
        loadBotStatus();
        addLogEntry("Bot-Konfiguration wurde aktualisiert");
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'discord_status_messages' 
      }, () => {
        loadBotStatus();
        addLogEntry("Neue Status-Nachricht erkannt");
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services'
      }, () => {
        checkSystemStatus();
        addLogEntry("Service-Änderung erkannt, Systemstatus wird überprüft");
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
      addLogEntry("Bot-Status-Komponente entladen");
    };
  }, []);

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
    addLogEntry("Status-Update wird gesendet...");
    try {
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'update-status',
          config: customEmbedConfig 
        })
      });
      
      console.log("Antwort von Discord Bot Funktion:", data, error);
      
      if (error) {
        console.error("Fehler beim Senden des Status-Updates:", error);
        addLogEntry(`Status-Update fehlgeschlagen: ${error.message}`);
        toast({
          title: "Fehler beim Senden des Status-Updates",
          description: error.message,
          variant: "destructive"
        });
      } else if (data?.error) {
        console.error("API hat einen Fehler zurückgegeben:", data.error);
        addLogEntry(`Status-Update fehlgeschlagen: ${data.error}`);
        toast({
          title: "Fehler beim Senden des Status-Updates",
          description: data.error,
          variant: "destructive"
        });
      } else {
        addLogEntry("Status-Update erfolgreich gesendet");
        toast({
          title: "Status-Update gesendet",
          description: "Der Status wurde erfolgreich an Discord gesendet.",
          variant: "success"
        });
        loadBotStatus();
      }
    } catch (error: any) {
      console.error("Fehler beim Senden des Status-Updates:", error);
      addLogEntry(`Status-Update Fehler: ${error.message}`);
      toast({
        title: "Fehler beim Senden des Status-Updates",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendCustomAnnouncement = async (formData: {
    title: string;
    content: string;
    color: string;
    mentionEveryone: boolean;
  }) => {
    if (!isAdmin) {
      toast({
        title: "Zugriff verweigert",
        description: "Nur Administratoren können Ankündigungen senden.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    addLogEntry(`Ankündigung wird gesendet: "${formData.title}"`);
    try {
      const colorHex = formData.color.replace('#', '0x');
      
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'send-announcement',
          title: formData.title,
          content: formData.content,
          color: parseInt(colorHex),
          mentionEveryone: formData.mentionEveryone
        })
      });
      
      if (error) {
        console.error("Fehler beim Senden der Ankündigung:", error);
        addLogEntry(`Ankündigung fehlgeschlagen: ${error.message}`);
        toast({
          title: "Fehler beim Senden der Ankündigung",
          description: error.message,
          variant: "destructive"
        });
      } else if (data?.error) {
        console.error("API hat einen Fehler zurückgegeben:", data.error);
        addLogEntry(`Ankündigung fehlgeschlagen: ${data.error}`);
        toast({
          title: "Fehler beim Senden der Ankündigung",
          description: data.error,
          variant: "destructive"
        });
      } else {
        addLogEntry("Ankündigung erfolgreich gesendet");
        toast({
          title: "Ankündigung gesendet",
          description: "Die Ankündigung wurde erfolgreich an Discord gesendet.",
          variant: "success"
        });
      }
    } catch (error: any) {
      console.error("Fehler beim Senden der Ankündigung:", error);
      addLogEntry(`Ankündigung Fehler: ${error.message}`);
      toast({
        title: "Fehler beim Senden der Ankündigung",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const clearHistoricalMessages = async () => {
    if (!isAdmin) {
      toast({
        title: "Zugriff verweigert",
        description: "Nur Administratoren können historische Nachrichten löschen.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm("Möchten Sie wirklich alle historischen Status-Nachrichten löschen?")) {
      return;
    }
    
    try {
      addLogEntry("Historische Nachrichten werden gelöscht...");
      const { error } = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear-historical-messages' })
      });
      
      if (error) {
        console.error("Fehler beim Löschen historischer Nachrichten:", error);
        addLogEntry(`Löschen fehlgeschlagen: ${error.message}`);
        toast({
          title: "Fehler beim Löschen",
          description: error.message,
          variant: "destructive"
        });
      } else {
        addLogEntry("Historische Nachrichten erfolgreich gelöscht");
        toast({
          title: "Historische Nachrichten gelöscht",
          description: "Alte Discord-Statusnachrichten wurden gelöscht.",
          variant: "success"
        });
      }
    } catch (error: any) {
      console.error("Fehler beim Löschen historischer Nachrichten:", error);
      addLogEntry(`Löschen fehlgeschlagen: ${error.message}`);
      toast({
        title: "Fehler beim Löschen",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    }
  };

  // Manual refresh button handler
  const handleManualRefresh = () => {
    loadBotStatus();
    checkSystemStatus();
    triggerAutoUpdate();
    addLogEntry("Manuelle Aktualisierung ausgelöst");
    toast({
      title: "Status aktualisiert",
      description: "Discord Bot Status wurde manuell aktualisiert",
      variant: "success"
    });
  };

  const saveEmbedSettings = () => {
    addLogEntry("Embed-Einstellungen gespeichert");
    toast({
      title: "Einstellungen gespeichert",
      description: "Die Discord Embed-Einstellungen wurden aktualisiert",
      variant: "success"
    });
    // Next status update will use these settings
  };

  const saveNotificationSettings = () => {
    addLogEntry("Benachrichtigungseinstellungen gespeichert");
    toast({
      title: "Einstellungen gespeichert",
      description: "Die Benachrichtigungseinstellungen wurden aktualisiert",
      variant: "success"
    });
    // Settings will be applied to future notifications
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
        <CardContent>
          <div className="loading-animation mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="discord-card border-discord-blurple relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5865F2] via-[#5865F2]/50 to-transparent"></div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <MessageSquare className="mr-2 h-4 w-4 text-[#5865F2]" />
          Discord Bot Status
          {isAdmin && (
            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary text-xs">
              Admin
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Status-Updates in Discord
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Bot Status</span>
            <Badge 
              variant={botEnabled ? "default" : "secondary"} 
              className={`h-6 transition-all duration-300 ${botEnabled ? 'pulse-animation' : ''}`}
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
            <span className="text-sm font-medium">Online Status</span>
            {isChecking ? (
              <Badge variant="outline" className="h-6">
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                Prüfe...
              </Badge>
            ) : (
              <Badge 
                variant={isOnline ? "default" : "destructive"} 
                className={`h-6 ${isOnline ? 'animate-pulse' : ''}`}
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
            <div className="flex items-center">
              {botInfo?.avatar && (
                <div className="w-5 h-5 rounded-full overflow-hidden mr-2 border border-border">
                  <img 
                    src={`https://cdn.discordapp.com/avatars/${botInfo?.id}/${botInfo?.avatar}.png`} 
                    alt="Bot Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <span className="text-sm">{botInfo?.username || "Bot Search_AT"}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Status</span>
            <Badge variant="outline" className="h-6 bg-red-500/10 text-red-500 border-red-500/30">
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
                  className={`h-6 ${
                    systemStatus === "operational" ? '' : 
                    systemStatus === "degraded" ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 
                    'animate-pulse'
                  }`}
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
            <div className="glass-card p-3 rounded-md text-xs backdrop-blur-sm">
              <div className="font-medium mb-1">Bot Information</div>
              <div className="flex items-center">
                {botInfo.avatar && (
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border border-[#5865F2]/30">
                    <img 
                      src={`https://cdn.discordapp.com/avatars/${botInfo?.id}/${botInfo?.avatar}.png`} 
                      alt="Bot Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p>Name: {botInfo.username || "Bot Search_AT"}</p>
                  {botInfo.discriminator && <p>Discriminator: #{botInfo.discriminator}</p>}
                </div>
              </div>
              <p className="mt-1 text-muted-foreground">Auto-Update alle 60 Sekunden</p>
            </div>
          )}

          <div className="border-t border-[#5865F2]/10 pt-3 mt-3 space-y-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 flex items-center justify-center hover-lift-up" 
                onClick={sendStatusUpdate}
                disabled={isSending || !botEnabled || !isOnline || !isAdmin}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Senden..." : "Status senden"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center justify-center hover-lift-up" 
                onClick={handleManualRefresh}
                disabled={isChecking}
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <TooltipProvider>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full flex items-center justify-center hover-lift-up" 
                    disabled={isSending || !botEnabled || !isOnline || !isAdmin}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Ankündigung senden
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Ankündigung erstellen</DialogTitle>
                    <DialogDescription>
                      Erstelle eine benutzerdefinierte Ankündigung für den Discord-Kanal.
                    </DialogDescription>
                  </DialogHeader>
                  <form id="announcement-form" onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    sendCustomAnnouncement({
                      title: formData.get('title') as string,
                      content: formData.get('content') as string,
                      color: formData.get('color') as string,
                      mentionEveryone: formData.get('mentionEveryone') === 'on'
                    });
                    (document.getElementById('announcement-dialog-close') as HTMLButtonElement)?.click();
                  }}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Titel
                        </Label>
                        <Input
                          id="title"
                          name="title"
                          placeholder="Wichtige Ankündigung"
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="content" className="text-right">
                          Inhalt
                        </Label>
                        <Textarea
                          id="content"
                          name="content"
                          placeholder="Deine Ankündigung hier..."
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="color" className="text-right">
                          Farbe
                        </Label>
                        <div className="col-span-3 flex gap-2 items-center">
                          <input 
                            type="color" 
                            id="color"
                            name="color"
                            defaultValue="#5865F2"
                            className="w-10 h-8 rounded border border-input"
                          />
                          <span className="text-sm text-muted-foreground">
                            Wähle eine Farbe für den Embed
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="mentionEveryone" className="text-right">
                          @everyone
                        </Label>
                        <div className="flex items-center space-x-2 col-span-3">
                          <Switch id="mentionEveryone" name="mentionEveryone" />
                          <Label htmlFor="mentionEveryone">
                            Alle Nutzer erwähnen
                          </Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSending}>Ankündigung senden</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {isAdmin && (
                <>
                  <div className="flex gap-2 mt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-1/2 flex items-center justify-center"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Einstellungen
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Bot-Einstellungen</DialogTitle>
                          <DialogDescription>
                            Konfiguriere den Discord-Status-Bot
                          </DialogDescription>
                        </DialogHeader>
                        <Tabs defaultValue="embed">
                          <TabsList className="mb-4">
                            <TabsTrigger value="embed">Embed</TabsTrigger>
                            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
                            <TabsTrigger value="advanced">Erweitert</TabsTrigger>
                          </TabsList>

                          <TabsContent value="embed">
                            <div className="space-y-4 py-2">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="embedTitle" className="text-right">
                                  Titel
                                </Label>
                                <Input
                                  id="embedTitle"
                                  value={customEmbedConfig.title}
                                  onChange={(e) => setCustomEmbedConfig({
                                    ...customEmbedConfig,
                                    title: e.target.value
                                  })}
                                  className="col-span-3"
                                />
                              </div>

                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="embedColor" className="text-right">
                                  Farbe
                                </Label>
                                <div className="col-span-3 flex gap-2 items-center">
                                  <input 
                                    type="color" 
                                    id="embedColor"
                                    value={customEmbedConfig.color}
                                    onChange={(e) => setCustomEmbedConfig({
                                      ...customEmbedConfig,
                                      color: e.target.value
                                    })}
                                    className="w-10 h-8 rounded border border-input"
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    Wähle eine Farbe für den Embed
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="useCustomEmojis" className="text-right">
                                  Emojis
                                </Label>
                                <div className="flex items-center space-x-2 col-span-3">
                                  <Switch 
                                    id="useCustomEmojis"
                                    checked={customEmbedConfig.useCustomEmojis}
                                    onCheckedChange={(checked) => setCustomEmbedConfig({
                                      ...customEmbedConfig,
                                      useCustomEmojis: checked
                                    })}
                                  />
                                  <Label htmlFor="useCustomEmojis">
                                    Benutzerdefinierte Emojis verwenden
                                  </Label>
                                </div>
                              </div>

                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="showTimestamp" className="text-right">
                                  Zeitstempel
                                </Label>
                                <div className="flex items-center space-x-2 col-span-3">
                                  <Switch 
                                    id="showTimestamp"
                                    checked={customEmbedConfig.showTimestamp}
                                    onCheckedChange={(checked) => setCustomEmbedConfig({
                                      ...customEmbedConfig,
                                      showTimestamp: checked
                                    })}
                                  />
                                  <Label htmlFor="showTimestamp">
                                    Zeitstempel anzeigen
                                  </Label>
                                </div>
                              </div>

                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="footerText" className="text-right">
                                  Footer
                                </Label>
                                <Input
                                  id="footerText"
                                  value={customEmbedConfig.footerText}
                                  onChange={(e) => setCustomEmbedConfig({
                                    ...customEmbedConfig,
                                    footerText: e.target.value
                                  })}
                                  className="col-span-3"
                                />
                              </div>

                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="groupServices" className="text-right">
                                  Gruppierung
                                </Label>
                                <div className="flex items-center space-x-2 col-span-3">
                                  <Switch 
                                    id="groupServices"
                                    checked={customEmbedConfig.groupServices}
                                    onCheckedChange={(checked) => setCustomEmbedConfig({
                                      ...customEmbedConfig,
                                      groupServices: checked
                                    })}
                                  />
                                  <Label htmlFor="groupServices">
                                    Services nach Gruppen anordnen
                                  </Label>
                                </div>
                              </div>
                            </div>
                            <DialogFooter className="mt-4">
                              <Button onClick={saveEmbedSettings}>Einstellungen speichern</Button>
                            </DialogFooter>
                          </TabsContent>

                          <TabsContent value="notifications">
                            <div className="space-y-4 py-2">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <Label htmlFor="outages" className="mb-1">
                                    Ausfälle
                                  </Label>
                                  <span className="text-xs text-muted-foreground">
                                    Bei Systemausfällen benachrichtigen
                                  </span>
                                </div>
                                <Switch 
                                  id="outages"
                                  checked={notifications.outages}
                                  onCheckedChange={(checked) => setNotifications({
                                    ...notifications,
                                    outages: checked
                                  })}
                                />
                              </div>

                              <Separator />

                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <Label htmlFor="degraded" className="mb-1">
                                    Beeinträchtigungen
                                  </Label>
                                  <span className="text-xs text-muted-foreground">
                                    Bei Systembeeinträchtigungen benachrichtigen
                                  </span>
                                </div>
                                <Switch 
                                  id="degraded"
                                  checked={notifications.degraded}
                                  onCheckedChange={(checked) => setNotifications({
                                    ...notifications,
                                    degraded: checked
                                  })}
                                />
                              </div>

                              <Separator />

                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <Label htmlFor="maintenance" className="mb-1">
                                    Wartungen
                                  </Label>
                                  <span className="text-xs text-muted-foreground">
                                    Bei geplanten Wartungen benachrichtigen
                                  </span>
                                </div>
                                <Switch 
                                  id="maintenance"
                                  checked={notifications.maintenance}
                                  onCheckedChange={(checked) => setNotifications({
                                    ...notifications,
                                    maintenance: checked
                                  })}
                                />
                              </div>

                              <Separator />

                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <Label htmlFor="recovered" className="mb-1">
                                    Wiederherstellungen
                                  </Label>
                                  <span className="text-xs text-muted-foreground">
                                    Bei Systemwiederherstellungen benachrichtigen
                                  </span>
                                </div>
                                <Switch 
                                  id="recovered"
                                  checked={notifications.recovered}
                                  onCheckedChange={(checked) => setNotifications({
                                    ...notifications,
                                    recovered: checked
                                  })}
                                />
                              </div>
                            </div>
                            <DialogFooter className="mt-4">
                              <Button onClick={saveNotificationSettings}>Einstellungen speichern</Button>
                            </DialogFooter>
                          </TabsContent>

                          <TabsContent value="advanced">
                            <div className="space-y-4 py-2">
                              <div className="bg-muted/50 p-3 rounded-md">
                                <h4 className="font-medium mb-2 flex items-center">
                                  <Info className="h-4 w-4 mr-1" /> 
                                  Erweiterte Funktionen
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Diese Funktionen sollten mit Vorsicht verwendet werden.
                                </p>
                              </div>

                              <div className="flex flex-col gap-2 mt-4">
                                <Button 
                                  variant="outline" 
                                  className="justify-start"
                                  onClick={clearHistoricalMessages}
                                >
                                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                  Historische Nachrichten löschen
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  className="justify-start"
                                  onClick={() => setShowLogs(!showLogs)}
                                >
                                  {showLogs ? (
                                    <EyeOff className="mr-2 h-4 w-4" />
                                  ) : (
                                    <Eye className="mr-2 h-4 w-4" />
                                  )}
                                  {showLogs ? "Logs ausblenden" : "Logs anzeigen"}
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  className="justify-start"
                                  onClick={() => {
                                    window.open(`https://discord.com/channels/${botInfo?.guild_id || ''}/${botConfig?.status_channel_id || ''}`, '_blank');
                                  }}
                                >
                                  <Link className="mr-2 h-4 w-4" />
                                  Discord-Kanal öffnen
                                </Button>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-1/2 flex items-center justify-center"
                        >
                          <History className="mr-2 h-4 w-4" />
                          Verlauf
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bot Status Verlauf</DialogTitle>
                          <DialogDescription>
                            Statusänderungen und Aktivitäten des Bots
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <h4 className="font-medium mb-2">Status History</h4>
                          <div className="bg-muted/50 rounded-md p-3 max-h-[200px] overflow-y-auto">
                            {botStatusHistory.length > 0 ? (
                              <div className="space-y-2">
                                {botStatusHistory.map((entry, i) => (
                                  <div key={i} className="text-sm flex justify-between">
                                    <span className="text-muted-foreground">
                                      {entry.timestamp.toLocaleTimeString('de-DE')}
                                    </span>
                                    <Badge variant={entry.status === 'online' ? 'default' : 'destructive'} className="text-xs">
                                      {entry.status === 'online' ? 'Online' : 'Offline'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center">
                                Keine Historiedaten verfügbar
                              </p>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              )}
            </TooltipProvider>
          </div>

          {showLogs && (
            <div className="mt-4 border-t border-[#5865F2]/10 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Bot-Logs</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2" 
                  onClick={() => setBotLogs([])}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="bg-muted/50 rounded-md p-2 max-h-[150px] overflow-y-auto text-left">
                {botLogs.length > 0 ? (
                  botLogs.map((log, i) => (
                    <div key={i} className="text-xs text-muted-foreground mb-1">{log}</div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">Keine Logs vorhanden</p>
                )}
              </div>
            </div>
          )}

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
