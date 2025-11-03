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
    const stateParam = url.searchParams.get('state');
    
    let redirectOrigin = url.origin;
    let userAccessToken = null;
    
    // Parse state to get origin and access token
    if (stateParam) {
      try {
        const stateData = JSON.parse(decodeURIComponent(stateParam));
        redirectOrigin = stateData.origin || url.origin;
        userAccessToken = stateData.accessToken;
      } catch {
        // Fallback to treating state as just the origin (backward compatibility)
        redirectOrigin = decodeURIComponent(stateParam);
      }
    }

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

    if (!tokens.access_token) {
      console.error('No access token in response');
      throw new Error('No access token received');
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info from Google');
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();
    console.log('Got user info:', { email: userInfo.email });

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Sign in or create user with Supabase using Google email
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userInfo.email,
      email_confirm: true,
      user_metadata: {
        name: userInfo.name,
        avatar_url: userInfo.picture,
        google_id: userInfo.id,
      },
    });

    let userId: string | null = null;

    if (authError) {
      // User might already exist - check for email_exists code or "already registered" message
      if (authError.code === 'email_exists' || authError.message.includes('already registered')) {
        console.log('User already exists, finding user...');
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === userInfo.email);
        userId = existingUser?.id || null;
      } else {
        console.error('Auth error:', authError);
        throw new Error('Authentication failed');
      }
    } else {
      userId = authData?.user?.id || null;
    }

    if (!userId) {
      console.error('Could not get user ID');
      throw new Error('User ID not found');
    }

    // Calculate token expiry time
    const expiresIn = tokens.expires_in || 3600;
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Store calendar tokens
    const { error: dbError } = await supabase
      .from('google_calendar_connection')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        token_expiry: tokenExpiry,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store calendar connection');
    }

    console.log('Successfully stored calendar connection for user:', userId);

    // Generate access link for the user
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userInfo.email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Link generation error:', linkError);
      return Response.redirect(`${redirectOrigin}/?error=session_failed`);
    }

    // Extract tokens from the hashed_token
    // For now, redirect back and let the frontend handle sign-in
    return Response.redirect(`${redirectOrigin}/?calendar_connected=true&email=${encodeURIComponent(userInfo.email)}`);

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
