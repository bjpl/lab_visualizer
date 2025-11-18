'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Ruler,
  Move,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { useVisualizationStore } from '@/lib/store/visualizationSlice';

interface ToolbarProps {
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onTogglePanel: () => void;
  isPanelCollapsed: boolean;
}

export function Toolbar({
  onToggleFullscreen,
  isFullscreen,
  onTogglePanel,
  isPanelCollapsed,
}: ToolbarProps) {
  const [measurementMode, setMeasurementMode] = useState<'distance' | 'angle' | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);

  const { resetCamera, captureScreenshot } = useVisualizationStore();

  const handleCameraReset = () => {
    resetCamera();
  };

  const handleZoomIn = () => {
    // Will be implemented with Mol* integration
    console.log('Zoom in');
  };

  const handleZoomOut = () => {
    // Will be implemented with Mol* integration
    console.log('Zoom out');
  };

  const handleScreenshot = async () => {
    try {
      const dataUrl = await captureScreenshot();
      const link = document.createElement('a');
      link.download = `molstar-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  };

  const handleMeasurement = (mode: 'distance' | 'angle') => {
    setMeasurementMode(measurementMode === mode ? null : mode);
  };

  const handleSelectionToggle = () => {
    setSelectionMode(!selectionMode);
  };

  return (
    <TooltipProvider>
      <div
        className="flex items-center justify-between p-2"
        role="toolbar"
        aria-label="Viewer toolbar"
      >
        {/* Left Section - Camera Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCameraReset}
                aria-label="Reset camera view"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset Camera (R)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In (+)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out (-)</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Camera presets">
                <Camera className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => console.log('Front view')}>
                Front View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Side view')}>
                Side View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Top view')}>
                Top View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Perspective')}>
                Perspective
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center Section - Tools */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectionMode ? 'default' : 'ghost'}
                size="icon"
                onClick={handleSelectionToggle}
                aria-label="Toggle selection mode"
                aria-pressed={selectionMode}
              >
                <Move className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Selection Mode (S)</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={measurementMode ? 'default' : 'ghost'}
                size="icon"
                aria-label="Measurement tools"
                aria-pressed={!!measurementMode}
              >
                <Ruler className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => handleMeasurement('distance')}>
                Measure Distance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMeasurement('angle')}>
                Measure Angle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleScreenshot}
                aria-label="Capture screenshot"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Screenshot (Ctrl+S)</TooltipContent>
          </Tooltip>
        </div>

        {/* Right Section - View Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onTogglePanel}
                aria-label={isPanelCollapsed ? 'Show controls panel' : 'Hide controls panel'}
                aria-pressed={!isPanelCollapsed}
              >
                {isPanelCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPanelCollapsed ? 'Show Panel' : 'Hide Panel'} (P)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} (F)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => console.log('Show help')}
                aria-label="Show help and keyboard shortcuts"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help (H)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => console.log('Settings')}
                aria-label="Open settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
