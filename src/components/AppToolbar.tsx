
"use client";
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import type { EditorTool, SeatCategory } from '@/types/layout';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Settings, Upload, Download, MousePointer, Eraser, Sofa, Tv2, Footprints, SquarePlus, Save, ListRestart, Search, Edit3 } from 'lucide-react';
import { sampleLayouts } from '@/data/sample-layouts';
import { DEFAULT_ROWS, DEFAULT_COLS } from '@/lib/layout-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils";
import { getSampleFilmsWithDynamicSchedules, type Film } from '@/data/films';
import { Badge } from "@/components/ui/badge";

const TOOLBAR_TOOLS_CONFIG: { value: EditorTool; label: string; icon: React.ElementType }[] = [
  { value: 'select', label: 'Select', icon: MousePointer },
  { value: 'seat', label: 'Seat', icon: Sofa },
  { value: 'aisle', label: 'Aisle', icon: Footprints },
  { value: 'screen', label: 'Screen', icon: Tv2 },
  { value: 'eraser', label: 'Eraser', icon: Eraser },
];

const SEAT_CATEGORIES_CONFIG: { value: SeatCategory; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'accessible', label: 'Accessible' },
  { value: 'loveseat', label: 'Loveseat' },
];

export const AppToolbar: React.FC = () => {
  const {
    layout,
    setLayout,
    selectedTool, setSelectedTool,
    selectedSeatCategory, setSelectedSeatCategory,
    initializeLayout,
    loadLayout, exportLayout,
    saveLayoutToStorage, loadLayoutFromStorage,
    deleteStoredLayout,
    storedLayoutNames,
    refreshStoredLayoutNames,
  } = useLayoutContext();

  const [rows, setRows] = useState(layout.rows || DEFAULT_ROWS);
  const [cols, setCols] = useState(layout.cols || DEFAULT_COLS);
  const [layoutName, setLayoutName] = useState(layout.name || "New Hall");
  const [saveLayoutNameInput, setSaveLayoutNameInput] = useState("");
  const [layoutToDelete, setLayoutToDelete] = useState<string | null>(null);

  const [filmsWithSchedules, setFilmsWithSchedules] = useState<Film[]>([]);
  const [isManagePopoverOpen, setIsManagePopoverOpen] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLayoutName(layout.name);
    setRows(layout.rows);
    setCols(layout.cols);
    setSaveLayoutNameInput(layout.name);
  }, [layout.name, layout.rows, layout.cols]);

  // Fetch film schedules when popover is open or storedLayoutNames change
  useEffect(() => {
    if (isManagePopoverOpen && refreshStoredLayoutNames) { // ensure refreshStoredLayoutNames is available
        setFilmsWithSchedules(getSampleFilmsWithDynamicSchedules());
    }
  }, [isManagePopoverOpen, storedLayoutNames, refreshStoredLayoutNames]);

  const isHallInUse = useCallback((hallName: string): boolean => {
    return filmsWithSchedules.some(film =>
        film.schedule?.some(entry => entry.hallName === hallName)
    );
  }, [filmsWithSchedules]);


  const handleInitialize = () => {
    initializeLayout(rows, cols, layoutName);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setLayoutName(newName);
    setLayout(prev => ({ ...prev, name: newName }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedLayoutData = JSON.parse(e.target?.result as string);
          loadLayout(loadedLayoutData);
        } catch (error) {
          console.error("Failed to parse layout file:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveToStorage = () => {
    // Trim the name here as well, before passing to the context function
    const trimmedSaveName = saveLayoutNameInput.trim();
    if (saveLayoutToStorage(trimmedSaveName) && refreshStoredLayoutNames) {
      // refreshStoredLayoutNames(); // Context handles refreshing its internal list via saveLayoutToStorage
    }
  };

  const handleDeleteStoredLayout = () => {
    if (layoutToDelete) {
      deleteStoredLayout(layoutToDelete);
      setLayoutToDelete(null);
    }
  };


  const toolClickHandlers = useMemo(() => {
    return TOOLBAR_TOOLS_CONFIG.reduce((acc, toolConfig) => {
      acc[toolConfig.value] = () => setSelectedTool(toolConfig.value);
      return acc;
    }, {} as Record<EditorTool, () => void>);
  }, [setSelectedTool]);

  return (
    <TooltipProvider>
      <div className="p-3 border-b bg-card shadow-sm flex flex-wrap items-center gap-2 text-sm">
        <h1 className="text-lg font-semibold text-primary mr-3 whitespace-nowrap">SeatLayout</h1>

        {/* Tools */}
        <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-md">
          {TOOLBAR_TOOLS_CONFIG.map(tool => (
            <Tooltip key={tool.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTool === tool.value ? "default" : "ghost"}
                  size="icon"
                  onClick={toolClickHandlers[tool.value]}
                  className={selectedTool === tool.value ? "text-primary-foreground bg-primary h-8 w-8" : "text-foreground h-8 w-8"}
                  aria-label={tool.label}
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{tool.label}</p></TooltipContent>
            </Tooltip>
          ))}
        </div>

        {selectedTool === 'seat' && (
          <Select value={selectedSeatCategory} onValueChange={(value: SeatCategory) => setSelectedSeatCategory(value)}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Seat Category" />
            </SelectTrigger>
            <SelectContent>
              {SEAT_CATEGORIES_CONFIG.map(cat => (
                <SelectItem key={cat.value} value={cat.value} className="text-xs">{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Separator orientation="vertical" className="h-7 mx-1" />

        {/* Layout Actions */}
        <Input
          type="text"
          placeholder="Layout Name"
          value={layoutName}
          onChange={handleNameChange}
          className="w-[150px] h-9 text-xs"
        />
        <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} size="sm" className="h-9 text-xs"><Upload className="mr-1.5 h-3.5 w-3.5" /> Load File</Button>
            </TooltipTrigger>
            <TooltipContent><p>Load layout from JSON file</p></TooltipContent>
        </Tooltip>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />

        <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={exportLayout} size="sm" className="h-9 text-xs"><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
            </TooltipTrigger>
            <TooltipContent><p>Export current layout as JSON file</p></TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-7 mx-1" />

        {/* Local Storage Actions */}
        <div className="flex items-center gap-2">
            <Input
                type="text"
                placeholder="Save as name..."
                value={saveLayoutNameInput}
                onChange={(e) => setSaveLayoutNameInput(e.target.value)}
                className="w-[150px] h-9 text-xs"
            />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={handleSaveToStorage} size="sm" className="h-9 text-xs" variant="outline"><Save className="mr-1.5 h-3.5 w-3.5"/>Save</Button>
                </TooltipTrigger>
                <TooltipContent><p>Save current layout to browser storage</p></TooltipContent>
            </Tooltip>
        </div>

        {storedLayoutNames.length > 0 && (
             <Select onValueChange={(value) => {
                if (value === "__manage__") return;
                loadLayoutFromStorage(value);
                // clearSeatSelection(); // This was removed as part of ticket selling feature rollback
              }}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Load from Browser" />
              </SelectTrigger>
              <SelectContent>
                {storedLayoutNames.map(name => (
                  <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        )}
         <Tooltip>
          <TooltipTrigger asChild>
             <Button variant="outline" size="icon" className="h-9 w-9" onClick={refreshStoredLayoutNames}><ListRestart className="h-4 w-4"/></Button>
          </TooltipTrigger>
          <TooltipContent><p>Refresh saved layouts list</p></TooltipContent>
        </Tooltip>


        {/* Sample Layouts */}
         <Select onValueChange={(value) => {
            const selectedSample = sampleLayouts.find(sl => sl.name === value);
            if (selectedSample) {
              loadLayout(JSON.parse(JSON.stringify(selectedSample)));
              // clearSeatSelection(); // This was removed as part of ticket selling feature rollback
            }
          }}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue placeholder="Load Sample" />
          </SelectTrigger>
          <SelectContent>
            {sampleLayouts.map(sl => (
              <SelectItem key={sl.name} value={sl.name} className="text-xs">{sl.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Settings Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9"><Settings className="h-4 w-4" /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Dimensions</h4>
                <p className="text-sm text-muted-foreground">
                  Set rows and columns for a new layout. This will clear the current layout.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="rows">Rows</Label>
                  <Input id="rows" type="number" value={rows} onChange={e => setRows(Math.max(1, parseInt(e.target.value)))} className="col-span-2 h-8" />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="cols">Columns</Label>
                  <Input id="cols" type="number" value={cols} onChange={e => setCols(Math.max(1, parseInt(e.target.value)))} className="col-span-2 h-8" />
                </div>
                <Button onClick={handleInitialize} className="mt-2"><SquarePlus className="mr-2 h-4 w-4"/>New Layout</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {storedLayoutNames.length > 0 && (
        <Popover open={isManagePopoverOpen} onOpenChange={setIsManagePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-xs mt-2 ml-3">Manage Saved</Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 min-w-[300px]">
              <Command>
                <CommandInput placeholder="Filter layouts..." className="h-9"/>
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Saved Layouts">
                    {storedLayoutNames.map((name) => (
                      <CommandItem key={name} className="flex justify-between items-center pr-2">
                        <div className="flex items-center gap-2 py-1.5 px-2">
                            <span>{name}</span>
                            {isHallInUse(name) ? (
                                <Badge variant="default" className="h-5 px-1.5 text-xs bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">In Use</Badge>
                            ) : (
                                <Badge variant="secondary" className="h-5 px-1.5 text-xs">Not in Use</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!isHallInUse(name) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-primary hover:bg-primary/10 h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent CommandItem onSelect if it has one
                                loadLayoutFromStorage(name);
                                setIsManagePopoverOpen(false);
                              }}
                            >
                              <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                            </Button>
                          )}
                          <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                              onClick={(e) => {
                                  e.stopPropagation(); // Prevent CommandItem onSelect if it has one
                                  setLayoutToDelete(name);
                              }}
                              disabled={isHallInUse(name)}
                          >
                              Delete
                          </Button>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
          </PopoverContent>
        </Popover>
      )}
      <AlertDialog open={!!layoutToDelete} onOpenChange={(open) => !open && setLayoutToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the layout "{layoutToDelete}" from your browser storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLayoutToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStoredLayout}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

// ShadCN Command components (local copy for simplicity in AppToolbar)
const Command: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className)} {...props} />
);

// Explicitly define type for CommandInput props to avoid implicit any
interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: string; // type is an optional string
}
const CommandInput: React.FC<CommandInputProps> = ({ className, type, ...props }) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <input type={type} className={cn("flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0", className)} {...props} />
  </div>
);

const CommandList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)} {...props} />
);
const CommandEmpty: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div className="py-6 text-center text-sm" {...props} />
);

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string;
}
const CommandGroup: React.FC<CommandGroupProps> = ({ className, heading, ...props }) => (
  <div className={cn("overflow-hidden p-1 text-foreground", className)} {...props}>
    {heading && <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</div>}
    {props.children}
  </div>
);

// Correctly type CommandItem to potentially accept onSelect from mapping
interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  onSelect?: () => void; 
}
const CommandItem: React.FC<CommandItemProps> = ({ className, onSelect, ...props }) => (
  <div
    className={cn("relative flex cursor-default select-none items-center rounded-sm text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
    onClick={onSelect} // if onSelect is provided, use it
    {...props}
  />
);
