
"use client";

import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Film, ScheduleEntry } from '@/data/films';
import { Clock, Building, CalendarDays } from 'lucide-react';

interface FilmScheduleDialogProps {
  film: Film;
  children: ReactNode; // The trigger element
}

export const FilmScheduleDialog: React.FC<FilmScheduleDialogProps> = ({ film, children }) => {
  const groupedSchedule = film.schedule?.reduce((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = [];
    }
    acc[entry.day].push(entry);
    return acc;
  }, {} as Record<string, ScheduleEntry[]>);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{film.title} - Schedule</DialogTitle>
          <DialogDescription>
            Showing times and hall information.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid gap-6 py-4">
          {groupedSchedule && Object.keys(groupedSchedule).length > 0 ? (
            Object.entries(groupedSchedule).map(([day, entries]) => (
              <div key={day}>
                <h4 className="font-semibold mb-3 text-lg flex items-center text-primary">
                  <CalendarDays className="w-5 h-5 mr-2" /> {day}
                </h4>
                <ul className="space-y-2 pl-1">
                  {entries.map((entry, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="font-medium text-foreground">{entry.time}</span>
                      <span className="mx-2 text-xs">in</span>
                      <Building className="w-4 h-4 mr-1" />
                      <span className="font-medium text-foreground">{entry.hallName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No schedule currently available for this film. Please check back later.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
