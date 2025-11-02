import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { WorkoutSummary } from "@/components/WorkoutSummary";
import { Dumbbell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const { events, loading, error } = useCalendarEvents(isConnected);

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
