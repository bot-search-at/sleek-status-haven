
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  token: z.string().min(1, { message: "Bot Token wird benötigt" }),
  guild_ids: z.string(),
  status_channel_id: z.string().min(1, { message: "Status Kanal ID wird benötigt" }),
  enabled: z.boolean().default(false),
});

export function DiscordBotConfig() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [botStatus, setBotStatus] = useState<{ success: boolean; message: string; botInfo?: any } | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: "",
      guild_ids: "",
      status_channel_id: "",
      enabled: false,
    },
  });

  useEffect(() => {
    const loadBotConfig = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('discord_bot_config')
          .select('*')
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
            console.error("Error loading bot config:", error);
            toast({
              title: "Fehler beim Laden der Bot-Konfiguration",
              description: error.message,
              variant: "destructive",
            });
          }
        } else if (data) {
          form.reset({
            token: data.token || "",
            guild_ids: Array.isArray(data.guild_ids) ? data.guild_ids.join(", ") : data.guild_ids || "",
            status_channel_id: data.status_channel_id || "",
            enabled: data.enabled || false,
          });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBotConfig();
  }, [form, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      // Process guild_ids: convert comma-separated string to array
      const guildIdsArray = values.guild_ids
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);

      const { error } = await supabase
        .from('discord_bot_config')
        .upsert({
          id: 1, // Use a fixed ID so we always update the same row
          token: values.token,
          guild_ids: guildIdsArray,
          status_channel_id: values.status_channel_id,
          enabled: values.enabled,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Bot-Konfiguration gespeichert",
        description: "Die Discord Bot Einstellungen wurden erfolgreich aktualisiert.",
      });
    } catch (error: any) {
      console.error("Error saving bot config:", error);
      toast({
        title: "Fehler beim Speichern der Konfiguration",
        description: error.message || "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setBotStatus(null);

    try {
      const values = form.getValues();
      
      const response = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: {
          token: values.token,
          guild_id: values.guild_ids.split(',')[0]?.trim(),
          channel_id: values.status_channel_id
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Connection test failed");
      }

      if (response.data?.success) {
        setBotStatus({
          success: true,
          message: "Verbindung erfolgreich hergestellt!",
          botInfo: response.data.bot
        });
        toast({
          title: "Verbindung erfolgreich",
          description: `Bot ${response.data.bot.username}#${response.data.bot.discriminator} ist verbunden.`,
        });
      } else {
        setBotStatus({
          success: false,
          message: response.data?.error || "Fehler bei der Verbindung"
        });
        toast({
          title: "Verbindungstest fehlgeschlagen",
          description: response.data?.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error testing connection:", error);
      setBotStatus({
        success: false,
        message: error.message || "Ein unerwarteter Fehler ist aufgetreten."
      });
      toast({
        title: "Verbindungstest fehlgeschlagen",
        description: error.message || "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const sendStatusUpdate = async () => {
    setIsUpdating(true);

    try {
      const response = await supabase.functions.invoke('discord-bot', {
        method: 'POST',
        body: {},
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send status update");
      }

      toast({
        title: "Status-Update gesendet",
        description: "Das Status-Update wurde erfolgreich an Discord gesendet.",
      });
    } catch (error: any) {
      console.error("Error sending status update:", error);
      toast({
        title: "Fehler beim Senden des Status-Updates",
        description: error.message || "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discord Bot Konfiguration</CardTitle>
        <CardDescription>
          Konfiguriere den Discord Bot, um Status-Updates automatisch zu senden.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Token</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Discord Bot Token"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Der Token deines Discord Bots. Du kannst einen Bot im {" "}
                    <a
                      href="https://discord.com/developers/applications"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Discord Developer Portal
                    </a>{" "}
                    erstellen.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guild_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server IDs</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Server IDs (kommagetrennt)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Die IDs der Discord Server, in denen der Bot verwendet werden soll (kommagetrennt).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status_channel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Kanal ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Kanal ID für Status-Updates"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Die ID des Kanals, in dem Status-Updates gepostet werden sollen.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Bot aktivieren</FormLabel>
                    <FormDescription>
                      Aktiviere oder deaktiviere automatische Status-Updates.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {botStatus && (
              <div className={`p-4 rounded-md ${botStatus.success ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {botStatus.success ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">
                      {botStatus.success ? 'Verbindung erfolgreich' : 'Verbindungsfehler'}
                    </h3>
                    <div className="mt-2 text-sm">
                      <p>{botStatus.message}</p>
                      {botStatus.success && botStatus.botInfo && (
                        <p className="mt-1">Bot: {botStatus.botInfo.username}#{botStatus.botInfo.discriminator}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Bot Aktionen</h3>
                  <p className="text-sm text-muted-foreground">Teste den Bot oder sende ein Status-Update.</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testConnection}
                    disabled={isTesting || !form.getValues().token || !form.getValues().status_channel_id}
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Teste...
                      </>
                    ) : (
                      "Verbindung testen"
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={sendStatusUpdate}
                    disabled={isUpdating || !form.getValues().enabled}
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sende...
                      </>
                    ) : (
                      "Status senden"
                    )}
                  </Button>
                </div>
              </div>
              <Separator />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Konfiguration speichern"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <p>
          Hinweis: Der Bot muss den Server mit den Berechtigungen "Nachrichten lesen" und "Nachrichten senden" 
          eingeladen worden sein.
        </p>
      </CardFooter>
    </Card>
  );
}
