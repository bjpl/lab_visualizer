'use client';

import { Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Users } from 'lucide-react';
import React, { useState } from 'react';

import { ControlsPanel } from './ControlsPanel';
import { InfoPanel } from './InfoPanel';
import { LoadingState } from './LoadingState';
import { MolStarViewer } from './MolStarViewer';
import { SelectionPanel } from './SelectionPanel';
import { Toolbar } from './Toolbar';

import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCollaborationStore, selectCurrentSession } from '@/store/collaboration-slice';

interface ViewerLayoutProps {
  pdbId?: string;
  className?: string;
  /**
   * User ID for collaboration (optional)
   */
  userId?: string;
  /**
   * User name for collaboration (optional)
   */
  userName?: string;
  /**
   * Enable collaboration features
   */
  enableCollaboration?: boolean;
}

export function ViewerLayout({
  pdbId,
  className,
  userId = 'user-' + Date.now(),
  userName = 'Guest User',
  enableCollaboration = true,
}: ViewerLayoutProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(!!pdbId);
  const [error, setError] = useState<string | null>(null);
  const [showCollaboration, setShowCollaboration] = useState(false);

  const session = useCollaborationStore(selectCurrentSession);
  const isInSession = !!session;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingState
          error={error}
          onRetry={() => {
            setError(null);
            setIsLoading(true);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-screen flex-col bg-background transition-all duration-300',
        className
      )}
      role="main"
      aria-label="Molecular structure viewer"
    >
      {/* Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Toolbar
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          onTogglePanel={togglePanel}
          isPanelCollapsed={isPanelCollapsed}
        />

        {/* Collaboration Toggle Button */}
        {enableCollaboration && (
          <div className="absolute top-2 right-4 z-10">
            <Button
              variant={isInSession ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCollaboration(!showCollaboration)}
              className={cn(
                'gap-2',
                isInSession && 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              <Users className="h-4 w-4" />
              {isInSession ? 'In Session' : 'Collaborate'}
              {isInSession && session && (
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {Array.from(useCollaborationStore.getState().users.values()).length}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div
          className={cn(
            'relative flex-1 transition-all duration-300',
            'lg:flex-none',
            isPanelCollapsed ? 'lg:w-full' : 'lg:w-[70%]'
          )}
        >
          {isLoading && <LoadingState />}

          <MolStarViewer
            pdbId={pdbId}
            onLoadStart={() => setIsLoading(true)}
            onLoadComplete={() => setIsLoading(false)}
            onError={(err) => {
              setError(err);
              setIsLoading(false);
            }}
            className="h-full w-full"
          />

          {/* Fullscreen Toggle Overlay */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-4 right-4 bg-background/80 backdrop-blur hover:bg-background"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Controls Panel */}
        {!showCollaboration && (
          <div
            className={cn(
              'border-l bg-muted/50 transition-all duration-300',
              'flex flex-col overflow-hidden',
              'max-lg:absolute max-lg:inset-x-0 max-lg:bottom-0',
              'max-lg:max-h-[50vh] max-lg:border-l-0 max-lg:border-t',
              isPanelCollapsed ? 'lg:w-0 lg:border-l-0' : 'lg:w-[30%]'
            )}
          >
            {!isPanelCollapsed && (
              <div className="flex h-full flex-col overflow-hidden">
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b bg-background p-4">
                  <h2 className="text-lg font-semibold">Controls</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePanel}
                    aria-label="Collapse panel"
                    className="lg:hidden"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-6 p-4">
                    <ControlsPanel />

                    <div className="border-t pt-6">
                      <SelectionPanel />
                    </div>

                    <div className="border-t pt-6">
                      <InfoPanel pdbId={pdbId} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Collapsed Panel Toggle */}
            {isPanelCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePanel}
                className="absolute right-0 top-1/2 -translate-y-1/2 max-lg:hidden"
                aria-label="Expand panel"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Collaboration Panel */}
        {enableCollaboration && showCollaboration && (
          <CollaborationPanel
            userId={userId}
            userName={userName}
            structureId={pdbId}
            onClose={() => setShowCollaboration(false)}
          />
        )}
      </div>
    </div>
  );
}
