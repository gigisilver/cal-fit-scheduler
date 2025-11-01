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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');

    if (error) {
      console.error('OAuth error:', error);
      return new Response(
        JSON.stringify({ error: 'OAuth authorization failed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${supabaseUrl}/functions/v1/google-oauth-callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    console.log('Successfully obtained tokens');

    // Calculate token expiry time
    const expiresIn = tokens.expires_in || 3600;
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Store tokens in database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: dbError } = await supabase
      .from('google_calendar_connection')
      .insert({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokenExpiry,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store tokens');
    }

    console.log('Tokens stored successfully');

    // Redirect back to the app with success
    const redirectUrl = state ? decodeURIComponent(state) : url.origin;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${redirectUrl}/?calendar_connected=true`,
      },
    });

  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
