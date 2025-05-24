
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
import { useLayoutContext } from '@/contexts/LayoutContext';
import { sampleLayouts } from '@/data/sample-layouts';

interface FilmScheduleDialogProps {
  film: Film;
  children: ReactNode; // The trigger element
}

export const FilmScheduleDialog: React.FC<FilmScheduleDialogProps> = ({ film, children }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { storedLayoutNames } = useLayoutContext();

  const allValidHallNames = useMemo(() => {
    const sampleHallNames = sampleLayouts.map(l => l.name);
    return new Set([...sampleHallNames, ...storedLayoutNames]);
  }, [sampleLayouts, storedLayoutNames]);

  const groupedSchedule = useMemo(() => {
    if (!film.schedule) return {};
    return film.schedule.reduce((acc, entry) => {
      if (!allValidHallNames.has(entry.hallName)) { // Pre-filter entries if hall is not valid
        return acc;
      }
      if (!acc[entry.day]) {
        acc[entry.day] = [];
      }
      acc[entry.day].push(entry);
      return acc;
    }, {} as Record<string, ScheduleEntry[]>);
  }, [film.schedule, allValidHallNames]);

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
            Select a showtime and hall to proceed to ticket booking. Only showtimes in available halls are listed.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid gap-6 py-4 max-h-[60vh] overflow-y-auto">
          {hasAnyValidShowtimes ? (
            Object.entries(groupedSchedule).map(([day, entries]) => {
              if (entries.length === 0) return null; // Skip day if no valid entries after initial grouping filter

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
                          className="w-full justify-start h-auto p-3 hover:bg-muted/80 transition-colors group" // Added group for Ticket icon hover
                          asChild
                          onClick={() => setDialogOpen(false)} // Close dialog on click
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
              No schedule currently available for this film in known halls. Please check back later.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
