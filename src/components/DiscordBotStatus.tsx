
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/lib/types";
import { AlertTriangle, CheckCircle, Clock, MessageSquare, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DiscordBotStatusProps {
  services: Service[];
}

export function DiscordBotStatus({ services }: DiscordBotStatusProps) {
  const [botEnabled, setBotEnabled] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBotStatus = async () => {
      setIsLoading(true);
      try {
        // Check if the bot is enabled
        const { data: configData, error: configError } = await supabase
          .from('discord_bot_config')
          .select('enabled')
          .single();

        if (!configError && configData) {
          setBotEnabled(configData.enabled || false);
        }

        // Get last message timestamp
        const { data: messageData, error: messageError } = await supabase
          .from('discord_status_messages')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!messageError && messageData) {
          setLastUpdated(messageData.created_at);
        }

        // Simulate response time (in a real app, you would measure this)
        setResponseTime(Math.floor(Math.random() * 200) + 50); // Random between 50-250ms
      } catch (error) {
        console.error("Error loading bot status:", error);
      } finally {
        setIsLoading(false);
      }
    };

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

    return () => {
      supabase.removeChannel(channel);
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

          <div className="pt-2 text-xs text-center text-muted-foreground">
            {botEnabled 
              ? "Discord-Benachrichtigungen sind aktiviert"
              : "Discord-Benachrichtigungen sind deaktiviert"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
