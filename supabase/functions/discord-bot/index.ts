
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

    const requestData = await req.json().catch(() => ({}));
    const action = requestData.action || '';

    // Endpoint to initialize and update services in Discord
    if (action === 'update-status') {
      // Get bot configuration from database
      const { data: configData, error: configError } = await supabaseClient
        .from('discord_bot_config')
        .select('*')
        .limit(1)
        .single();

      if (configError || !configData) {
        console.error('Error fetching bot config:', configError);
        return new Response(
          JSON.stringify({ error: 'Bot configuration not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const botConfig = configData as BotConfig;
      
      if (!botConfig.enabled) {
        return new Response(
          JSON.stringify({ message: 'Bot is disabled' }),
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
          JSON.stringify({ error: 'Failed to fetch services' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Determine system status
      let systemStatus = "operational";
      if (services.some(s => s.status === "major_outage")) {
        systemStatus = "outage";
      } else if (services.some(s => ["degraded", "partial_outage"].includes(s.status))) {
        systemStatus = "degraded";
      }

      // Create the message content
      const statusEmojis = {
        operational: "🟢",
        degraded: "🟠",
        partial_outage: "🟠",
        major_outage: "🔴",
        maintenance: "🔧"
      };

      let messageContent = `# Status Update: ${systemStatus === "operational" ? "Alle Systeme betriebsbereit" : 
        systemStatus === "degraded" ? "Einige Systeme beeinträchtigt" : "Systemausfall erkannt"}\n\n`;
      
      // Group services by their group
      const serviceGroups = {};
      services.forEach(service => {
        if (!serviceGroups[service.service_group]) {
          serviceGroups[service.service_group] = [];
        }
        serviceGroups[service.service_group].push(service);
      });

      // Add services grouped by their category
      Object.entries(serviceGroups).forEach(([group, groupServices]) => {
        messageContent += `## ${group}\n`;
        groupServices.forEach(service => {
          const emoji = statusEmojis[service.status] || "❓";
          messageContent += `${emoji} **${service.name}**: ${service.status === "operational" ? "Betriebsbereit" : 
            service.status === "degraded" ? "Beeinträchtigt" : 
            service.status === "partial_outage" ? "Teilausfall" : 
            service.status === "major_outage" ? "Schwerer Ausfall" : 
            service.status === "maintenance" ? "Wartung" : "Unbekannt"}\n`;
        });
        messageContent += "\n";
      });

      // Add footer with timestamp
      messageContent += `\n*Letztes Update: ${new Date().toLocaleString('de-DE')}*\n`;
      messageContent += `*Weitere Details auf der [Statusseite](https://lovable.dev)*`;
      
      // Send message to Discord
      try {
        // Check if we have an existing message to update
        const { data: lastMessage, error: lastMessageError } = await supabaseClient
          .from('discord_status_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // Using maybeSingle instead of single to prevent error when no message exists

        const headers = {
          'Authorization': `Bot ${botConfig.token}`,
          'Content-Type': 'application/json',
        };

        let response;
        
        // If we have a recent message, update it instead of creating a new one
        if (!lastMessageError && lastMessage && (Date.now() - new Date(lastMessage.created_at).getTime()) < 86400000) { // 24 hours
          const updateUrl = `https://discord.com/api/v10/channels/${botConfig.status_channel_id}/messages/${lastMessage.message_id}`;
          response = await fetch(updateUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ content: messageContent }),
          });
        } else {
          // Send a new message
          const sendUrl = `https://discord.com/api/v10/channels/${botConfig.status_channel_id}/messages`;
          response = await fetch(sendUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ content: messageContent }),
          });

          // If successful, store the message ID
          if (response.ok) {
            const messageData = await response.json();
            await supabaseClient
              .from('discord_status_messages')
              .insert({
                message_id: messageData.id,
                channel_id: botConfig.status_channel_id,
                content: messageContent
              });
          }
        }

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Discord API error:', errorData);
          return new Response(
            JSON.stringify({ error: 'Discord API error', details: errorData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Status update sent to Discord' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error) {
        console.error('Error sending to Discord:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to send status to Discord' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Endpoint to test the bot connection
    if (action === 'test-connection') {
      const { token, guild_id, channel_id } = requestData;
      
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: 'Bot token is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      if (!channel_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Channel ID is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
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
        
        if (!botResponse.ok) {
          console.error('Bot authentication failed:', await botResponse.text());
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid bot token' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Return 200 with error info for the frontend
          );
        }
        
        const botData = await botResponse.json();
        console.log('Bot data retrieved:', botData);
        
        // Check if channel exists and we have permission to post in it
        const channelResponse = await fetch(`https://discord.com/api/v10/channels/${channel_id}`, {
          headers: {
            'Authorization': `Bot ${token}`
          }
        });
        
        if (!channelResponse.ok) {
          console.error('Channel access failed:', await channelResponse.text());
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Channel not found or bot does not have access to it',
              bot: botData
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Return 200 with error info for the frontend
          );
        }
        
        console.log('Connection test successful');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Bot connection successful', 
            bot: botData 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error) {
        console.error('Error testing Discord connection:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to test Discord connection: ' + error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Return 200 with error info for the frontend
        );
      }
    }

    // Default response for unknown endpoints
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Return 200 with error info for the frontend
    );
  }
});
