
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
}

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

    // Endpoint to initialize and update services in Discord
    if (action === 'update-status') {
      // Get bot configuration from database
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
      
      if (!botConfig.enabled) {
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

      // Fetch all services
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
      let systemStatus = "operational";
      if (services.some(s => s.status === "major_outage")) {
        systemStatus = "outage";
      } else if (services.some(s => ["degraded", "partial_outage"].includes(s.status))) {
        systemStatus = "degraded";
      }

      // Status colors for embeds
      const statusColors = {
        operational: 0x57F287, // Green
        degraded: 0xFEE75C,    // Yellow
        partial_outage: 0xFEE75C, // Yellow
        major_outage: 0xED4245, // Red
        maintenance: 0x5865F2   // Blue/Purple
      };

      // Status emojis for text
      const statusEmojis = {
        operational: "🟢",
        degraded: "🟠",
        partial_outage: "🟠",
        major_outage: "🔴",
        maintenance: "🔧"
      };

      // Group services by their group
      const serviceGroups: Record<string, any[]> = {};
      services.forEach(service => {
        if (!serviceGroups[service.service_group]) {
          serviceGroups[service.service_group] = [];
        }
        serviceGroups[service.service_group].push(service);
      });

      // Create embed fields for each service group
      const embedFields = [];
      
      Object.entries(serviceGroups).forEach(([group, groupServices]) => {
        let fieldValue = '';
        groupServices.forEach(service => {
          const emoji = statusEmojis[service.status as keyof typeof statusEmojis] || "❓";
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
      const mainEmbed: DiscordEmbed = {
        title: systemStatus === "operational" ? "Alle Systeme betriebsbereit" : 
               systemStatus === "degraded" ? "Einige Systeme beeinträchtigt" : "Systemausfall erkannt",
        description: "Aktuelle Status-Informationen zu allen Diensten",
        color: statusColors[systemStatus as keyof typeof statusColors] || 0x5865F2,
        fields: embedFields,
        footer: {
          text: `Letztes Update: ${new Date().toLocaleString('de-DE')} • Weitere Details auf lovable.dev`
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
          return new Response(
            JSON.stringify({ 
              error: 'Discord API Fehler', 
              details: responseData,
              url: discordApiUrl,
              statusCode: response.status,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
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

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Status-Update an Discord gesendet',
            messageId: responseData.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.error('Error sending to Discord:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Fehler beim Senden des Status an Discord', 
            details: error.message,
            stack: error.stack
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Endpoint to test the bot connection
    if (action === 'test-connection') {
      const { token, guild_id, channel_id } = requestData;
      
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: 'Bot-Token ist erforderlich' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      if (!channel_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Channel-ID ist erforderlich' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      try {
        console.log('Testing Discord connection with token and channel:', token.substring(0, 5) + '...', channel_id);
        
        // Test the connection by getting the bot's user information
        const botResponse = await fetch('https://discord.com/api/v10/users/@me', {
          headers: {
            'Authorization': `Bot ${token}`
          }
        });
        
        const botResponseText = await botResponse.text();
        let botData;
        try {
          botData = JSON.parse(botResponseText);
          console.log('Bot data retrieved:', JSON.stringify(botData));
        } catch (e) {
          console.error('Failed to parse bot response:', botResponseText);
          botData = { text: botResponseText };
        }
        
        if (!botResponse.ok) {
          console.error('Bot authentication failed:', botData);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Ungültiger Bot-Token', 
              details: botData,
              statusCode: botResponse.status
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        // Check if channel exists and we have permission to post in it
        const channelResponse = await fetch(`https://discord.com/api/v10/channels/${channel_id}`, {
          headers: {
            'Authorization': `Bot ${token}`
          }
        });
        
        const channelResponseText = await channelResponse.text();
        let channelData;
        try {
          channelData = JSON.parse(channelResponseText);
          console.log('Channel data retrieved:', JSON.stringify(channelData));
        } catch (e) {
          console.error('Failed to parse channel response:', channelResponseText);
          channelData = { text: channelResponseText };
        }
        
        if (!channelResponse.ok) {
          console.error('Channel access failed:', channelData);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Kanal nicht gefunden oder Bot hat keinen Zugriff',
              details: channelData,
              statusCode: channelResponse.status,
              bot: botData
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        // Test sending a simple embed to the channel
        const testEmbed: DiscordEmbed = {
          title: "Verbindungstest",
          description: "Der Bot hat erfolgreich eine Verbindung hergestellt!",
          color: 0x57F287, // Green
          footer: {
            text: "Dieser Test wurde automatisch generiert."
          },
          timestamp: new Date().toISOString()
        };
        
        const testResponse = await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            embeds: [testEmbed]
          })
        });
        
        if (!testResponse.ok) {
          const testErrorText = await testResponse.text();
          let testErrorData;
          try {
            testErrorData = JSON.parse(testErrorText);
          } catch (e) {
            testErrorData = { text: testErrorText };
          }
          
          console.error('Test message failed:', testErrorData);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Fehler beim Senden der Testnachricht',
              details: testErrorData,
              statusCode: testResponse.status,
              bot: botData,
              channel: channelData
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        const testResponseData = await testResponse.json();
        console.log('Test message sent:', JSON.stringify(testResponseData));
        
        console.log('Connection test successful');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Bot-Verbindung erfolgreich und Testnachricht gesendet', 
            bot: botData,
            channel: channelData,
            testMessage: testResponseData
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.error('Error testing Discord connection:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Fehler bei der Verbindung zu Discord', 
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
      
      // Get bot configuration from database
      const { data: configData, error: configError } = await supabaseClient
        .from('discord_bot_config')
        .select('*')
        .maybeSingle();

      if (configError || !configData) {
        console.error('Error fetching bot config:', configError);
        return new Response(
          JSON.stringify({ error: 'Bot-Konfiguration nicht gefunden', details: configError?.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      const botConfig = configData as BotConfig;
      
      if (!botConfig.enabled) {
        console.log('Bot is disabled, not sending announcement');
        return new Response(
          JSON.stringify({ message: 'Bot ist deaktiviert' }),
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
