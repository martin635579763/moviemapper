
"use client";

import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Film, ScheduleEntry } from '@/data/films';
import { Clock, Building, CalendarDays, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
// No longer need useLayoutContext or sampleLayouts here as schedule comes pre-filtered

interface FilmScheduleDialogProps {
  film: Film;
  children: ReactNode; // The trigger element
}

export const FilmScheduleDialog: React.FC<FilmScheduleDialogProps> = ({ film, children }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // The film.schedule is now dynamically generated to only include available halls.
  // So, we just need to group it.
  const groupedSchedule = useMemo(() => {
    if (!film.schedule || film.schedule.length === 0) return {};

    return film.schedule.reduce((acc, entry) => {
      if (!acc[entry.day]) {
        acc[entry.day] = [];
      }
      acc[entry.day].push(entry);
      return acc;
    }, {} as Record<string, ScheduleEntry[]>);
  }, [film.schedule]); // Depends only on the film's schedule

  const hasAnyValidShowtimes = useMemo(() => {
    return Object.values(groupedSchedule).some(entries => entries.length > 0);
  }, [groupedSchedule]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild onClick={() => setDialogOpen(true)}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{film.title} - Schedule</DialogTitle>
          <DialogDescription>
            Select a showtime and hall to proceed to ticket booking. Schedules are based on currently available halls.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid gap-6 py-4 max-h-[60vh] overflow-y-auto">
          {hasAnyValidShowtimes ? (
            Object.entries(groupedSchedule).map(([day, entries]) => {
              if (entries.length === 0) return null; // Should not happen if schedule is pre-filtered

              return (
                <div key={day}>
                  <h4 className="font-semibold mb-3 text-lg flex items-center text-primary">
                    <CalendarDays className="w-5 h-5 mr-2" /> {day}
                  </h4>
                  <ul className="space-y-2 pl-1">
                    {entries.map((entry, idx) => (
                      <li key={idx}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-auto p-3 hover:bg-muted/80 transition-colors group"
                          asChild
                          onClick={() => setDialogOpen(false)} 
                        >
                          <Link href={`/film/${film.id}?hall=${encodeURIComponent(entry.hallName)}&day=${encodeURIComponent(entry.day)}&time=${encodeURIComponent(entry.time)}`} >
                            <div className="flex items-center text-sm w-full">
                              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                              <span className="font-medium text-foreground">{entry.time}</span>
                              <span className="mx-2 text-xs text-muted-foreground">in</span>
                              <Building className="w-4 h-4 mr-1 text-muted-foreground" />
                              <span className="font-medium text-foreground flex-1">{entry.hallName}</span>
                              <Ticket className="w-4 h-4 ml-auto text-primary opacity-75 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No schedule currently available for this film based on known halls. Please check back later or ensure halls are configured.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
