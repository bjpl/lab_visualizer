'use client';

import React, { useState } from 'react';
import { molstarService } from '@/services/molstar-service';
import { Button } from '@/components/ui/button';
import { Zap, ZapOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HydrogenBondsToggleProps {
  className?: string;
  defaultVisible?: boolean;
  onToggle?: (visible: boolean) => void;
}

/**
 * HydrogenBondsToggle Component
 *
 * Toggle visualization of hydrogen bonds in the molecular structure.
 *
 * Features:
 * - One-click toggle
 * - Visual feedback (yellow bonds)
 * - Loading state
 * - Error handling
 */
export function HydrogenBondsToggle({
  className,
  defaultVisible = false,
  onToggle
}: HydrogenBondsToggleProps) {
  const [visible, setVisible] = useState(defaultVisible);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newState = !visible;
      await molstarService.visualizeHydrogenBonds(newState);
      setVisible(newState);
      onToggle?.(newState);
    } catch (err) {
      console.error('Failed to toggle hydrogen bonds:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle hydrogen bonds');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button
        variant={visible ? 'default' : 'outline'}
        onClick={handleToggle}
        disabled={isLoading}
        className="justify-start"
      >
        {visible ? (
          <Zap className="w-4 h-4 mr-2" />
        ) : (
          <ZapOff className="w-4 h-4 mr-2" />
        )}
        {isLoading ? 'Loading...' : visible ? 'Hide H-Bonds' : 'Show H-Bonds'}
      </Button>

      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 px-2">
          {error}
        </div>
      )}

      {visible && (
        <div className="text-xs text-gray-600 dark:text-gray-400 px-2">
          Hydrogen bonds shown in yellow
        </div>
      )}
    </div>
  );
}
