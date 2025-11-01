import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const recommendations = [
  { day: "Monday", time: "11:00 AM", duration: "1h 30m" },
  { day: "Wednesday", time: "1:00 PM", duration: "1h 30m" },
  { day: "Friday", time: "2:00 PM", duration: "1h 30m" },
  { day: "Saturday", time: "10:00 AM", duration: "1h 30m" },
];

export const WorkoutSummary = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
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
      
      if (data) {
        setIsConnected(true);
      }
    };
    checkConnection();

    // Check for successful connection callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar_connected') === 'true') {
      setIsConnected(true);
      toast({
        title: "Calendar connected!",
        description: "Your Google Calendar has been successfully linked.",
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnectCalendar = () => {
    setIsConnecting(true);
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '527176247821-hgkc2991uhmgkm1vt7dmqm5qvco3lslb.apps.googleusercontent.com';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;
    const scope = 'https://www.googleapis.com/auth/calendar.readonly';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    // Open in new window to avoid iframe restrictions
    window.open(authUrl, '_blank', 'width=500,height=600');
  };

  return (
    <Card className="p-6 space-y-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">Weekly Workout Plan</h3>
          <p className="text-sm text-muted-foreground">
            4 sessions • 6 hours total
          </p>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Optimized</span>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
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
        ))}
      </div>

      <div className="pt-4 border-t space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-accent" />
          <span className="text-muted-foreground">
            No consecutive workout days • Perfect spacing
          </span>
        </div>

        <Button 
          variant="hero" 
          className="w-full" 
          size="lg"
          onClick={handleConnectCalendar}
          disabled={isConnecting || isConnected}
        >
          <Calendar className="h-4 w-4" />
          {isConnected ? 'Calendar Connected' : isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
        </Button>
      </div>
    </Card>
  );
};
