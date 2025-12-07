import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface WorkoutRecommendation {
  day: string;
  time: string;
  duration: string;
}

interface WorkoutSummaryProps {
  recommendations?: WorkoutRecommendation[];
  onConnectionChange?: (connected: boolean) => void;
}

export const WorkoutSummary = ({ recommendations = [], onConnectionChange }: WorkoutSummaryProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check current auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user?.email || null);
    });

    // Check if calendar is already connected
    const checkConnection = async () => {
      const { data, error } = await supabase
        .from('google_calendar_connection')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Calendar connection check error:', error.message);
      }
      
      const connected = !!data;
      setIsConnected(connected);
      onConnectionChange?.(connected);
    };
    checkConnection();

    return () => subscription.unsubscribe();

    // Check for successful connection callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar_connected') === 'true') {
      const email = params.get('email');
      
      if (email) {
        // Sign in with OTP to the email
        supabase.auth.signInWithOtp({
          email: decodeURIComponent(email),
          options: {
            shouldCreateUser: false,
          }
        }).then(({ error }) => {
          if (error) {
            console.error('Sign in error:', error);
            toast({
              title: "Calendar connected!",
              description: "Your calendar is connected. Please check your email to complete sign in.",
            });
          } else {
            toast({
              title: "Check your email",
              description: "We've sent you a sign-in link to access your calendar.",
            });
          }
          setIsConnected(true);
          onConnectionChange?.(true);
          window.history.replaceState({}, '', window.location.pathname);
        });
      }
    }
  }, [onConnectionChange]);

  const handleConnectCalendar = async () => {
    // If already connected, clear the connection first
    if (isConnected) {
      const { error } = await supabase
        .from('google_calendar_connection')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (error) {
        console.error('Error clearing connection:', error);
        toast({
          title: "Error",
          description: "Failed to clear connection. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      setIsConnected(false);
      onConnectionChange?.(false);
      toast({
        title: "Calendar disconnected",
        description: "You can now reconnect your calendar.",
      });
      return;
    }
    
    setIsConnecting(true);
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '527176247821-hgkc2991uhmgkm1vt7dmqm5qvco3lslb.apps.googleusercontent.com';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;
    // Include both calendar and auth scopes
    const scope = 'openid email profile https://www.googleapis.com/auth/calendar.readonly';
    
    // Pass both origin and access token in state (if available)
    const stateData = {
      origin: window.location.origin
    };
    const state = encodeURIComponent(JSON.stringify(stateData));
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;
    
    // Redirect in the same window
    window.location.href = authUrl;
  };

  return (
    <Card className="p-6 space-y-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">Weekly Workout Plan</h3>
          <p className="text-sm text-muted-foreground">
            {recommendations.length} sessions • {(recommendations.length * 1.5).toFixed(1)} hours total
          </p>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Optimized</span>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.length > 0 ? (
          recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-medium">{rec.day}</div>
                  <div className="text-sm text-muted-foreground">{rec.time}</div>
                </div>
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {rec.duration}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-4">
            Connect your calendar to see personalized recommendations
          </div>
        )}
      </div>

      <div className="pt-4 border-t space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-accent" />
          <span className="text-muted-foreground">
            No consecutive workout days • Perfect spacing
          </span>
        </div>

        {userEmail && !isConnected && (
          <div className="flex items-center gap-2 text-sm bg-secondary/50 p-3 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm uppercase">
              {userEmail.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="font-medium truncate">{userEmail}</p>
            </div>
          </div>
        )}

        <Button 
          variant="hero" 
          className="w-full" 
          size="lg"
          onClick={handleConnectCalendar}
          disabled={isConnecting}
        >
          <Calendar className="h-4 w-4" />
          {isConnected ? 'Disconnect Calendar' : isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
        </Button>
      </div>
    </Card>
  );
};
