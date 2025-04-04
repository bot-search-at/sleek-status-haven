
// Discord Bot Edge Function for Status Updates
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CommandConfig {
  name: string;
  description: string;
  is_slash_command?: boolean;
}

interface DiscordBotConfig {
  token: string;
  guild_ids: string[];
  status_channel_id: string;
  enabled: boolean;
  design_theme: 'default' | 'minimal' | 'compact' | 'modern';
  color_scheme: 'standard' | 'dark' | 'light' | 'custom';
  commands: CommandConfig[];
  use_slash_commands: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
  service_group: string;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  impact: 'none' | 'minor' | 'major' | 'critical';
  created_at: string;
  service_ids: string[];
  updates: {
    id: string;
    message: string;
    status: string;
    created_at: string;
  }[];
}

// Helper to get Discord color based on status
function getStatusColor(status: string): number {
  switch(status) {
    case 'operational': return 0x57F287; // green
    case 'degraded': return 0xFEE75C;    // yellow
    case 'partial_outage': return 0xFEE75C; // yellow
    case 'major_outage': return 0xED4245;   // red
    case 'maintenance': return 0x5865F2;    // blue
    case 'resolved': return 0x57F287;       // green
    default: return 0x95A5A6; // gray
  }
}

// Helper to get emoji based on status
function getStatusEmoji(status: string, botConfig: DiscordBotConfig): string {
  // Default emojis if custom ones aren't available
  switch(status) {
    case 'operational': return '<:green:1356281396007670025>';
    case 'degraded': return '<:yellow:1356281423177453739>';
    case 'partial_outage': return '<:yellow:1356281423177453739>';
    case 'major_outage': return '<:red:1356281490948530319>';
    case 'maintenance': return '<:blue:1356281439053807908>';
    default: return '⚪';
  }
}

// Helper to format dates for better display
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

// Check if a Discord channel is accessible
async function checkChannelAccess(token: string, channelId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('Channel access check result: Accessible');
      return true;
    } else {
      console.log(`Channel access check result: Failed with status ${response.status}`);
      const data = await response.json();
      console.error(`Discord API error: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking channel access: ${error}`);
    return false;
  }
}

// Create embed for status updates based on design theme
function createStatusEmbed(services: Service[], incidents: Incident[], botConfig: DiscordBotConfig): any {
  // Group services by their service_group
  const serviceGroups: Record<string, Service[]> = {};
  services.forEach(service => {
    if (!serviceGroups[service.service_group]) {
      serviceGroups[service.service_group] = [];
    }
    serviceGroups[service.service_group].push(service);
  });

  // Determine overall system status
  let hasIssues = false;
  let hasMajorOutage = false;
  let hasMaintenance = false;

  services.forEach(service => {
    if (service.status === 'degraded' || service.status === 'partial_outage') {
      hasIssues = true;
    } else if (service.status === 'major_outage') {
      hasIssues = true;
      hasMajorOutage = true;
    } else if (service.status === 'maintenance') {
      hasMaintenance = true;
    }
  });

  // Set the title and color based on system status
  let title = 'Alle Systeme betriebsbereit';
  let color = 0x57F287; // green
  
  if (hasMajorOutage) {
    title = 'Schwerwiegender Ausfall erkannt';
    color = 0xED4245; // red
  } else if (hasIssues) {
    title = 'Dienstbeeinträchtigungen erkannt';
    color = 0xFEE75C; // yellow
  } else if (hasMaintenance) {
    title = 'Wartungsarbeiten im Gange';
    color = 0x5865F2; // blue
  }

  // Create embed fields for each service group
  const fields = Object.entries(serviceGroups).map(([groupName, groupServices]) => {
    let value = '';
    groupServices.forEach(service => {
      const emoji = getStatusEmoji(service.status, botConfig);
      const statusText = {
        'operational': 'Betriebsbereit',
        'degraded': 'Beeinträchtigt',
        'partial_outage': 'Teilweiser Ausfall',
        'major_outage': 'Schwerwiegender Ausfall',
        'maintenance': 'Wartung'
      }[service.status] || service.status;
      
      value += `${emoji} **${service.name}**: ${statusText}\n`;
    });
    
    return {
      name: groupName,
      value: value,
      inline: false
    };
  });

  // Create the embed
  const now = new Date();
  const embed = {
    title: title,
    description: 'Aktuelle Status-Informationen zu allen Diensten',
    color: color,
    timestamp: now.toISOString(),
    fields: fields,
    footer: {
      text: `Letztes Update: ${formatDateTime(now.toISOString())} • Power by Bot Search_AT`
    }
  };

  // Apply design theme modifications
  switch (botConfig.design_theme) {
    case 'minimal':
      // Simplified design with minimal decoration
      embed.description = '· Statusübersicht aller Dienste';
      break;
      
    case 'compact':
      // More compact representation of services
      fields.forEach(field => {
        field.value = field.value.replace(/\n/g, ' • ').trim();
      });
      break;
      
    case 'modern':
      // No specific modifications needed, default is modern style
      break;
  }

  // Apply color scheme modifications if needed
  switch (botConfig.color_scheme) {
    case 'dark':
      // Dark theme uses darker colors
      color = hasMajorOutage ? 0xC0392B : (hasIssues ? 0xF39C12 : 0x2ECC71);
      break;
      
    case 'light':
      // Light theme uses lighter colors
      color = hasMajorOutage ? 0xFFCDD2 : (hasIssues ? 0xFFF9C4 : 0xC8E6C9);
      break;
      
    case 'custom':
      // Custom would typically use user-defined colors
      // For now we'll use default
      break;
  }

  return embed;
}

