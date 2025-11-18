/**
 * Energy Plot Component
 * Real-time energy vs time chart for MD simulation
 */

'use client';

import { useMemo } from 'react';

import type { EnergyPlotData } from '../../types/simulation';
import { Card } from '../ui/card';

interface EnergyPlotProps {
  data: EnergyPlotData;
  width?: number;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

export default function EnergyPlot({
  data,
  width = 600,
  height = 300,
  showLegend = true,
  showGrid = true
}: EnergyPlotProps) {
  // Calculate plot dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Calculate data ranges
  const { xRange, yRange, xScale, yScale } = useMemo(() => {
    if (data.time.length === 0) {
      return {
        xRange: [0, 1],
        yRange: [0, 1],
        xScale: (_x: number) => 0,
        yScale: (_y: number) => 0
      };
    }

    const xMin = Math.min(...data.time);
    const xMax = Math.max(...data.time);
    const allEnergies = [
      ...data.potential,
      ...data.kinetic,
      ...data.total
    ];
    const yMin = Math.min(...allEnergies);
    const yMax = Math.max(...allEnergies);

    // Add 10% padding to y-axis
    const yPadding = (yMax - yMin) * 0.1;

    return {
      xRange: [xMin, xMax],
      yRange: [yMin - yPadding, yMax + yPadding],
      xScale: (x: number) => ((x - xMin) / (xMax - xMin)) * plotWidth,
      yScale: (y: number) => plotHeight - ((y - (yMin - yPadding)) / (yMax - yMin + 2 * yPadding)) * plotHeight
    };
  }, [data, plotWidth, plotHeight]);

  // Generate path for each energy component
  const generatePath = (values: number[]) => {
    if (values.length === 0) return '';

    const points = values.map((value, i) => {
      const x = xScale(data.time[i]);
      const y = yScale(value);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    return points.join(' ');
  };

  const potentialPath = generatePath(data.potential);
  const kineticPath = generatePath(data.kinetic);
  const totalPath = generatePath(data.total);

  // Generate grid lines
  const gridLines = useMemo(() => {
    if (!showGrid) return { x: [], y: [] };

    const xLines = [];
    const yLines = [];
    const numXLines = 5;
    const numYLines = 5;

    for (let i = 0; i <= numXLines; i++) {
      const x = (plotWidth / numXLines) * i;
      xLines.push(x);
    }

    for (let i = 0; i <= numYLines; i++) {
      const y = (plotHeight / numYLines) * i;
      yLines.push(y);
    }

    return { x: xLines, y: yLines };
  }, [showGrid, plotWidth, plotHeight]);

  // Generate axis labels
  const xAxisLabels = useMemo(() => {
    const labels = [];
    const numLabels = 5;
    for (let i = 0; i <= numLabels; i++) {
      const value = xRange[0] + (xRange[1] - xRange[0]) * (i / numLabels);
      labels.push({
        x: (plotWidth / numLabels) * i,
        value: value.toFixed(1)
      });
    }
    return labels;
  }, [xRange, plotWidth]);

  const yAxisLabels = useMemo(() => {
    const labels = [];
    const numLabels = 5;
    for (let i = 0; i <= numLabels; i++) {
      const value = yRange[0] + (yRange[1] - yRange[0]) * (i / numLabels);
      labels.push({
        y: plotHeight - (plotHeight / numLabels) * i,
        value: value.toFixed(0)
      });
    }
    return labels;
  }, [yRange, plotHeight]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (data.total.length === 0) return null;

    const avgTotal = data.total.reduce((sum, v) => sum + v, 0) / data.total.length;
    const avgPotential = data.potential.reduce((sum, v) => sum + v, 0) / data.potential.length;
    const avgKinetic = data.kinetic.reduce((sum, v) => sum + v, 0) / data.kinetic.length;
    const avgTemp = data.temperature.reduce((sum, v) => sum + v, 0) / data.temperature.length;

    const drift = data.total[data.total.length - 1] - data.total[0];

    return {
      avgTotal,
      avgPotential,
      avgKinetic,
      avgTemp,
      drift
    };
  }, [data]);

  if (data.time.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>No data to display</p>
          <p className="text-sm mt-2">Start a simulation to see energy plots</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Energy vs Time</h3>
          {stats && (
            <div className="text-sm text-gray-600">
              Energy Drift: <span className={drift > 0 ? 'text-red-600' : 'text-green-600'}>
                {stats.drift > 0 ? '+' : ''}{stats.drift.toFixed(2)} kJ/mol
              </span>
            </div>
          )}
        </div>

        {/* SVG Plot */}
        <svg width={width} height={height} className="border border-gray-200 rounded">
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid Lines */}
            {showGrid && (
              <g className="text-gray-200">
                {gridLines.x.map((x, i) => (
                  <line
                    key={`x-${i}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={plotHeight}
                    stroke="currentColor"
                    strokeDasharray="2,2"
                  />
                ))}
                {gridLines.y.map((y, i) => (
                  <line
                    key={`y-${i}`}
                    x1={0}
                    y1={y}
                    x2={plotWidth}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="2,2"
                  />
                ))}
              </g>
            )}

            {/* Energy Lines */}
            <g>
              <path
                d={potentialPath}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={2}
                className="drop-shadow"
              />
              <path
                d={kineticPath}
                fill="none"
                stroke="#10B981"
                strokeWidth={2}
                className="drop-shadow"
              />
              <path
                d={totalPath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={2.5}
                className="drop-shadow"
              />
            </g>

            {/* Axes */}
            <g className="text-gray-700">
              <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="currentColor" strokeWidth={2} />
              <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="currentColor" strokeWidth={2} />
            </g>

            {/* X-Axis Labels */}
            <g className="text-xs text-gray-600">
              {xAxisLabels.map((label, i) => (
                <text
                  key={i}
                  x={label.x}
                  y={plotHeight + 20}
                  textAnchor="middle"
                  fill="currentColor"
                >
                  {label.value}
                </text>
              ))}
              <text
                x={plotWidth / 2}
                y={plotHeight + 35}
                textAnchor="middle"
                fill="currentColor"
                className="font-medium"
              >
                Time (ps)
              </text>
            </g>

            {/* Y-Axis Labels */}
            <g className="text-xs text-gray-600">
              {yAxisLabels.map((label, i) => (
                <text
                  key={i}
                  x={-10}
                  y={label.y}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  fill="currentColor"
                >
                  {label.value}
                </text>
              ))}
              <text
                x={-45}
                y={plotHeight / 2}
                textAnchor="middle"
                fill="currentColor"
                transform={`rotate(-90, -45, ${plotHeight / 2})`}
                className="font-medium"
              >
                Energy (kJ/mol)
              </text>
            </g>
          </g>
        </svg>

        {/* Legend */}
        {showLegend && (
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600"></div>
              <span>Potential</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-600"></div>
              <span>Kinetic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-yellow-600"></div>
              <span>Total</span>
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-xs text-gray-500">Avg Total</div>
              <div className="text-lg font-semibold text-yellow-600">{stats.avgTotal.toFixed(1)}</div>
              <div className="text-xs text-gray-400">kJ/mol</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Avg Potential</div>
              <div className="text-lg font-semibold text-blue-600">{stats.avgPotential.toFixed(1)}</div>
              <div className="text-xs text-gray-400">kJ/mol</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Avg Kinetic</div>
              <div className="text-lg font-semibold text-green-600">{stats.avgKinetic.toFixed(1)}</div>
              <div className="text-xs text-gray-400">kJ/mol</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Avg Temp</div>
              <div className="text-lg font-semibold text-gray-700">{stats.avgTemp.toFixed(1)}</div>
              <div className="text-xs text-gray-400">K</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
