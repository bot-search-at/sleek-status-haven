import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Save, Trash, Plus, Pencil } from "lucide-react";
import { DiscordBotStatus } from "./DiscordBotStatus";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Command {
  name: string;
  description: string;
  is_slash_command?: boolean;
  index?: number; // Added index property to fix type errors
}

interface DiscordBotConfig {
  id: number;
  token: string;
  guild_ids: string[];
  status_channel_id: string;
  enabled: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  design_theme: 'default' | 'minimal' | 'compact' | 'modern';
  color_scheme: 'standard' | 'dark' | 'light' | 'custom';
  commands: Command[];
  use_slash_commands: boolean | null;
}

export function DiscordBotAdmin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [botConfig, setBotConfig] = useState<DiscordBotConfig | null>(null);
  const [token, setToken] = useState("");
  const [guildIds, setGuildIds] = useState("");
  const [statusChannelId, setStatusChannelId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [designTheme, setDesignTheme] = useState<'default' | 'minimal' | 'compact' | 'modern'>('default');
  const [colorScheme, setColorScheme] = useState<'standard' | 'dark' | 'light' | 'custom'>('standard');
  const [useSlashCommands, setUseSlashCommands] = useState(true);
  const [commands, setCommands] = useState<Command[]>([]);
  const [isCommandDialogOpen, setIsCommandDialogOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [commandName, setCommandName] = useState("");
  const [commandDescription, setCommandDescription] = useState("");
  const [commandIsSlash, setCommandIsSlash] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchBotConfig();
  }, []);

  const fetchBotConfig = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("discord_bot_config")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Error fetching bot config:", error);
        toast({
          title: "Error",
          description: "Could not load Discord bot configuration.",
          variant: "destructive",
        });
        return;
      }

      setBotConfig(data);
      setToken(data.token);
      setGuildIds(data.guild_ids ? data.guild_ids.join("\n") : "");
      setStatusChannelId(data.status_channel_id);
      setEnabled(data.enabled || false);
      setDesignTheme(data.design_theme || 'default');
      setColorScheme(data.color_scheme || 'standard');
      setUseSlashCommands(data.use_slash_commands || false);
      setCommands(data.commands || []);
    } catch (error) {
      console.error("Error in fetchBotConfig:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token || !statusChannelId) {
      toast({
        title: "Missing Fields",
        description: "Bot token and status channel ID are required.",
        variant: "destructive",
      });
      return;
    }

    const parsedGuildIds = guildIds
      .split("\n")
      .map((id) => id.trim())
      .filter(Boolean);

    if (useSlashCommands && parsedGuildIds.length === 0) {
      toast({
        title: "Missing Guild IDs",
        description: "At least one guild ID is required when slash commands are enabled.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("discord_bot_config")
        .update({
          token,
          guild_ids: parsedGuildIds,
          status_channel_id: statusChannelId,
          enabled,
          design_theme: designTheme,
          color_scheme: colorScheme,
          commands,
          use_slash_commands: useSlashCommands,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discord bot configuration has been updated.",
      });

      fetchBotConfig();
    } catch (error) {
      console.error("Error saving bot config:", error);
      toast({
        title: "Error",
        description: "Could not save Discord bot configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestartBot = async () => {
    try {
      setIsRestarting(true);
      
      const response = await fetch(`${window.location.origin}/api/discord-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'restart-bot'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Bot Restarted",
          description: "Discord bot has been restarted successfully.",
        });
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error restarting bot:", error);
      toast({
        title: "Error",
        description: `Could not restart Discord bot: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsRestarting(false);
    }
  };

  const openAddCommandDialog = () => {
    setEditingCommand(null);
    setCommandName("");
    setCommandDescription("");
    setCommandIsSlash(true);
    setIsCommandDialogOpen(true);
  };

  const openEditCommandDialog = (command: Command, index: number) => {
    setEditingCommand({ ...command, index });
    setCommandName(command.name);
    setCommandDescription(command.description);
    setCommandIsSlash(command.is_slash_command !== false);
    setIsCommandDialogOpen(true);
  };

  const handleSaveCommand = () => {
    if (!commandName || !commandDescription) {
      toast({
        title: "Missing Fields",
        description: "Command name and description are required.",
        variant: "destructive",
      });
      return;
    }

    const newCommand = {
      name: commandName.toLowerCase(),
      description: commandDescription,
      is_slash_command: commandIsSlash,
    };

    if (editingCommand && editingCommand.index !== undefined) {
      const newCommands = [...commands];
      newCommands[editingCommand.index] = newCommand;
      setCommands(newCommands);
    } else {
      setCommands([...commands, newCommand]);
    }

    setIsCommandDialogOpen(false);
  };

  const handleDeleteCommand = (index: number) => {
    const newCommands = [...commands];
    newCommands.splice(index, 1);
    setCommands(newCommands);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="mt-2">Loading configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Discord Bot Konfiguration</CardTitle>
          <CardDescription>
            Konfigurieren Sie die Verbindung zum Discord Bot und sein Verhalten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Bot Status</h3>
            <DiscordBotStatus services={[]} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Bot Aktivieren</h3>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                aria-label="Toggle bot active state"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Aktivieren oder deaktivieren Sie den Discord Bot
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Authentifizierung</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="token" className="text-sm font-medium">
                  Bot Token
                </label>
                <Textarea
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Discord Bot Token"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="guild-ids" className="text-sm font-medium">
                  Server IDs
                </label>
                <Textarea
                  id="guild-ids"
                  value={guildIds}
                  onChange={(e) => setGuildIds(e.target.value)}
                  placeholder="Liste von Server IDs (ein ID pro Zeile)"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Geben Sie jede Discord Server ID in einer neuen Zeile ein
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="status-channel" className="text-sm font-medium">
                  Status Kanal ID
                </label>
                <Input
                  id="status-channel"
                  value={statusChannelId}
                  onChange={(e) => setStatusChannelId(e.target.value)}
                  placeholder="Discord Kanal ID für Statusmeldungen"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Design & Befehle</h3>
            
            <div className="space-y-2">
              <label htmlFor="design-theme" className="text-sm font-medium">
                Design-Stil
              </label>
              <Select value={designTheme} onValueChange={(val) => setDesignTheme(val as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie einen Design-Stil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Standard</SelectItem>
                  <SelectItem value="minimal">Minimalistisch</SelectItem>
                  <SelectItem value="compact">Kompakt</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="color-scheme" className="text-sm font-medium">
                Farbschema
              </label>
              <Select value={colorScheme} onValueChange={(val) => setColorScheme(val as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie ein Farbschema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="dark">Dunkel</SelectItem>
                  <SelectItem value="light">Hell</SelectItem>
                  <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="use-slash-commands" className="text-sm font-medium">
                  Slash-Befehle verwenden
                </label>
                <Switch
                  id="use-slash-commands"
                  checked={useSlashCommands}
                  onCheckedChange={setUseSlashCommands}
                  aria-label="Slash-Befehle aktivieren"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Aktivieren Sie diese Option, um Discord Slash-Befehle zu verwenden
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Bot-Befehle</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openAddCommandDialog}
                >
                  <Plus className="h-4 w-4 mr-1" /> Befehl hinzufügen
                </Button>
              </div>
              
              {commands.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {commands.map((command, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-2 bg-background border rounded-md"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">/{command.name}</span>
                          {command.is_slash_command !== false && useSlashCommands && (
                            <Badge variant="outline" className="text-xs">Slash</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{command.description}</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditCommandDialog(command, idx)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteCommand(idx)}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Befehle definiert</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardContent className="pt-0 flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={handleRestartBot}
            disabled={isRestarting || isSaving}
          >
            {isRestarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Neustart läuft...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Bot neu starten
              </>
            )}
          </Button>
          
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isCommandDialogOpen} onOpenChange={setIsCommandDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCommand ? "Befehl bearbeiten" : "Neuen Befehl hinzufügen"}
            </DialogTitle>
            <DialogDescription>
              {editingCommand
                ? "Ändern Sie die Details des Befehls"
                : "Fügen Sie einen neuen Befehl für den Bot hinzu"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="command-name" className="text-sm font-medium">
                Befehlsname
              </label>
              <Input
                id="command-name"
                value={commandName}
                onChange={(e) => setCommandName(e.target.value)}
                placeholder="status"
              />
              <p className="text-xs text-muted-foreground">
                Der Name des Befehls ohne Schrägstrich
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="command-description" className="text-sm font-medium">
                Beschreibung
              </label>
              <Textarea
                id="command-description"
                value={commandDescription}
                onChange={(e) => setCommandDescription(e.target.value)}
                placeholder="Zeigt den aktuellen Systemstatus an"
                rows={3}
              />
            </div>

            {useSlashCommands && (
              <div className="flex items-center justify-between">
                <label htmlFor="is-slash-command" className="text-sm font-medium">
                  Als Slash-Befehl registrieren
                </label>
                <Switch
                  id="is-slash-command"
                  checked={commandIsSlash}
                  onCheckedChange={setCommandIsSlash}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCommandDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSaveCommand}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
