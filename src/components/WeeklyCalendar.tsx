import { Card } from "@/components/ui/card";
import { Calendar, Clock, Dumbbell } from "lucide-react";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { format, parseISO, startOfWeek, addDays, differenceInMinutes } from "date-fns";

interface TimeSlot {
  day: string;
  date: string;
  events: { time: string; title: string; duration: number }[];
  recommendedWorkout?: { time: string; duration: number };
}

interface WeeklyCalendarProps {
  calendarEvents?: CalendarEvent[];
}

const mockWeekData: TimeSlot[] = [
  {
    day: "Monday",
    date: "Nov 4",
    events: [
      { time: "9:00 AM", title: "Team Meeting", duration: 60 },
      { time: "2:00 PM", title: "Project Review", duration: 90 },
    ],
    recommendedWorkout: { time: "11:00 AM", duration: 90 },
  },
  {
    day: "Tuesday",
    date: "Nov 5",
    events: [
      { time: "10:00 AM", title: "Client Call", duration: 45 },
      { time: "3:00 PM", title: "Workshop", duration: 120 },
    ],
  },
  {
    day: "Wednesday",
    date: "Nov 6",
    events: [
      { time: "9:30 AM", title: "Sprint Planning", duration: 90 },
    ],
    recommendedWorkout: { time: "1:00 PM", duration: 90 },
  },
  {
    day: "Thursday",
    date: "Nov 7",
    events: [
      { time: "11:00 AM", title: "Design Review", duration: 60 },
      { time: "4:00 PM", title: "1-on-1", duration: 30 },
    ],
  },
  {
    day: "Friday",
    date: "Nov 8",
    events: [
      { time: "10:00 AM", title: "All Hands", duration: 60 },
    ],
    recommendedWorkout: { time: "2:00 PM", duration: 90 },
  },
  {
    day: "Saturday",
    date: "Nov 9",
    events: [],
    recommendedWorkout: { time: "10:00 AM", duration: 90 },
  },
  {
    day: "Sunday",
    date: "Nov 10",
    events: [
      { time: "11:00 AM", title: "Brunch", duration: 120 },
    ],
  },
];

