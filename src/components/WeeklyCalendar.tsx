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
      { time: "09:00", title: "Team Meeting", duration: 60 },
      { time: "14:00", title: "Project Review", duration: 90 },
    ],
    recommendedWorkout: { time: "11:00", duration: 90 },
  },
  {
    day: "Tuesday",
    date: "Nov 5",
    events: [
      { time: "10:00", title: "Client Call", duration: 45 },
      { time: "15:00", title: "Workshop", duration: 120 },
    ],
  },
  {
    day: "Wednesday",
    date: "Nov 6",
    events: [
      { time: "09:30", title: "Sprint Planning", duration: 90 },
    ],
    recommendedWorkout: { time: "13:00", duration: 90 },
  },
  {
    day: "Thursday",
    date: "Nov 7",
    events: [
      { time: "11:00", title: "Design Review", duration: 60 },
      { time: "16:00", title: "1-on-1", duration: 30 },
    ],
  },
  {
    day: "Friday",
    date: "Nov 8",
    events: [
      { time: "10:00", title: "All Hands", duration: 60 },
    ],
    recommendedWorkout: { time: "14:00", duration: 90 },
  },
  {
    day: "Saturday",
    date: "Nov 9",
    events: [],
    recommendedWorkout: { time: "10:00", duration: 90 },
  },
  {
    day: "Sunday",
    date: "Nov 10",
    events: [
      { time: "11:00", title: "Brunch", duration: 120 },
    ],
  },
];

export const WeeklyCalendar = ({ calendarEvents = [] }: WeeklyCalendarProps) => {
  // Find available workout slots avoiding conflicts
  const findWorkoutSlot = (date: Date, events: { time: string; duration: number }[]): { time: string; duration: number } | undefined => {
    const workoutDuration = 90; // 90 minute workout
    const preferredSlots = [
      { start: 6, end: 9 },   // Early morning
      { start: 11, end: 14 }, // Midday
      { start: 16, end: 19 }, // Late afternoon
    ];

    // Convert events to time blocks (in minutes from midnight)
    const busyBlocks = events.map(e => {
      const [hours, minutes] = e.time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      return {
        start: startMinutes,
        end: startMinutes + e.duration,
      };
    });

    // Check each preferred slot
    for (const slot of preferredSlots) {
      const slotStart = slot.start * 60;
      const slotEnd = slot.end * 60;
      
      // Check if we can fit a workout in this slot
      for (let time = slotStart; time <= slotEnd - workoutDuration; time += 30) {
        const workoutEnd = time + workoutDuration;
        
        // Check if this time conflicts with any busy blocks
        const hasConflict = busyBlocks.some(block => 
          (time >= block.start && time < block.end) || // Workout starts during event
          (workoutEnd > block.start && workoutEnd <= block.end) || // Workout ends during event
          (time <= block.start && workoutEnd >= block.end) // Workout encompasses event
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
    }
    
    return undefined;
  };

  // Generate week data from actual calendar events or use mock data
  const generateWeekData = (): TimeSlot[] => {
    const windowStart = new Date(); // rolling 7-day window from today
    
    if (calendarEvents.length === 0) {
      return mockWeekData;
    }

    return Array.from({ length: 7 }, (_, i) => {
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
            time: format(start, 'HH:mm'),
            title: event.summary || 'Untitled Event',
            duration: differenceInMinutes(end, start),
          };
        })
        .sort((a, b) => a.time.localeCompare(b.time));

      // Find available workout slot for this day
      const workoutSlot = findWorkoutSlot(date, dayEvents);

      return {
        day: format(date, 'EEEE'),
        date: format(date, 'MMM d'),
        events: dayEvents,
        recommendedWorkout: workoutSlot,
      };
    });
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

      <div className="grid gap-4 md:grid-cols-7">
        {weekData.map((slot) => (
          <Card
            key={slot.day}
            className="p-4 space-y-3 hover:shadow-[var(--shadow-card)] transition-shadow"
          >
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">{slot.day}</h3>
              <p className="text-xs text-muted-foreground">{slot.date}</p>
            </div>

            <div className="space-y-2">
              {(() => {
                // Merge events and workout recommendation, then sort by time
                const allItems = [
                  ...slot.events.map(e => ({ ...e, isWorkout: false })),
                  ...(slot.recommendedWorkout ? [{ 
                    time: slot.recommendedWorkout.time, 
                    title: 'Workout', 
                    duration: slot.recommendedWorkout.duration,
                    isWorkout: true 
                  }] : [])
                ].sort((a, b) => a.time.localeCompare(b.time));

                return allItems.map((item, idx) => 
                  item.isWorkout ? (
                    <div 
                      key={`workout-${idx}`}
                      className="p-3 rounded-md bg-accent text-accent-foreground space-y-1 border-2 border-accent"
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
  );
};
