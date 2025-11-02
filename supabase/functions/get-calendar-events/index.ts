import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    // Create client with user's JWT for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Get the user's calendar connection (RLS will filter automatically)
    const { data: connection, error: dbError } = await supabase
      .from('google_calendar_connection')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dbError || !connection) {
      console.error('No calendar connection found:', dbError);
      return new Response(
        JSON.stringify({ error: 'Calendar not connected' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    let accessToken = connection.access_token;
    const tokenExpiry = new Date(connection.token_expiry);

    // Check if token is expired and refresh if needed
    if (tokenExpiry < new Date()) {
      console.log('Token expired, refreshing...');
      
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh access token');
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;

      const newExpiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

      // Update token in database
      await supabase
        .from('google_calendar_connection')
        .update({
          access_token: tokens.access_token,
          token_expiry: newExpiry,
        })
        .eq('id', connection.id);

      console.log('Token refreshed successfully');
    }

    // Fetch calendar events for the next 7 days
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    const calendarUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    calendarUrl.searchParams.append('timeMin', timeMin.toISOString());
    calendarUrl.searchParams.append('timeMax', timeMax.toISOString());
    calendarUrl.searchParams.append('singleEvents', 'true');
    calendarUrl.searchParams.append('orderBy', 'startTime');

    const eventsResponse = await fetch(calendarUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!eventsResponse.ok) {
      const errorData = await eventsResponse.text();
      console.error('Failed to fetch events:', errorData);
      throw new Error('Failed to fetch calendar events');
    }

    const eventsData = await eventsResponse.json();
    console.log(`Successfully fetched ${eventsData.items?.length || 0} events`);

    return new Response(
      JSON.stringify({ 
        events: eventsData.items || [],
        connected: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        connected: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
