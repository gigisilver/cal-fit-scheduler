import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, TrendingUp } from "lucide-react";

const recommendations = [
  { day: "Monday", time: "11:00 AM", duration: "1h 30m" },
  { day: "Wednesday", time: "1:00 PM", duration: "1h 30m" },
  { day: "Friday", time: "2:00 PM", duration: "1h 30m" },
  { day: "Saturday", time: "10:00 AM", duration: "1h 30m" },
];

export const WorkoutSummary = () => {
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

        <Button variant="hero" className="w-full" size="lg">
          <Calendar className="h-4 w-4" />
          Connect Google Calendar
        </Button>
      </div>
    </Card>
  );
};
