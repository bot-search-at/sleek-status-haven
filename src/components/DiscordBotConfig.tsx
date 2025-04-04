
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
import { AlertCircle, CheckCircle, RefreshCw, PlusCircle, Trash2, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  token: z.string().min(1, { message: "Bot Token wird benötigt" }),
  guild_ids: z.string(),
  status_channel_id: z.string().min(1, { message: "Status Kanal ID wird benötigt" }),
  enabled: z.boolean().default(false),
  design_theme: z.enum(["default", "minimal", "compact", "modern"]).default("default"),
  color_scheme: z.enum(["standard", "dark", "light", "custom"]).default("standard"),
});

export function DiscordBotConfig() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [botStatus, setBotStatus] = useState<{ success: boolean; message: string; botInfo?: any } | null>(null);
  const [commands, setCommands] = useState<Array<{name: string, description: string}>>([
    { name: "status", description: "Zeigt den aktuellen Systemstatus an" },
    { name: "hilfe", description: "Zeigt verfügbare Befehle an" }
  ]);
  const [newCommand, setNewCommand] = useState({ name: "", description: "" });
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: "",
      guild_ids: "",
      status_channel_id: "",
      enabled: false,
      design_theme: "default",
      color_scheme: "standard",
    },
  });

  useEffect(() => {
    const loadBotConfig = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('discord_bot_config')
          .select('*')
          .limit(1)
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
            design_theme: data.design_theme || "default",
            color_scheme: data.color_scheme || "standard",
          });

          // Load saved commands if they exist
          if (data.commands && Array.isArray(data.commands)) {
            setCommands(data.commands);
          }
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

      // We need to provide id=1 as per our database schema requirement
      const { error } = await supabase
        .from('discord_bot_config')
        .upsert({
          id: 1, // Explicitly set id to 1 as it's required
          token: values.token,
          guild_ids: guildIdsArray,
          status_channel_id: values.status_channel_id,
          enabled: values.enabled,
          design_theme: values.design_theme,
          color_scheme: values.color_scheme,
          commands: commands,
          updated_at: new Date().toISOString()
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
          action: 'check-status',
          token: values.token,
          guild_id: values.guild_ids.split(',')[0]?.trim(),
          channel_id: values.status_channel_id
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Verbindungstest fehlgeschlagen");
      }

      if (response.data?.online) {
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
        body: {
          action: 'update-status'
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Status-Update fehlgeschlagen");
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

  const addCommand = () => {
    if (newCommand.name.trim() && newCommand.description.trim()) {
      setCommands([...commands, { name: newCommand.name.trim(), description: newCommand.description.trim() }]);
      setNewCommand({ name: "", description: "" });
    }
  };

  const removeCommand = (index: number) => {
    setCommands(commands.filter((_, i) => i !== index));
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
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="commands">Befehle</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
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
          </TabsContent>

          <TabsContent value="commands">
            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Verfügbare Befehle</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Diese Befehle können von Benutzern im Discord-Server verwendet werden.
                </p>
                
                <div className="space-y-2 mb-4">
                  {commands.map((cmd, index) => (
                    <div key={index} className="flex items-center justify-between bg-background p-3 rounded-md border">
                      <div>
                        <p className="font-medium">!{cmd.name}</p>
                        <p className="text-sm text-muted-foreground">{cmd.description}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeCommand(index)}
                        title="Befehl entfernen"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col gap-4 bg-card p-4 rounded-md border mt-4">
                  <h4 className="font-medium">Neuen Befehl hinzufügen</h4>
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <Input 
                        placeholder="Befehlsname"
                        value={newCommand.name}
                        onChange={(e) => setNewCommand({...newCommand, name: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Ohne Präfix, z.B. "status"</p>
                    </div>
                    <div className="flex-[2]">
                      <Input 
                        placeholder="Beschreibung"
                        value={newCommand.description}
                        onChange={(e) => setNewCommand({...newCommand, description: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Kurze Erklärung des Befehls</p>
                    </div>
                    <Button 
                      onClick={addCommand}
                      disabled={!newCommand.name.trim() || !newCommand.description.trim()}
                      className="flex-shrink-0"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Hinzufügen
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  "Änderungen speichern"
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="design">
            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Palette className="h-5 w-5" /> Design-Optionen
                </h3>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="design_theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Design-Stil</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wähle einen Design-Stil" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="default">Standard</SelectItem>
                            <SelectItem value="minimal">Minimalistisch</SelectItem>
                            <SelectItem value="compact">Kompakt</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Legt fest, wie die Status-Updates formatiert werden.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color_scheme"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Farbschema</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                            value={field.value}
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="standard" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Standard
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="dark" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Dunkel
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="light" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Hell
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="custom" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Benutzerdefiniert
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Das Farbschema für Status-Updates und Benachrichtigungen.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-8 p-4 bg-background border rounded-md">
                  <h4 className="text-sm font-medium mb-2">Vorschau</h4>
                  <div className="p-4 bg-zinc-800 text-white rounded-md font-mono text-xs">
                    <div className={`p-3 rounded-md ${
                      form.getValues().design_theme === 'default' ? 'border-l-4 border-green-500' :
                      form.getValues().design_theme === 'minimal' ? '' :
                      form.getValues().design_theme === 'compact' ? 'border border-green-500' :
                      'bg-gradient-to-r from-green-500/20 to-transparent'
                    }`}>
                      <div className="font-bold">
                        {form.getValues().design_theme === 'minimal' ? '· ' : ''}
                        Alle Systeme betriebsbereit
                      </div>
                      <div className="text-gray-300 mt-1">Aktuelle Status-Informationen zu allen Diensten</div>
                      <div className="mt-3 space-y-2">
                        <div><span className="text-green-400">●</span> <span className="font-medium">Website:</span> Betriebsbereit</div>
                        <div><span className="text-green-400">●</span> <span className="font-medium">API:</span> Betriebsbereit</div>
                        <div><span className="text-blue-400">●</span> <span className="font-medium">Bot:</span> Wartung</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  "Design speichern"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
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
