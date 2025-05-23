
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
import { Settings, Upload, Download, MousePointer, Eraser, Sofa, Tv2, Footprints, SquarePlus, Save, ListRestart, Search } from 'lucide-react';
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
  // AlertDialogTrigger, // Removed direct import as it's conditionally used or causing issues
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"; 


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
    saveLayoutToStorage, loadLayoutFromStorage, getStoredLayoutNames, deleteStoredLayout,
    // clearSeatSelection // Removed as it's no longer in context
  } = useLayoutContext();

  const [rows, setRows] = useState(layout.rows || DEFAULT_ROWS);
  const [cols, setCols] = useState(layout.cols || DEFAULT_COLS);
  const [layoutName, setLayoutName] = useState(layout.name || "New Hall");
  const [saveLayoutNameInput, setSaveLayoutNameInput] = useState("");
  const [storedLayoutNames, setStoredLayoutNames] = useState<string[]>([]);
  const [layoutToDelete, setLayoutToDelete] = useState<string | null>(null);


  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLayoutName(layout.name);
    setRows(layout.rows);
    setCols(layout.cols);
    setSaveLayoutNameInput(layout.name); // Pre-fill save input with current layout name
  }, [layout.name, layout.rows, layout.cols]);

  const refreshStoredNames = useCallback(() => {
    setStoredLayoutNames(getStoredLayoutNames());
  }, [getStoredLayoutNames]);

  useEffect(() => {
    refreshStoredNames();
  }, [refreshStoredNames]);

  const handleInitialize = () => {
    initializeLayout(rows, cols, layoutName);
    // clearSeatSelection(); // Removed call
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
          loadLayout(loadedLayoutData); // loadLayout now handles updating context's layout name
          // clearSeatSelection(); // Removed call
        } catch (error) {
          console.error("Failed to parse layout file:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveToStorage = () => {
    if (saveLayoutToStorage(saveLayoutNameInput)) {
      refreshStoredNames();
    }
  };

  const handleDeleteStoredLayout = () => {
    if (layoutToDelete) {
      deleteStoredLayout(layoutToDelete);
      refreshStoredNames();
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
                // clearSeatSelection(); // Removed call
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
             <Button variant="outline" size="icon" className="h-9 w-9" onClick={refreshStoredNames}><ListRestart className="h-4 w-4"/></Button>
          </TooltipTrigger>
          <TooltipContent><p>Refresh saved layouts list</p></TooltipContent>
        </Tooltip>


        {/* Sample Layouts */}
         <Select onValueChange={(value) => {
            const selectedSample = sampleLayouts.find(sl => sl.name === value);
            if (selectedSample) {
              loadLayout(JSON.parse(JSON.stringify(selectedSample))); // Deep copy
              // clearSeatSelection(); // Removed call
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
      
      {/* Delete Confirmation Dialog Trigger and Content Area */}
      {storedLayoutNames.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-xs mt-2 ml-3">Manage Saved</Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
              <Command>
                <CommandInput placeholder="Filter layouts..." className="h-9"/>
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Saved Layouts">
                    {storedLayoutNames.map((name) => (
                      <CommandItem key={name} onSelect={() => setLayoutToDelete(name)} className="flex justify-between items-center">
                        <span>{name}</span>
                        {/* 
                          The AlertDialogTrigger was removed here. The Button's onClick now directly
                          sets the state to open the AlertDialog. The AlertDialog itself is controlled.
                        */}
                        <Button variant="ghost" size="sm" onClick={() => setLayoutToDelete(name)}>Delete</Button>
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

// ShadCN Command components (simplified for this example, typically in their own files)
// For a real app, these would be imported from '@/components/ui/command'
const Command: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className)} {...props} />
);
const CommandInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <Input className={cn("flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0", className)} {...props} />
  </div>
);

const CommandList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)} {...props} />
);
const CommandEmpty: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div className="py-6 text-center text-sm" {...props} />
);
const CommandGroup: React.FC<React.HTMLAttributes<HTMLDivElement> & { heading?: string }> = ({ className, heading, ...props }) => (
  <div className={cn("overflow-hidden p-1 text-foreground", className)} {...props}>
    {heading && <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</div>}
    {props.children}
  </div>
);
const CommandItem: React.FC<React.HTMLAttributes<HTMLDivElement> & { onSelect?: () => void }> = ({ className, onSelect, ...props }) => (
  <div
    className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
    onClick={onSelect} // Basic click handler for selection
    {...props}
  />
);

