import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { WorkoutSummary } from "@/components/WorkoutSummary";
import { Dumbbell, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { events, loading, error } = useCalendarEvents(isConnected);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-hero)]">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/settings")}
                className="rounded-full"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <div className="w-12 h-12 rounded-xl bg-[var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-elegant)]">
                <Dumbbell className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">FitScheduler</h1>
                <p className="text-sm text-muted-foreground">Smart workout scheduling</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate("/auth")}
                >
                  Log In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12 space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WeeklyCalendar 
              calendarEvents={events} 
              loading={loading} 
              error={error}
              isConnected={isConnected}
            />
          </div>
          <div>
            <WorkoutSummary onConnectionChange={setIsConnected} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
