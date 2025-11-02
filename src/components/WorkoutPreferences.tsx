import { useState, useEffect } from "react";
import { Clock, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface WorkoutPreferencesProps {
  onPreferencesChange?: (startHour: number, endHour: number) => void;
}

export const WorkoutPreferences = ({ onPreferencesChange }: WorkoutPreferencesProps) => {
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("20:00");
  const { toast } = useToast();

  useEffect(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem("workoutPreferences");
    if (saved) {
      const { startTime: savedStart, endTime: savedEnd } = JSON.parse(saved);
      setStartTime(savedStart);
      setEndTime(savedEnd);
      
      // Notify parent of loaded preferences
      if (onPreferencesChange) {
        const [startHour] = savedStart.split(':').map(Number);
        const [endHour] = savedEnd.split(':').map(Number);
        onPreferencesChange(startHour, endHour);
      }
    }
  }, []);

  const handleSave = () => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes >= endMinutes) {
      toast({
        title: "Invalid time range",
        description: "Start time must be before end time",
        variant: "destructive",
      });
      return;
    }
    
    if (endMinutes - startMinutes < 90) {
      toast({
        title: "Time window too small",
        description: "Please allow at least 90 minutes for workouts",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem("workoutPreferences", JSON.stringify({ startTime, endTime }));
    
    if (onPreferencesChange) {
      onPreferencesChange(startHour, endHour);
    }
    
    toast({
      title: "Preferences saved",
      description: "Your workout time window has been updated",
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Workout Time Preferences</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-time">Earliest Workout Time</Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="end-time">Latest Workout Time</Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>
      
      <Button onClick={handleSave} className="w-full md:w-auto">
        <Save className="h-4 w-4 mr-2" />
        Save Preferences
      </Button>
    </Card>
  );
};