// Check if a message exists in a channel
async function getExistingStatusMessage(token: string, channelId: string): Promise<string | null> {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` } } }
    );

    // Get the most recent status message
    const { data, error } = await supabaseClient
      .from('discord_status_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error(`Error fetching status message: ${error.message}`);
      return null;
    }

    if (data && data.length > 0) {
      // Verify the message still exists in the channel
      const messageId = data[0].message_id;
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
        headers: {
          'Authorization': `Bot ${token}`
        }
      });

      if (response.ok) {
        return messageId;
      }

      // If message doesn't exist anymore, clean up the database
      await supabaseClient
        .from('discord_status_messages')
        .delete()
        .eq('message_id', messageId);
    }

    return null;
  } catch (error) {
    console.error(`Error getting existing status message: ${error}`);
    return null;
  }
}

// Send status update to Discord
async function sendStatusUpdate(token: string, channelId: string, embed: any): Promise<string | null> {
  try {
    const messageId = await getExistingStatusMessage(token, channelId);
    let url;
    let method;
    let body;

    if (messageId) {
      // Update existing message
      console.log(`Updating existing message: ${messageId} in channel: ${channelId}`);
      url = `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`;
      method = 'PATCH';
      body = JSON.stringify({ embeds: [embed] });
    } else {
      // Send new message
      console.log(`Sending new message to channel: ${channelId}`);
      url = `https://discord.com/api/v10/channels/${channelId}/messages`;
      method = 'POST';
      body = JSON.stringify({ embeds: [embed] });
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: body,
    });

    console.log(`Discord API response status: ${response.status}`);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log(`Discord API response: ${JSON.stringify(responseData)}`);
      
      // Save or update the message reference in the database
      if (!messageId) {
        try {
          const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` } } }
          );

          await supabaseClient
            .from('discord_status_messages')
            .insert({
              message_id: responseData.id,
              channel_id: channelId,
              content: JSON.stringify(embed),
            });
        } catch (dbError) {
          console.error(`Error saving message reference: ${dbError}`);
        }
      }
      
      return responseData.id;
    } else {
      console.log(`Bot status update response: ${response.status}`);
      const errorData = await response.json().catch(() => null);
      throw new Error(`Discord API error: ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.error(`Error sending to Discord: ${error}`);
    throw error;
  }
}

// Register slash commands with Discord
async function registerSlashCommands(token: string, guildId: string, commands: CommandConfig[], useSlashCommands: boolean): Promise<boolean> {
  try {
    if (!useSlashCommands) {
      console.log('Slash commands are disabled, skipping registration');
      return true;
    }

    // Format commands for Discord's API
    const discordCommands = commands
      .filter(cmd => cmd.is_slash_command !== false) // Only include commands marked as slash commands
      .map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        type: 1, // CHAT_INPUT type
      }));
    
    if (discordCommands.length === 0) {
      console.log('No slash commands to register');
      return true;
    }

    console.log(`Registering ${discordCommands.length} slash commands for guild ${guildId}`);

    // Register guild commands (faster than global commands)
    const url = `https://discord.com/api/v10/applications/1355163870989390005/guilds/${guildId}/commands`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordCommands),
    });

    console.log(`Slash command registration response status: ${response.status}`);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log(`Registered ${responseData.length} slash commands successfully`);
      return true;
    } else {
      const errorData = await response.json().catch(() => null);
      console.error(`Failed to register slash commands: ${JSON.stringify(errorData)}`);
      return false;
    }
  } catch (error) {
    console.error(`Error registering slash commands: ${error}`);
    return false;
  }
}

