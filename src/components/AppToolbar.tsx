
"use client";
import React, { useState, useRef } from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, Upload, Download, Trash2, MousePointer, Eraser, Sofa, Tv2, Footprints, SquarePlus, Minus } from 'lucide-react';
import type { EditorTool, SeatCategory } from '@/types/layout';
import { sampleLayouts } from '@/data/sample-layouts';
import { DEFAULT_ROWS, DEFAULT_COLS } from '@/lib/layout-utils';

export const AppToolbar: React.FC = () => {
  const {
    layout,
    setLayout,
    selectedTool, setSelectedTool,
    selectedSeatCategory, setSelectedSeatCategory,
    initializeLayout,
    loadLayout, exportLayout,
  } = useLayoutContext();

  const [rows, setRows] = useState(layout.rows || DEFAULT_ROWS);
  const [cols, setCols] = useState(layout.cols || DEFAULT_COLS);
  const [layoutName, setLayoutName] = useState(layout.name || "New Hall");

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          const loaded = JSON.parse(e.target?.result as string);
          loadLayout(loaded);
          setLayoutName(loaded.name);
          setRows(loaded.rows);
          setCols(loaded.cols);
        } catch (error) {
          console.error("Failed to parse layout file:", error);
          // Toast is handled in context's loadLayout
        }
      };
      reader.readAsText(file);
    }
  };

  const tools: { value: EditorTool; label: string; icon: React.ElementType }[] = [
    { value: 'select', label: 'Select', icon: MousePointer },
    { value: 'seat', label: 'Seat', icon: Sofa },
    { value: 'aisle', label: 'Aisle', icon: Footprints },
    { value: 'screen', label: 'Screen', icon: Tv2 },
    { value: 'eraser', label: 'Eraser', icon: Eraser },
  ];

  const seatCategories: { value: SeatCategory; label: string }[] = [
    { value: 'standard', label: 'Standard' },
    { value: 'premium', label: 'Premium' },
    { value: 'accessible', label: 'Accessible' },
    { value: 'loveseat', label: 'Loveseat' },
  ];

  return (
    <div className="p-3 border-b bg-card shadow-sm flex flex-wrap items-center gap-4">
      <h1 className="text-xl font-semibold text-primary mr-4">SeatLayout</h1>

      {/* Tools */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
        {tools.map(tool => (
          <Tooltip key={tool.value}>
            <TooltipTrigger asChild>
              <Button
                variant={selectedTool === tool.value ? "default" : "ghost"}
                size="icon"
                onClick={() => setSelectedTool(tool.value)}
                className={selectedTool === tool.value ? "text-primary-foreground bg-primary" : "text-foreground"}
                aria-label={tool.label}
              >
                <tool.icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{tool.label}</p></TooltipContent>
          </Tooltip>
        ))}
      </div>
      
      {selectedTool === 'seat' && (
        <Select value={selectedSeatCategory} onValueChange={(value: SeatCategory) => setSelectedSeatCategory(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Seat Category" />
          </SelectTrigger>
          <SelectContent>
            {seatCategories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Separator orientation="vertical" className="h-8" />

      {/* Layout Actions */}
      <Input
        type="text"
        placeholder="Layout Name"
        value={layoutName}
        onChange={handleNameChange}
        className="w-[180px]"
      />
      <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Load</Button>
          </TooltipTrigger>
          <TooltipContent><p>Load layout from JSON file</p></TooltipContent>
      </Tooltip>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
      
      <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={exportLayout}><Download className="mr-2 h-4 w-4" /> Export</Button>
          </TooltipTrigger>
          <TooltipContent><p>Export current layout as JSON file</p></TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-8" />
      
      {/* Sample Layouts */}
       <Select onValueChange={(value) => {
          const selected = sampleLayouts.find(sl => sl.name === value);
          if (selected) {
            loadLayout(JSON.parse(JSON.stringify(selected))); // Deep copy
            setLayoutName(selected.name);
            setRows(selected.rows);
            setCols(selected.cols);
          }
        }}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Load Sample Layout" />
        </SelectTrigger>
        <SelectContent>
          {sampleLayouts.map(sl => (
            <SelectItem key={sl.name} value={sl.name}>{sl.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Settings Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon"><Settings /></Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Dimensions</h4>
              <p className="text-sm text-muted-foreground">
                Set the number of rows and columns for a new layout.
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
  );
};