export const WeeklyCalendar = ({ calendarEvents = [] }: WeeklyCalendarProps) => {
  // Find available workout slots avoiding conflicts
  const findWorkoutSlot = (date: Date, events: { time: string; duration: number }[]): { time: string; duration: number } | undefined => {
    const workoutDuration = 90; // 90 minute workout
    
    // Load user preferences from localStorage
    const saved = localStorage.getItem("workoutPreferences");
    let preferredStartHour = 10; // default 10 AM
    let preferredEndHour = 20;   // default 8 PM
    
    if (saved) {
      const { startTime, endTime } = JSON.parse(saved);
      const [startHour] = startTime.split(':').map(Number);
      const [endHour] = endTime.split(':').map(Number);
      preferredStartHour = startHour;
      preferredEndHour = endHour;
    }

    const slotStart = preferredStartHour * 60;
    const slotEnd = preferredEndHour * 60;

    // Convert events to time blocks (in minutes from midnight)
    const parseToMinutes = (t: string) => {
      const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const busyBlocks = events
      .map(e => {
        const m = parseToMinutes(e.time);
        if (m === null) return null;
        return {
          start: m,
          end: m + e.duration,
        };
      })
      .filter((b): b is { start: number; end: number } => b !== null);

    // Try to find a slot within user's preferred time window
    for (let time = slotStart; time <= slotEnd - workoutDuration; time += 30) {
      const workoutEnd = time + workoutDuration;
      
      // Check if workout overlaps with any event (proper interval overlap)
      const hasConflict = busyBlocks.some(block => 
        time < block.end && workoutEnd > block.start
      );
      
      if (!hasConflict) {
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return {
          time: `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`,
          duration: workoutDuration,
        };
      }
    }
    
    return undefined;
  };

  // Generate week data from actual calendar events or use mock data (only 4 non-consecutive workout days)
  const generateWeekData = (): TimeSlot[] => {
    const windowStart = new Date();
    
    if (calendarEvents.length === 0) {
      return mockWeekData;
    }

    const allDaysWithSlots = [];

    // First, generate all days with available slots
    for (let i = 0; i < 7; i++) {
      const date = addDays(windowStart, i);
      const dayEvents = calendarEvents
        .filter(event => {
          if (!event.start) return false;
          const eventDate = parseISO(event.start);
          return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        })
        .map(event => {
          const start = parseISO(event.start);
          const end = event.end ? parseISO(event.end) : start;
          return {
            time: format(start, 'h:mm a'),
            title: event.summary || 'Untitled Event',
            duration: differenceInMinutes(end, start),
          };
        })
        .sort((a, b) => a.time.localeCompare(b.time));

      const workoutSlot = findWorkoutSlot(date, dayEvents.map(e => ({ time: e.time, duration: e.duration })));
      
      allDaysWithSlots.push({
        day: format(date, 'EEEE'),
        date: format(date, 'MMM d'),
        events: dayEvents,
        recommendedWorkout: workoutSlot,
        dayIndex: i,
      });
    }

    // Select 4 non-consecutive days with workout recommendations
    const selectedWorkoutDays = new Set<number>();
    for (let i = 0; i < allDaysWithSlots.length; i++) {
      if (allDaysWithSlots[i].recommendedWorkout) {
        const isConsecutive = Array.from(selectedWorkoutDays).some(
          selectedDay => Math.abs(selectedDay - i) === 1
        );
        
        if (!isConsecutive) {
          selectedWorkoutDays.add(i);
          if (selectedWorkoutDays.size === 4) break;
        }
      }
    }

    // Remove workout recommendations from non-selected days
    return allDaysWithSlots.map((day, idx) => ({
      ...day,
      recommendedWorkout: selectedWorkoutDays.has(idx) ? day.recommendedWorkout : undefined,
    }));
  };

  const weekData = generateWeekData();
  const windowStart = new Date();
  const windowEnd = addDays(windowStart, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Your Week</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{format(windowStart, 'MMM d')} - {format(windowEnd, 'MMM d, yyyy')}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-4 min-w-max">
          {weekData.map((slot) => (
            <Card
              key={slot.day}
              className="p-4 space-y-3 hover:shadow-[var(--shadow-card)] transition-shadow min-w-[150px]"
            >
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">{slot.day}</h3>
              <p className="text-xs text-muted-foreground">{slot.date}</p>
            </div>

            <div className="space-y-2">
              {(() => {
                // Convert 12-hour time to minutes for sorting
                const timeToMinutes = (time: string) => {
                  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                  if (!match) return 0;
                  let hours = parseInt(match[1]);
                  const minutes = parseInt(match[2]);
                  const period = match[3].toUpperCase();
                  
                  if (period === 'PM' && hours !== 12) hours += 12;
                  if (period === 'AM' && hours === 12) hours = 0;
                  
                  return hours * 60 + minutes;
                };

                // Merge events and workout recommendation, then sort by time
                const allItems = [
                  ...slot.events.map(e => ({ ...e, isWorkout: false })),
                  ...(slot.recommendedWorkout ? [{ 
                    time: slot.recommendedWorkout.time, 
                    title: 'Workout', 
                    duration: slot.recommendedWorkout.duration,
                    isWorkout: true 
                  }] : [])
                ].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

                return allItems.map((item, idx) => 
                  item.isWorkout ? (
                    <div 
                      key={`workout-${idx}`}
                      className="p-3 rounded-md bg-primary/10 border-2 border-primary text-primary space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <Dumbbell className="h-4 w-4" />
                        <span className="font-semibold text-xs">Recommended</span>
                      </div>
                      <div className="font-medium">{item.time}</div>
                      <div className="text-xs opacity-90">
                        {item.duration}min workout
                      </div>
                    </div>
                  ) : (
                    <div
                      key={`event-${idx}`}
                      className="p-2 rounded-md bg-secondary text-xs space-y-1"
                    >
                      <div className="font-medium">{item.time}</div>
                      <div className="text-muted-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.duration}min
                      </div>
                    </div>
                  )
                );
              })()}
            </div>
          </Card>
        ))}
      </div>
    </div>
    </div>
  );
};
