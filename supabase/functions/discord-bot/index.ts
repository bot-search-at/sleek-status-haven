import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotConfig {
  token: string;
  guild_ids: string[];
  status_channel_id: string;
  enabled: boolean;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  timestamp?: string;
  author?: { name: string; icon_url?: string; url?: string };
}

interface RequestData {
  action?: string;
  title?: string;
  content?: string;
  color?: number;
  token?: string;
  guild_id?: string;
  channel_id?: string;
  prevStatus?: string;
  currentStatus?: string;
}

interface SystemStatus {
  status: "operational" | "degraded" | "outage";
  updatedAt: string;
}

// Keep track of the last known status for outage detection
let lastKnownStatus: SystemStatus | null = null;
// Track last embed update time
let lastEmbedUpdateTime: Date | null = null;

const statusEmojis: Record<string, string> = {
  operational: "<:green:1356281396007670025>",
  degraded: "<:reed:1356281418682077234>",
  partial_outage: "<:reed:1356281418682077234>",
  major_outage: "<:reed:1356281418682077234>",
  maintenance: "<:blue:1356281439053807908>"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    let requestData: RequestData = {};
    try {
      if (req.body) {
        const bodyText = await req.text();
        console.log("Request body text:", bodyText);
        if (bodyText.trim()) {
          requestData = JSON.parse(bodyText);
        }
      }
    } catch (e) {
      console.error("Failed to parse request JSON:", e);
      return new Response(
        JSON.stringify({ error: 'Ungültiges JSON im Request-Body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Extract action from request data
    const action = requestData?.action || '';

    console.log('Received action:', action, 'with data:', JSON.stringify({
      ...requestData,
      token: requestData?.token ? '***REDACTED***' : undefined
    }));

    if (!action) {
      console.error('No action specified in request');
      return new Response(
        JSON.stringify({ error: 'Keine Aktion im Request angegeben' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get bot configuration from database (for all actions)
    const { data: configData, error: configError } = await supabaseClient
      .from('discord_bot_config')
      .select('*')
      .maybeSingle();

    if (configError) {
      console.error('Error fetching bot config:', configError);
      return new Response(
        JSON.stringify({ error: 'Bot-Konfiguration nicht gefunden', details: configError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!configData) {
      console.error('No bot configuration found');
      return new Response(
        JSON.stringify({ error: 'Bot-Konfiguration nicht gefunden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const botConfig = configData as BotConfig;
    
    if (!botConfig.enabled && action !== 'check-status') {
      console.log('Bot is disabled, not sending status update');
      return new Response(
        JSON.stringify({ message: 'Bot ist deaktiviert' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!botConfig.token || !botConfig.status_channel_id) {
      console.error('Missing required bot configuration:', {
        hasToken: !!botConfig.token,
        hasChannelId: !!botConfig.status_channel_id,
      });
      return new Response(
        JSON.stringify({ error: 'Unvollständige Bot-Konfiguration' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // New action to periodically update the embed
    if (action === 'auto-update-embed') {
      // Check if it's been at least 1 minute since last update
      const now = new Date();
      if (lastEmbedUpdateTime && (now.getTime() - lastEmbedUpdateTime.getTime() < 60000)) {
        console.log('Skipping auto-update, last update was less than 1 minute ago');
        return new Response(
          JSON.stringify({ message: 'Auto-update skipped, too soon since last update' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Update lastEmbedUpdateTime
      lastEmbedUpdateTime = now;
      
      console.log('Auto-updating embed message...');
      
      try {
        // Trigger update-status action internally
        const updateResult = await performStatusUpdate(supabaseClient, botConfig);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Embed automatisch aktualisiert',
            details: updateResult
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.error('Error during auto-update:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Fehler bei der automatischen Aktualisierung', 
            details: error.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Endpoint to check system status and detect changes
    if (action === 'check-system-status') {
      // Fetch all services to determine system status
      const { data: services, error: servicesError } = await supabaseClient
        .from('services')
        .select('*');

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        return new Response(
          JSON.stringify({ error: 'Fehler beim Abrufen der Dienste', details: servicesError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Determine system status
      let currentStatus: SystemStatus["status"] = "operational";
      if (services.some(s => s.status === "major_outage")) {
        currentStatus = "outage";
      } else if (services.some(s => ["degraded", "partial_outage"].includes(s.status))) {
        currentStatus = "degraded";
      }

      const now = new Date().toISOString();
      const currentSystemStatus: SystemStatus = {
        status: currentStatus,
        updatedAt: now
      };

      // Check if status has changed and if we should send a notification
      let statusChanged = false;
      let shouldNotify = false;
      
      if (lastKnownStatus === null) {
        // First check, store the status
        lastKnownStatus = currentSystemStatus;
      } else if (lastKnownStatus.status !== currentSystemStatus.status) {
        // Status has changed
        statusChanged = true;
        
        // Only notify on degradation or outage
        if (
          (lastKnownStatus.status === "operational" && 
           (currentSystemStatus.status === "degraded" || currentSystemStatus.status === "outage")) ||
          (lastKnownStatus.status === "degraded" && currentSystemStatus.status === "outage")
        ) {
          shouldNotify = true;
        }
        
        // Update the last known status
        lastKnownStatus = currentSystemStatus;
      }

      // If we should send a notification, do it now
      if (shouldNotify && botConfig.enabled) {
        try {
          // Create the message for the status change notification
          const statusTitle = currentSystemStatus.status === "outage" 
            ? "⚠️ Systemausfall erkannt" 
            : "⚠️ System beeinträchtigt";
          
          const statusDescription = currentSystemStatus.status === "outage"
            ? "Ein Systemausfall wurde erkannt. Services sind nicht verfügbar."
            : "Einige Systeme sind beeinträchtigt und funktionieren möglicherweise nicht wie erwartet.";
          
          const statusColor = currentSystemStatus.status === "outage" ? 0xED4245 : 0xFEE75C;
          
          const alertEmbed: DiscordEmbed = {
            title: statusTitle,
            description: statusDescription,
            color: statusColor,
            footer: {
              text: `Status geändert um ${new Date().toLocaleString('de-DE')} • Mehr Details auf der Statusseite`
            },
            timestamp: new Date().toISOString()
          };
          
          // Send the alert to Discord
          const discordApiUrl = `https://discord.com/api/v10/channels/${botConfig.status_channel_id}/messages`;
          
          const response = await fetch(discordApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${botConfig.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              embeds: [alertEmbed],
              content: currentSystemStatus.status === "outage" 
                ? " Ein Systemausfall wurde erkannt!" 
                : "Einige Systeme sind beeinträchtigt."
            }),
          });
          
          if (!response.ok) {
            const responseText = await response.text();
            console.error('Discord API error when sending alert:', responseText);
          } else {
            console.log('Alert notification sent successfully');
            
            // After sending the alert, automatically send a full status update
            const updateResponse = await fetch(
              `https://discord.com/api/v10/channels/${botConfig.status_channel_id}/messages`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bot ${botConfig.token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: "Aktueller Systemstatus wird abgerufen..." })
              }
            );
            
            if (updateResponse.ok) {
              // Trigger a status update
              await fetch(Deno.env.get('SUPABASE_FUNCTIONS_URL') + '/discord-bot', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                },
                body: JSON.stringify({ action: 'update-status' })
              });
            }
          }
        } catch (error) {
          console.error('Error sending alert notification:', error);
        }
      }

      // After checking system status, always try to auto-update the embed
      if (botConfig.enabled) {
        const now = new Date();
        if (!lastEmbedUpdateTime || (now.getTime() - lastEmbedUpdateTime.getTime() >= 60000)) {
          console.log('Auto-updating embed after system status check...');
          try {
            await performStatusUpdate(supabaseClient, botConfig);
            lastEmbedUpdateTime = now;
          } catch (error) {
            console.error('Error auto-updating embed after system check:', error);
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          status: currentSystemStatus.status, 
          updated: now,
          statusChanged,
          shouldNotify,
          lastStatus: lastKnownStatus ? lastKnownStatus.status : null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Endpoint to check if user is admin before allowing status updates
    if (action === 'check-admin') {
      const userId = requestData.user_id;
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Keine Benutzer-ID angegeben' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      const { data: adminData, error: adminError } = await supabaseClient
        .from('admin_users')
        .select('is_admin')
        .eq('id', userId)
        .single();
        
      if (adminError) {
        return new Response(
          JSON.stringify({ isAdmin: false, error: adminError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      return new Response(
        JSON.stringify({ isAdmin: adminData?.is_admin || false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Endpoint to initialize and update services in Discord
    if (action === 'update-status') {
      try {
        const result = await performStatusUpdate(supabaseClient, botConfig);
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.error('Error in update-status:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Fehler beim Aktualisieren des Status', 
            details: error.message,
            stack: error.stack
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Endpoint to check bot status - IMPROVED VERSION
    if (action === 'check-status') {
      try {
        // First, check if the bot configuration is valid
        if (!botConfig.token) {
          return new Response(
            JSON.stringify({ 
              online: false, 
              error: 'Bot-Token fehlt in der Konfiguration'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        // Use the Discord API to check if the bot is online
        console.log("Checking Discord bot status using token...");
        
        // Make a request to Discord's API to get bot information
        const botResponse = await fetch('https://discord.com/api/v10/users/@me', {
          method: 'GET',
          headers: {
            'Authorization': `Bot ${botConfig.token}`
          }
        });
        
        console.log(`Discord API response status for bot check: ${botResponse.status}`);
        
        if (!botResponse.ok) {
          const errorText = await botResponse.text();
          console.error("Error response from Discord API:", errorText);
          
          return new Response(
            JSON.stringify({ 
              online: false, 
              error: 'Bot ist nicht verbunden',
              statusCode: botResponse.status,
              details: errorText
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        // Parse the bot data
        const botData = await botResponse.json();
        console.log("Bot data received:", JSON.stringify({
          id: botData.id,
          username: botData.username,
          discriminator: botData.discriminator
        }));
        
        // Now also check if we can access the channel for posting
        let channelAccessible = false;
        if (botConfig.status_channel_id) {
          try {
            const channelResponse = await fetch(`https://discord.com/api/v10/channels/${botConfig.status_channel_id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bot ${botConfig.token}`
              }
            });
            
            channelAccessible = channelResponse.ok;
            console.log(`Channel access check result: ${channelAccessible ? 'Accessible' : 'Not accessible'}`);
          } catch (channelError) {
            console.error("Error checking channel access:", channelError);
          }
        }
        
        return new Response(
          JSON.stringify({ 
            online: true, 
            message: 'Bot ist online',
            channelAccessible: channelAccessible,
            bot: {
              username: botData.username || "Bot Search_AT",
              discriminator: botData.discriminator,
              id: botData.id,
              avatar: botData.avatar
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.error('Error checking bot status:', error);
        return new Response(
          JSON.stringify({ 
            online: false, 
            error: 'Fehler beim Überprüfen des Bot-Status', 
            details: error.message,
            stack: error.stack
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Endpoint to send a custom announcement
    if (action === 'send-announcement') {
      const { title, content, color } = requestData;
      
      if (!title || !content) {
        return new Response(
          JSON.stringify({ success: false, error: 'Titel und Inhalt sind erforderlich' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Create announcement embed
      const announcementEmbed: DiscordEmbed = {
        title: title,
        description: content,
        color: color || 0x5865F2, // Default Discord blurple if no color provided
        timestamp: new Date().toISOString(),
        footer: {
          text: "Bot Search_AT Status-Ankündigung"
        }
      };
      
      try {
        // Set Bot Status to DND when sending announcements
        const botStatusUrl = 'https://discord.com/api/v10/users/@me/settings';
        await fetch(botStatusUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bot ${botConfig.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: 'dnd',
            custom_status: {
              text: "Bot Search_AT",
              emoji_name: "🤖"
            }
          }),
        });
        
        const response = await fetch(`https://discord.com/api/v10/channels/${botConfig.status_channel_id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botConfig.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            embeds: [announcementEmbed]
          })
        });
        
        console.log(`Discord API response status for announcement: ${response.status}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Discord API error when sending announcement:', errorData);
          return new Response(
            JSON.stringify({ 
              error: 'Discord API Fehler beim Senden der Ankündigung', 
              details: errorData,
              statusCode: response.status
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        const responseData = await response.json();
        console.log('Announcement sent successfully:', JSON.stringify(responseData));
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Ankündigung an Discord gesendet',
            messageId: responseData.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.error('Error sending announcement to Discord:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Fehler beim Senden der Ankündigung an Discord', 
            details: error.message,
            stack: error.stack
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Helper function to perform status update
    async function performStatusUpdate(supabaseClient: any, botConfig: BotConfig) {
      console.log('Performing status update...');
      
      // Fetch all services
      const { data: services, error: servicesError } = await supabaseClient
        .from('services')
        .select('*');

      if (servicesError) {
        throw new Error(`Error fetching services: ${servicesError.message}`);
      }

      // Determine system status
      let systemStatus = "operational";
      if (services.some((s: any) => s.status === "major_outage")) {
        systemStatus = "outage";
      } else if (services.some((s: any) => ["degraded", "partial_outage"].includes(s.status))) {
        systemStatus = "degraded";
      }

      // Status colors for embeds
      const statusColors: Record<string, number> = {
        operational: 0x57F287, // Green
        degraded: 0xFEE75C,    // Yellow
        partial_outage: 0xFEE75C, // Yellow
        major_outage: 0xED4245, // Red
        maintenance: 0x5865F2   // Blue/Purple
      };

      // Status emojis for text
      const statusEmojis: Record<string, string> = {
        operational: "<:green:1356281396007670025>",
        degraded: "<:reed:1356281418682077234>",
        partial_outage: "<:reed:1356281418682077234>",
        major_outage: "<:reed:1356281418682077234>",
        maintenance: "<:blue:1356281439053807908>"
      };

      // Group services by their group
      const serviceGroups: Record<string, any[]> = {};
      services.forEach((service: any) => {
        if (!serviceGroups[service.service_group]) {
          serviceGroups[service.service_group] = [];
        }
        serviceGroups[service.service_group].push(service);
      });

      // Create embed fields for each service group
      const embedFields = [];
      
      Object.entries(serviceGroups).forEach(([group, groupServices]) => {
        let fieldValue = '';
        groupServices.forEach((service: any) => {
          const emoji = statusEmojis[service.status] || "❓";
          const statusText = service.status === "operational" ? "Betriebsbereit" : 
                           service.status === "degraded" ? "Beeinträchtigt" : 
                           service.status === "partial_outage" ? "Teilausfall" : 
                           service.status === "major_outage" ? "Schwerer Ausfall" : 
                           service.status === "maintenance" ? "Wartung" : "Unbekannt";
          fieldValue += `${emoji} **${service.name}**: ${statusText}\n`;
        });

        embedFields.push({
          name: group,
          value: fieldValue,
          inline: false
        });
      });

      // Create main embed
      const statusTitle = systemStatus === "operational" ? "Alle Systeme betriebsbereit" : 
               systemStatus === "degraded" ? "Einige Systeme beeinträchtigt" : "Systemausfall erkannt";

      const mainEmbed: DiscordEmbed = {
        title: statusTitle,
        description: "Aktuelle Status-Informationen zu allen Diensten",
        color: statusColors[systemStatus] || 0x5865F2,
        fields: embedFields,
        footer: {
          text: `Letztes Update: ${new Date().toLocaleString('de-DE')} • Power by Bot Search_AT`
        },
        timestamp: new Date().toISOString()
      };

      const embeds = [mainEmbed];
      
      // Check if we have an existing message to update
      const { data: lastMessage, error: lastMessageError } = await supabaseClient
        .from('discord_status_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMessageError) {
        console.error('Error fetching last message:', lastMessageError);
      }

      const headers = {
        'Authorization': `Bot ${botConfig.token}`,
        'Content-Type': 'application/json',
      };

      let response;
      let discordApiUrl;
      
      console.log('Preparing to send status update to Discord using embeds');
      
      try {
        // Set Bot Status to DND with custom status "Bot Search_AT"
        const botStatusUrl = 'https://discord.com/api/v10/users/@me/settings';
        const statusResponse = await fetch(botStatusUrl, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ 
            status: 'dnd',
            custom_status: {
              text: "Bot Search_AT",
              emoji_name: "🤖"
            }
          }),
        });
        
        console.log(`Bot status update response: ${statusResponse.status}`);
        
        // If we have a recent message, update it instead of creating a new one
        if (!lastMessageError && lastMessage && (Date.now() - new Date(lastMessage.created_at).getTime()) < 86400000) { // 24 hours
          discordApiUrl = `https://discord.com/api/v10/channels/${botConfig.status_channel_id}/messages/${lastMessage.message_id}`;
          console.log(`Updating existing message: ${lastMessage.message_id} in channel: ${botConfig.status_channel_id}`);
          
          response = await fetch(discordApiUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ embeds }),
          });
        } else {
          // Send a new message
          discordApiUrl = `https://discord.com/api/v10/channels/${botConfig.status_channel_id}/messages`;
          console.log(`Sending new message to channel: ${botConfig.status_channel_id}`);
          
          response = await fetch(discordApiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ embeds }),
          });
        }

        console.log(`Discord API response status: ${response.status}`);
        
        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('Discord API response:', JSON.stringify(responseData));
        } catch (e) {
          console.log('Could not parse response as JSON:', responseText);
          responseData = { text: responseText };
        }
        
        if (!response.ok) {
          console.error('Discord API error:', responseData);
          return { 
            error: 'Discord API Fehler', 
            details: responseData,
            url: discordApiUrl,
            statusCode: response.status,
          };
        }

        // If successful and it's a new message, store the message ID
        if (response.ok && (!lastMessage || (Date.now() - new Date(lastMessage.created_at).getTime()) >= 86400000)) {
          const { error: insertError } = await supabaseClient
            .from('discord_status_messages')
            .insert({
              message_id: responseData.id,
              channel_id: botConfig.status_channel_id,
              content: JSON.stringify(embeds)
            });

          if (insertError) {
            console.error('Error storing message ID:', insertError);
          }
        }

        // Update the last known status
        lastKnownStatus = {
          status: systemStatus as SystemStatus["status"],
          updatedAt: new Date().toISOString()
        };

        // Update lastEmbedUpdateTime
        lastEmbedUpdateTime = new Date();

        return { 
          success: true, 
          message: 'Status-Update an Discord gesendet',
          messageId: responseData.id,
          updateTime: lastEmbedUpdateTime
        };
      } catch (error: any) {
        console.error('Error sending to Discord:', error);
        throw error;
      }
    }

    // Default response for unknown endpoints
    return new Response(
      JSON.stringify({ error: 'Ungültige Aktion', providedAction: action }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Interner Serverfehler', details: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