// Perform system status check and update Discord
async function performStatusUpdate() {
  try {
    console.log('Performing status update...');
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` } } }
    );
    
    // Get bot configuration
    const { data: configData, error: configError } = await supabaseClient
      .from('discord_bot_config')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (configError) {
      throw new Error(`Error fetching bot config: ${configError.message}`);
    }
    
    if (!configData.enabled) {
      console.log('Bot is disabled, skipping status update');
      return;
    }
    
    // Get services
    const { data: servicesData, error: servicesError } = await supabaseClient
      .from('services')
      .select('*');
    
    if (servicesError) {
      throw new Error(`Error fetching services: ${servicesError.message}`);
    }
    
    // Get active incidents
    const { data: incidentsData, error: incidentsError } = await supabaseClient
      .from('incidents')
      .select(`
        *,
        incident_updates(*)
      `)
      .or('status.neq.resolved,resolved_at.gt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}');
    
    if (incidentsError) {
      throw new Error(`Error fetching incidents: ${incidentsError.message}`);
    }
    
    console.log('Preparing to send status update to Discord using embeds');
    
    const botConfig = configData as DiscordBotConfig;
    const services = servicesData as Service[];
    const incidents = incidentsData as Incident[];
    
    // Create the status embed
    const statusEmbed = createStatusEmbed(services, incidents, botConfig);
    
    // Send status update to Discord
    await sendStatusUpdate(botConfig.token, botConfig.status_channel_id, statusEmbed);
    
    console.log('Status update sent successfully');
    
    // Return summary data
    return {
      success: true,
      services_count: services.length,
      incidents_count: incidents.length,
    };
  } catch (error) {
    console.error(`Error auto-updating embed after system check: ${error}`);
    throw error;
  }
}

let lastStatusUpdate = 0;

// Main handler function
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const bodyText = await req.text();
    console.log(`Request body text: ${bodyText}`);
    
    const data = JSON.parse(bodyText);
    console.log(`Received action: ${data.action} with data: ${JSON.stringify(data)}`);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` } } }
    );

    // Handle different actions
    switch (data.action) {
      case 'check-status':
        console.log('Checking Discord bot status using token...');

        // First verify bot token works
        const tokenResponse = await fetch('https://discord.com/api/v10/users/@me', {
          headers: {
            'Authorization': `Bot ${data.token || ''}`,
          },
        });
        
        console.log(`Discord API response status for bot check: ${tokenResponse.status}`);
        
        if (tokenResponse.ok) {
          const botData = await tokenResponse.json();
          console.log(`Bot data received: ${JSON.stringify(botData)}`);
          
          // Then verify channel access
          const channelAccessible = await checkChannelAccess(
            data.token || '',
            data.channel_id || ''
          );
          
          console.log(`Channel access check result: ${channelAccessible ? 'Accessible' : 'Not accessible'}`);
          
          return new Response(
            JSON.stringify({
              online: tokenResponse.ok && channelAccessible,
              bot: botData,
              channel_accessible: channelAccessible,
              error: !channelAccessible ? 'Cannot access the specified channel' : null
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          const errorData = await tokenResponse.json().catch(() => null);
          return new Response(
            JSON.stringify({
              online: false,
              error: `Failed to authenticate bot: ${errorData?.message || 'Invalid token'}`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
      case 'update-status':
        try {
          const result = await performStatusUpdate();
          return new Response(
            JSON.stringify({ success: true, result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'auto-update-embed':
        // Limit update frequency to once per minute
        const now = Date.now();
        if (now - lastStatusUpdate < 60000) {
          console.log(`Skipping auto-update, last update was less than 1 minute ago`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              skipped: true, 
              message: 'Auto-update skipped, last update was less than 1 minute ago' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        lastStatusUpdate = now;
        
        try {
          const result = await performStatusUpdate();
          return new Response(
            JSON.stringify({ success: true, result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      
      case 'check-system-status':
        console.log('Auto-updating embed after system status check...');
        try {
          const result = await performStatusUpdate();
          return new Response(
            JSON.stringify({ success: true, result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error(`Error auto-updating: ${error}`);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'restart-bot':
        console.log('Restarting Discord bot...');
        
        try {
          // Get bot configuration
          const { data: configData, error: configError } = await supabaseClient
            .from('discord_bot_config')
            .select('*')
            .eq('id', 1)
            .single();
          
          if (configError) {
            throw new Error(`Error fetching bot config: ${configError.message}`);
          }
          
          const botConfig = configData as DiscordBotConfig;

          // Register slash commands for all guilds
          if (botConfig.use_slash_commands && botConfig.guild_ids.length > 0) {
            console.log('Registering slash commands for all guilds...');
            for (const guildId of botConfig.guild_ids) {
              await registerSlashCommands(
                botConfig.token,
                guildId,
                botConfig.commands,
                botConfig.use_slash_commands
              );
            }
          }
          
          // Send a status update after restart
          const result = await performStatusUpdate();
          
          return new Response(
            JSON.stringify({ 
              success: true,
              message: 'Bot restarted successfully',
              slashCommandsRegistered: botConfig.use_slash_commands,
              statusUpdated: true,
              result
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error(`Error restarting bot: ${error}`);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error(`Error processing request: ${error}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
