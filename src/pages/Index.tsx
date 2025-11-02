import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { WorkoutSummary } from "@/components/WorkoutSummary";
import { WorkoutPreferences } from "@/components/WorkoutPreferences";
import { Dumbbell } from "lucide-react";
import heroImage from "@/assets/hero-gym.jpg";
import { useState, useMemo } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { format, parseISO, addDays, differenceInMinutes } from "date-fns";

const Index = () => {
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [preferredStartHour, setPreferredStartHour] = useState(10);
  const [preferredEndHour, setPreferredEndHour] = useState(20);
  const { events } = useCalendarEvents(isCalendarConnected);

  const handlePreferencesChange = (startHour: number, endHour: number) => {
    setPreferredStartHour(startHour);
    setPreferredEndHour(endHour);
  };

  // Calculate workout recommendations from calendar events
  const recommendations = useMemo(() => {
    if (!events || events.length === 0) return [];

    const findWorkoutSlot = (date: Date, dayEvents: { time: string; duration: number }[]): { time: string; duration: number } | undefined => {
      const workoutDuration = 90;
      
      // Use user's preferred time window
      const slotStart = preferredStartHour * 60;
      const slotEnd = preferredEndHour * 60;

      const busyBlocks = dayEvents.map(e => {
        const [hours, minutes] = e.time.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        return { start: startMinutes, end: startMinutes + e.duration };
      });

      // Try to find a slot within user's preferred time window
      for (let time = slotStart; time <= slotEnd - workoutDuration; time += 30) {
        const workoutEnd = time + workoutDuration;
        const hasConflict = busyBlocks.some(block => 
          (time >= block.start && time < block.end) ||
          (workoutEnd > block.start && workoutEnd <= block.end) ||
          (time <= block.start && workoutEnd >= block.end)
        );
        
        if (!hasConflict) {
          const hours = Math.floor(time / 60);
          const minutes = time % 60;
          return {
            time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
            duration: workoutDuration,
          };
        }
      }
      
      return undefined;
    };

    const windowStart = new Date();
    const recs = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(windowStart, i);
      const dayEvents = events
        .filter(event => {
          if (!event.start) return false;
          const eventDate = parseISO(event.start);
          return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        })
        .map(event => {
          const start = parseISO(event.start);
          const end = event.end ? parseISO(event.end) : start;
          return {
            time: format(start, 'HH:mm'),
            duration: differenceInMinutes(end, start),
          };
        });

      const workoutSlot = findWorkoutSlot(date, dayEvents);
      if (workoutSlot) {
        const [hours, minutes] = workoutSlot.time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        recs.push({
          day: format(date, 'EEEE'),
          time: `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`,
          duration: '1h 30m',
        });
      }
    }

    return recs;
  }, [events, preferredStartHour, preferredEndHour]);

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
        <WorkoutPreferences onPreferencesChange={handlePreferencesChange} />
        
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WeeklyCalendar calendarEvents={events} />
          </div>
          <div className="lg:col-span-1">
            <WorkoutSummary 
              recommendations={recommendations}
              onConnectionChange={setIsCalendarConnected} 
            />
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
