import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { WorkoutSummary } from "@/components/WorkoutSummary";
import { Dumbbell } from "lucide-react";
import heroImage from "@/assets/hero-gym.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-[var(--gradient-hero)]">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-elegant)]">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">FitScheduler</h1>
              <p className="text-sm text-muted-foreground">Smart workout scheduling</p>
            </div>
          </div>

          <div className="relative h-48 rounded-2xl overflow-hidden shadow-[var(--shadow-elegant)] mb-8">
            <img
              src={heroImage}
              alt="Modern gym environment"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-accent/60 flex items-center justify-center">
              <div className="text-center text-white space-y-2">
                <h2 className="text-2xl md:text-4xl font-bold">
                  Find Your Perfect Workout Times
                </h2>
                <p className="text-sm md:text-lg opacity-90">
                  AI-powered scheduling that fits your life
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12 space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WeeklyCalendar />
          </div>
          <div className="lg:col-span-1">
            <WorkoutSummary />
          </div>
        </div>

        {/* Info Section */}
        <div className="max-w-3xl mx-auto text-center space-y-4 pt-8">
          <h3 className="text-xl font-bold">How It Works</h3>
          <div className="grid gap-4 md:grid-cols-3 text-left">
            <div className="p-4 rounded-lg bg-card shadow-[var(--shadow-card)]">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-3">
                1
              </div>
              <h4 className="font-semibold mb-2">Connect Calendar</h4>
              <p className="text-sm text-muted-foreground">
                Link your Google Calendar to analyze your schedule
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card shadow-[var(--shadow-card)]">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-3">
                2
              </div>
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Smart algorithm finds optimal 90-minute slots
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card shadow-[var(--shadow-card)]">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-3">
                3
              </div>
              <h4 className="font-semibold mb-2">Stay Consistent</h4>
              <p className="text-sm text-muted-foreground">
                4 weekly workouts, never back-to-back days
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
