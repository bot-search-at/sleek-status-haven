
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

    console.log('Received action:', action, 'with data:', JSON.stringify({
      ...requestData,
      token: requestData.token ? '***REDACTED***' : undefined
    }));

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
          JSON.stringify({ error: 'Bot configuration not found', details: configError?.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      const botConfig = configData as BotConfig;
      
      if (!botConfig.enabled) {
        console.log('Bot is disabled, not sending status update');
        return new Response(
          JSON.stringify({ message: 'Bot is disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (!botConfig.token || !botConfig.status_channel_id) {
        console.error('Missing required bot configuration:', {
          hasToken: !!botConfig.token,
          hasChannelId: !!botConfig.status_channel_id,
        });
        return new Response(
          JSON.stringify({ error: 'Incomplete bot configuration' }),
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
          JSON.stringify({ error: 'Failed to fetch services', details: servicesError.message }),
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
        console.log('Preparing to send status update to Discord');
        
        // Check if we have an existing message to update
        const { data: lastMessage, error: lastMessageError } = await supabaseClient
          .from('discord_status_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // Using maybeSingle instead of single to prevent error when no message exists

        if (lastMessageError) {
          console.error('Error fetching last message:', lastMessageError);
        }

        const headers = {
          'Authorization': `Bot ${botConfig.token}`,
          'Content-Type': 'application/json',
        };

        let response;
        let discordApiUrl;
        
        // If we have a recent message, update it instead of creating a new one
        if (!lastMessageError && lastMessage && (Date.now() - new Date(lastMessage.created_at).getTime()) < 86400000) { // 24 hours
          discordApiUrl = `https://discord.com/api/v10/channels/${botConfig.status_channel_id}/messages/${lastMessage.message_id}`;
          console.log(`Updating existing message: ${lastMessage.message_id} in channel: ${botConfig.status_channel_id}`);
          
          response = await fetch(discordApiUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ content: messageContent }),
          });
        } else {
          // Send a new message
          discordApiUrl = `https://discord.com/api/v10/channels/${botConfig.status_channel_id}/messages`;
          console.log(`Sending new message to channel: ${botConfig.status_channel_id}`);
          
          response = await fetch(discordApiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ content: messageContent }),
          });
        }

        console.log(`Discord API response status: ${response.status}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Discord API error:', errorData);
          return new Response(
            JSON.stringify({ 
              error: 'Discord API error', 
              details: errorData,
              url: discordApiUrl,
              statusCode: response.status,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        const responseData = await response.json();
        console.log('Discord API success, message ID:', responseData.id);

        // If successful and it's a new message, store the message ID
        if (response.ok && (!lastMessage || (Date.now() - new Date(lastMessage.created_at).getTime()) >= 86400000)) {
          const { error: insertError } = await supabaseClient
            .from('discord_status_messages')
            .insert({
              message_id: responseData.id,
              channel_id: botConfig.status_channel_id,
              content: messageContent
            });

          if (insertError) {
            console.error('Error storing message ID:', insertError);
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Status update sent to Discord',
            messageId: responseData.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error) {
        console.error('Error sending to Discord:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send status to Discord', 
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
          const errorText = await botResponse.text();
          console.error('Bot authentication failed:', errorText);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Invalid bot token', 
              details: errorText,
              statusCode: botResponse.status
            }),
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
          const errorText = await channelResponse.text();
          console.error('Channel access failed:', errorText);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Channel not found or bot does not have access to it',
              details: errorText,
              statusCode: channelResponse.status,
              bot: botData
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Return 200 with error info for the frontend
          );
        }
        
        const channelData = await channelResponse.json();
        console.log('Channel data retrieved:', channelData);
        
        console.log('Connection test successful');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Bot connection successful', 
            bot: botData,
            channel: channelData
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error) {
        console.error('Error testing Discord connection:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to test Discord connection', 
            details: error.message,
            stack: error.stack
          }),
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
      JSON.stringify({ error: 'Internal server error', details: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Return 200 with error info for the frontend
    );
  }
});
