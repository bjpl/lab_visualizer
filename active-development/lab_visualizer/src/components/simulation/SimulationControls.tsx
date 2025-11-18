/**
 * Simulation Controls Component
 * Play/Pause/Step controls for MD simulation playback
 */

'use client';

import { useState, useEffect } from 'react';

import type { SimulationControls as ControlsState } from '../../types/simulation';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface SimulationControlsProps {
  controls: ControlsState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onFrameChange: (frame: number) => void;
  onSpeedChange: (speed: number) => void;
  onLoopToggle: () => void;
  disabled?: boolean;
}

export default function SimulationControls({
  controls,
  onPlay,
  onPause,
  onStop,
  onStepForward,
  onStepBackward,
  onFrameChange,
  onSpeedChange,
  onLoopToggle,
  disabled = false
}: SimulationControlsProps) {
  const [frameInput, setFrameInput] = useState(controls.currentFrame.toString());

  useEffect(() => {
    setFrameInput(controls.currentFrame.toString());
  }, [controls.currentFrame]);

  const handleFrameInputChange = (value: string) => {
    setFrameInput(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num < controls.totalFrames) {
      onFrameChange(num);
    }
  };

  const progressPercent = controls.totalFrames > 0
    ? (controls.currentFrame / controls.totalFrames) * 100
    : 0;

  const speedOptions = [0.25, 0.5, 1, 2, 4];

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Main Playback Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onStepBackward}
            disabled={disabled || controls.currentFrame === 0}
            title="Step backward"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </Button>

          {!controls.isPlaying ? (
            <Button
              variant="default"
              size="lg"
              onClick={onPlay}
              disabled={disabled || controls.totalFrames === 0}
              className="px-6"
              title="Play"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </Button>
          ) : (
            <Button
              variant="default"
              size="lg"
              onClick={onPause}
              disabled={disabled}
              className="px-6"
              title="Pause"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            disabled={disabled || controls.totalFrames === 0}
            title="Stop"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" />
            </svg>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onStepForward}
            disabled={disabled || controls.currentFrame >= controls.totalFrames - 1}
            title="Step forward"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </Button>
        </div>

        {/* Progress Bar and Frame Indicator */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Frame</span>
            <input
              type="number"
              value={frameInput}
              onChange={(e) => handleFrameInputChange(e.target.value)}
              disabled={disabled}
              min={0}
              max={controls.totalFrames - 1}
              className="w-20 px-2 py-1 border rounded text-center"
            />
            <span>/ {controls.totalFrames}</span>
          </div>

          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              type="range"
              min={0}
              max={controls.totalFrames - 1}
              value={controls.currentFrame}
              onChange={(e) => onFrameChange(parseInt(e.target.value, 10))}
              disabled={disabled || controls.totalFrames === 0}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Speed and Loop Controls */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Speed:</span>
            <div className="flex gap-1">
              {speedOptions.map(speed => (
                <button
                  key={speed}
                  onClick={() => onSpeedChange(speed)}
                  disabled={disabled}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    controls.playbackSpeed === speed
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onLoopToggle}
            disabled={disabled}
            className={`flex items-center gap-2 px-3 py-1 text-sm rounded transition-colors ${
              controls.loopMode
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            } hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
            title={controls.loopMode ? 'Loop enabled' : 'Loop disabled'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Loop</span>
          </button>
        </div>
      </div>
    </Card>
  );
}
