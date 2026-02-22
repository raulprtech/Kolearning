
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Loader2, Target, Calendar as CalendarIcon } from "lucide-react";

interface RecalibratePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRecalibrate: (objective: string, deadline?: Date) => Promise<void>;
}

export function RecalibratePlanDialog({ isOpen, onClose, onRecalibrate }: RecalibratePlanDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [objective, setObjective] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  const objectiveOptions = [
    "Prepare for an exam",
    "Understand key concepts",
    "Apply this knowledge in a project",
    "Learn something new out of curiosity",
  ];

  const handleConfirm = async () => {
    if (!objective) return;
    setIsLoading(true);
    await onRecalibrate(objective, deadline);
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recalibrate Learning Plan</DialogTitle>
          <DialogDescription>
            Adjust your goals so the Tutor can generate a new roadmap for you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4" />Your new goal</label>
            <Select onValueChange={setObjective} value={objective}>
              <SelectTrigger>
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                {objectiveOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><CalendarIcon className="h-4 w-4" />Do you have a new deadline?</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : <span>Choose a date (optional)</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isLoading || !objective}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Generate New Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
