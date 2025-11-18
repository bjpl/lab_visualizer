/**
 * QueueStatus Component - System-wide queue statistics
 *
 * Features:
 * - Real-time queue statistics
 * - User position in queue
 * - Estimated wait time
 * - Active jobs count
 * - Completion rate metrics
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

export interface QueueStats {
  pending: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  completionRate24h: number;
}

export interface QueueStatusProps {
  stats?: QueueStats;
  userPosition?: number;
  estimatedWaitTime?: number;
  onRefresh?: () => void;
}

export function QueueStatus({ stats, userPosition, estimatedWaitTime, onRefresh }: QueueStatusProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      onRefresh?.();
    }, 30000);

    return () => clearInterval(interval);
  }, [onRefresh]);

  const totalActive = (stats?.pending || 0) + (stats?.queued || 0) + (stats?.running || 0);
  const totalCompleted = (stats?.completed || 0) + (stats?.failed || 0);
  const successRate = totalCompleted > 0
    ? ((stats?.completed || 0) / totalCompleted * 100)
    : 100;

  const formatWaitTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Queue Status</h3>
        <button
          onClick={onRefresh}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          🔄 {formatTime(lastUpdate)}
        </button>
      </div>

      {/* User position (if in queue) */}
      {userPosition !== undefined && userPosition > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Your Position</div>
              <div className="text-xs text-muted-foreground">in queue</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">#{userPosition}</div>
          </div>
          {estimatedWaitTime !== undefined && (
            <div className="mt-2 text-xs text-muted-foreground">
              Est. wait time: {formatWaitTime(estimatedWaitTime)}
            </div>
          )}
        </div>
      )}

      {/* Active jobs */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Pending"
          value={stats?.pending || 0}
          color="gray"
          icon="⏳"
        />
        <StatCard
          label="Queued"
          value={stats?.queued || 0}
          color="blue"
          icon="📋"
        />
        <StatCard
          label="Running"
          value={stats?.running || 0}
          color="green"
          icon="▶️"
        />
      </div>

      {/* Completion stats */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Success Rate (24h)</span>
          <span className="font-medium">{successRate.toFixed(1)}%</span>
        </div>
        <Progress value={successRate} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{stats?.completed || 0} completed</span>
          <span>{stats?.failed || 0} failed</span>
        </div>
      </div>

      {/* Average times */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Avg Wait Time</div>
          <div className="text-sm font-medium">
            {stats?.averageWaitTime ? formatWaitTime(stats.averageWaitTime) : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Avg Runtime</div>
          <div className="text-sm font-medium">
            {stats?.averageProcessingTime ? formatWaitTime(stats.averageProcessingTime) : '—'}
          </div>
        </div>
      </div>

      {/* System health indicator */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">System Status</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              totalActive < 10 ? 'bg-green-500' : totalActive < 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="font-medium">
              {totalActive < 10 ? 'Low Load' : totalActive < 50 ? 'Moderate' : 'High Load'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: 'gray' | 'blue' | 'green';
  icon: string;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  const bgColors = {
    gray: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
  };

  const textColors = {
    gray: 'text-gray-700',
    blue: 'text-blue-700',
    green: 'text-green-700',
  };

  return (
    <div className={`border rounded-lg p-3 ${bgColors[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${textColors[color]}`}>{value}</div>
    </div>
  );
}
