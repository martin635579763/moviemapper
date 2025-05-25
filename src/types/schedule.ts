
import type { ScheduleEntry } from '@/data/films';

// Defines the structure for storing which halls are preferred for a film if no custom schedule is set.
// Key: filmId (string), Value: array of hallName (string)
export type FilmHallPreferences = Record<string, string[]>;

// Defines the structure for storing manager-defined custom schedules for films.
// Key: filmId (string), Value: array of ScheduleEntry objects
export type UserDefinedFilmSchedules = Record<string, ScheduleEntry[]>;
