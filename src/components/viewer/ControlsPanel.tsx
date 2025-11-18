'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RotateCcw } from 'lucide-react';
import { useVisualizationStore } from '@/lib/store/visualizationSlice';

export function ControlsPanel() {
  const {
    representation,
    colorScheme,
    backgroundColor,
    showBackbone,
    showSidechains,
    showLigands,
    showWater,
    quality,
    setRepresentation,
    setColorScheme,
    setBackgroundColor,
    toggleDisplay,
    setQuality,
    reset,
  } = useVisualizationStore();

  return (
    <div className="space-y-6" role="region" aria-label="Visualization controls">
      {/* Structure Search */}
      <div className="space-y-2">
        <Label htmlFor="structure-search">Structure Search</Label>
        <div className="flex gap-2">
          <Input
            id="structure-search"
            type="text"
            placeholder="Search PDB ID or name..."
            className="flex-1"
            aria-label="Search for molecular structure"
          />
          <Button size="icon" variant="outline" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Representation */}
      <div className="space-y-2">
        <Label htmlFor="representation">Representation</Label>
        <Select
          value={representation}
          onValueChange={setRepresentation}
        >
          <SelectTrigger id="representation" aria-label="Select representation style">
            <SelectValue placeholder="Select representation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cartoon">Cartoon</SelectItem>
            <SelectItem value="ball-and-stick">Ball and Stick</SelectItem>
            <SelectItem value="surface">Surface</SelectItem>
            <SelectItem value="ribbon">Ribbon</SelectItem>
            <SelectItem value="spacefill">Spacefill</SelectItem>
            <SelectItem value="backbone">Backbone</SelectItem>
            <SelectItem value="licorice">Licorice</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Color Scheme */}
      <div className="space-y-2">
        <Label htmlFor="color-scheme">Color Scheme</Label>
        <Select
          value={colorScheme}
          onValueChange={setColorScheme}
        >
          <SelectTrigger id="color-scheme" aria-label="Select color scheme">
            <SelectValue placeholder="Select color scheme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="element">Element</SelectItem>
            <SelectItem value="chain">Chain</SelectItem>
            <SelectItem value="residue">Residue Type</SelectItem>
            <SelectItem value="secondary-structure">Secondary Structure</SelectItem>
            <SelectItem value="rainbow">Rainbow</SelectItem>
            <SelectItem value="hydrophobicity">Hydrophobicity</SelectItem>
            <SelectItem value="b-factor">B-factor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <Label htmlFor="background-color">Background Color</Label>
        <div className="flex gap-2">
          <Input
            id="background-color"
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="h-10 w-20 cursor-pointer"
            aria-label="Pick background color"
          />
          <Input
            type="text"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="flex-1 font-mono"
            placeholder="#000000"
            aria-label="Background color hex code"
          />
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-4">
        <Label>Display Options</Label>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-backbone" className="font-normal">
            Backbone
          </Label>
          <Switch
            id="show-backbone"
            checked={showBackbone}
            onCheckedChange={() => toggleDisplay('backbone')}
            aria-label="Toggle backbone display"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-sidechains" className="font-normal">
            Sidechains
          </Label>
          <Switch
            id="show-sidechains"
            checked={showSidechains}
            onCheckedChange={() => toggleDisplay('sidechains')}
            aria-label="Toggle sidechains display"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-ligands" className="font-normal">
            Ligands
          </Label>
          <Switch
            id="show-ligands"
            checked={showLigands}
            onCheckedChange={() => toggleDisplay('ligands')}
            aria-label="Toggle ligands display"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-water" className="font-normal">
            Water Molecules
          </Label>
          <Switch
            id="show-water"
            checked={showWater}
            onCheckedChange={() => toggleDisplay('water')}
            aria-label="Toggle water molecules display"
          />
        </div>
      </div>

      {/* Quality Settings */}
      <div className="space-y-2">
        <Label htmlFor="quality">Rendering Quality</Label>
        <div className="flex items-center gap-4">
          <Slider
            id="quality"
            min={1}
            max={5}
            step={1}
            value={[quality]}
            onValueChange={([value]) => setQuality(value)}
            className="flex-1"
            aria-label="Adjust rendering quality"
          />
          <span className="w-8 text-center text-sm font-medium" aria-live="polite">
            {quality}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {quality <= 2 && 'Low (faster performance)'}
          {quality === 3 && 'Medium (balanced)'}
          {quality >= 4 && 'High (better quality)'}
        </p>
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={reset}
        aria-label="Reset all settings to default"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset to Defaults
      </Button>
    </div>
  );
}
