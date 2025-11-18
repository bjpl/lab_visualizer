/**
 * Cost Dashboard Component
 *
 * Real-time cost tracking dashboard for LAB Visualization Platform administrators.
 * Displays Vercel, Supabase, and simulation costs with alerts and optimization recommendations.
 */

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';

import { COST_BUDGETS } from '../../../config/cost-budgets';
import {
  generateCostAlerts,
  generateOptimizationRecommendations,
  calculateFeatureCosts,
  projectCosts,
  formatCurrency,
  formatPercent,
} from '../../lib/cost-calculator';
import { costTrackingService } from '../../services/cost-tracking';
import type {
  CostSummary,
  CostTrend,
  CostAlert,
  OptimizationRecommendation,
  FeatureCostBreakdown,
  TimeRange,
  PopularStructure,
  CostProjection,
} from '../../types/cost-tracking';

interface CostDashboardProps {
  refreshInterval?: number; // milliseconds
  showDetailedMetrics?: boolean;
  onAlertClick?: (alert: CostAlert) => void;
  onRecommendationClick?: (recommendation: OptimizationRecommendation) => void;
}

export const CostDashboard: React.FC<CostDashboardProps> = ({
  refreshInterval = 300000, // 5 minutes default
  showDetailedMetrics = true,
  onAlertClick,
  onRecommendationClick,
}) => {
  // State management
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [trends, setTrends] = useState<CostTrend[]>([]);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [featureCosts, setFeatureCosts] = useState<FeatureCostBreakdown[]>([]);
  const [popularStructures, setPopularStructures] = useState<PopularStructure[]>([]);
  const [projection, setProjection] = useState<CostProjection | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  /**
   * Fetch all cost data
   */
  const fetchCostData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        summaryData,
        trendsData,
        structuresData,
      ] = await Promise.all([
        costTrackingService.getCostSummary(),
        costTrackingService.getCostTrends(timeRange),
        costTrackingService.getPopularStructures(20),
      ]);

      // Update state
      setSummary(summaryData);
      setTrends(trendsData);
      setPopularStructures(structuresData);

      // Generate derived data
      const alertsData = generateCostAlerts(summaryData);
      const recommendationsData = generateOptimizationRecommendations(summaryData, structuresData);
      const featureCostsData = calculateFeatureCosts(summaryData);
      const projectionData = projectCosts(trendsData, 'monthly', 'moderate');

      setAlerts(alertsData);
      setRecommendations(recommendationsData);
      setFeatureCosts(featureCostsData);
      setProjection(projectionData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cost data');
      console.error('Error fetching cost data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchCostData();
    const interval = setInterval(fetchCostData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchCostData, refreshInterval]);

  /**
   * Acknowledge an alert
   */
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  /**
   * Mark recommendation as implemented
   */
  const handleImplementRecommendation = (recommendationId: string) => {
    setRecommendations(recommendations.map(rec =>
      rec.id === recommendationId ? { ...rec, implemented: true } : rec
    ));
  };

  // Loading state
  if (loading && !summary) {
    return (
      <div className="cost-dashboard loading">
        <div className="loading-spinner">Loading cost data...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="cost-dashboard error">
        <div className="error-message">
          <h3>Error Loading Cost Data</h3>
          <p>{error}</p>
          <button onClick={fetchCostData}>Retry</button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="cost-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Cost Tracking Dashboard</h1>
          <div className="header-meta">
            <span className="last-update">
              Last updated: {lastUpdate?.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchCostData}
              className="refresh-button"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Time range selector */}
        <div className="time-range-selector">
          {(['24h', '7d', '30d', '90d'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`range-button ${timeRange === range ? 'active' : ''}`}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <section className="alerts-section">
          <h2>Active Alerts</h2>
          <div className="alerts-grid">
            {alerts.filter(a => !a.acknowledged).map(alert => (
              <div
                key={alert.id}
                className={`alert alert-${alert.severity}`}
                onClick={() => onAlertClick?.(alert)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onAlertClick?.(alert);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${alert.severity} alert: ${alert.category}`}
              >
                <div className="alert-icon">
                  {alert.severity === 'critical' ? '🔴' : '⚠️'}
                </div>
                <div className="alert-content">
                  <h3>{alert.category}</h3>
                  <p>{alert.message}</p>
                  <small>{alert.timestamp.toLocaleString()}</small>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcknowledgeAlert(alert.id);
                  }}
                  className="acknowledge-button"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cost Summary Cards */}
      <section className="summary-section">
        <div className="summary-grid">
          {/* Total Cost Card */}
          <div className="summary-card total-cost">
            <h3>Total Cost</h3>
            <div className="cost-value">
              {formatCurrency(summary.total.current)}
            </div>
            <div className="cost-meta">
              <span>
                Projected Monthly: {formatCurrency(summary.total.projected)}
              </span>
              <span className={summary.total.percentOfBudget > 90 ? 'warning' : ''}>
                {formatPercent(summary.total.percentOfBudget)} of budget
              </span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${summary.total.percentOfBudget > 90 ? 'critical' : summary.total.percentOfBudget > 75 ? 'warning' : 'normal'}`}
                style={{ width: `${Math.min(100, summary.total.percentOfBudget)}%` }}
              />
            </div>
          </div>

          {/* Per-User Cost Card */}
          <div className="summary-card per-user-cost">
            <h3>Cost Per User</h3>
            <div className="cost-value">
              {formatCurrency(summary.users.costPerUser, 3)}
            </div>
            <div className="cost-meta">
              <span>Target: {formatCurrency(COST_BUDGETS.perUser.target, 3)}</span>
              <span>Active Users: {summary.users.activeUsers.toLocaleString()}</span>
            </div>
          </div>

          {/* Vercel Cost Card */}
          <div className="summary-card vercel-cost">
            <h3>Vercel</h3>
            <div className="cost-value">
              {formatCurrency(summary.vercel.total)}
            </div>
            <div className="service-metrics">
              <div className="metric">
                <span>Bandwidth:</span>
                <span>{summary.vercel.bandwidth.used.toFixed(1)} GB</span>
              </div>
              <div className="metric">
                <span>Functions:</span>
                <span>{summary.vercel.functions.invocations.toLocaleString()}</span>
              </div>
              <div className="metric">
                <span>Builds:</span>
                <span>{summary.vercel.builds.count}</span>
              </div>
            </div>
          </div>

          {/* Supabase Cost Card */}
          <div className="summary-card supabase-cost">
            <h3>Supabase</h3>
            <div className="cost-value">
              {formatCurrency(summary.supabase.total)}
            </div>
            <div className="service-metrics">
              <div className="metric">
                <span>Database:</span>
                <span>{summary.supabase.database.size.toFixed(1)} GB</span>
              </div>
              <div className="metric">
                <span>Storage:</span>
                <span>{summary.supabase.storage.size.toFixed(1)} GB</span>
              </div>
              <div className="metric">
                <span>Connections:</span>
                <span>{summary.supabase.realtimeConnections.concurrent}</span>
              </div>
            </div>
          </div>

          {/* Simulation Cost Card */}
          <div className="summary-card simulation-cost">
            <h3>Simulations</h3>
            <div className="cost-value">
              {formatCurrency(summary.simulations.costs.total)}
            </div>
            <div className="service-metrics">
              <div className="metric">
                <span>Jobs:</span>
                <span>{summary.simulations.jobs.total.toLocaleString()}</span>
              </div>
              <div className="metric">
                <span>Avg Cost:</span>
                <span>{formatCurrency(summary.simulations.costs.perJob.avg)}</span>
              </div>
              <div className="metric">
                <span>Cache Hits:</span>
                <span>{formatPercent(summary.simulations.caching.hitRate)}</span>
              </div>
            </div>
          </div>

          {/* Projection Card */}
          {projection && (
            <div className="summary-card projection-cost">
              <h3>Monthly Projection</h3>
              <div className="cost-value">
                {formatCurrency(projection.projected)}
              </div>
              <div className="cost-meta">
                <span>Confidence: {projection.confidence}%</span>
                <span>Trend: {projection.basedOn.trend}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Cost Trends Chart */}
      {trends.length > 0 && (
        <section className="trends-section">
          <h2>Cost Trends</h2>
          <div className="chart-container">
            <CostTrendsChart trends={trends} />
          </div>
        </section>
      )}

      {/* Feature Cost Breakdown */}
      {featureCosts.length > 0 && (
        <section className="feature-costs-section">
          <h2>Cost by Feature</h2>
          <div className="feature-costs-table">
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Total Cost</th>
                  <th>Usage</th>
                  <th>Cost Per Use</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {featureCosts.map(feature => (
                  <tr key={feature.feature}>
                    <td>{feature.feature}</td>
                    <td>{formatCurrency(feature.cost)}</td>
                    <td>{feature.usage.toLocaleString()}</td>
                    <td>{formatCurrency(feature.costPerUse, 4)}</td>
                    <td>{formatPercent(feature.percentOfTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <section className="recommendations-section">
          <h2>Optimization Recommendations</h2>
          <div className="recommendations-grid">
            {recommendations.filter(r => !r.implemented).slice(0, 5).map(rec => (
              <div
                key={rec.id}
                className={`recommendation priority-${rec.priority}`}
                onClick={() => onRecommendationClick?.(rec)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRecommendationClick?.(rec);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${rec.priority} priority recommendation: ${rec.title}`}
              >
                <div className="rec-header">
                  <h3>{rec.title}</h3>
                  <span className={`priority-badge ${rec.priority}`}>
                    {rec.priority}
                  </span>
                </div>
                <p>{rec.description}</p>
                <div className="rec-footer">
                  <span className="savings">
                    Est. Savings: {formatCurrency(rec.estimatedSavings)}/mo
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImplementRecommendation(rec.id);
                    }}
                    className="implement-button"
                  >
                    Mark Implemented
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular Structures for Caching */}
      {popularStructures.length > 0 && (
        <section className="popular-structures-section">
          <h2>Top Structures for Caching</h2>
          <div className="structures-table">
            <table>
              <thead>
                <tr>
                  <th>Structure</th>
                  <th>Source</th>
                  <th>Views</th>
                  <th>Simulations</th>
                  <th>Est. Savings</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {popularStructures.filter(s => s.cacheCandidate).slice(0, 10).map(structure => (
                  <tr key={structure.id}>
                    <td>
                      <strong>{structure.id}</strong>
                      <br />
                      <small>{structure.name}</small>
                    </td>
                    <td>{structure.source}</td>
                    <td>{structure.views}</td>
                    <td>{structure.simulations}</td>
                    <td>{formatCurrency(structure.estimatedSavings)}/mo</td>
                    <td>
                      <button className="cache-button">Cache</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Detailed Metrics (Optional) */}
      {showDetailedMetrics && (
        <section className="detailed-metrics-section">
          <h2>Detailed Metrics</h2>
          <div className="metrics-grid">
            <DetailedMetrics summary={summary} />
          </div>
        </section>
      )}
    </div>
  );
};

/**
 * Cost Trends Chart Component (simplified SVG chart)
 */
const CostTrendsChart: React.FC<{ trends: CostTrend[] }> = ({ trends }) => {
  const maxCost = Math.max(...trends.map(t => t.total));
  const width = 800;
  const height = 300;
  const padding = 40;

  const xScale = (width - 2 * padding) / (trends.length - 1);
  const yScale = (height - 2 * padding) / maxCost;

  const points = trends.map((trend, i) => ({
    x: padding + i * xScale,
    y: height - padding - trend.total * yScale,
  }));

  const pathData = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  return (
    <svg width={width} height={height} className="cost-chart">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
        <g key={i}>
          <line
            x1={padding}
            y1={height - padding - maxCost * yScale * fraction}
            x2={width - padding}
            y2={height - padding - maxCost * yScale * fraction}
            stroke="#e0e0e0"
            strokeDasharray="2,2"
          />
          <text
            x={padding - 10}
            y={height - padding - maxCost * yScale * fraction}
            textAnchor="end"
            fontSize="12"
            fill="#666"
          >
            ${(maxCost * fraction).toFixed(0)}
          </text>
        </g>
      ))}

      {/* Cost line */}
      <path
        d={pathData}
        fill="none"
        stroke="#4CAF50"
        strokeWidth="2"
      />

      {/* Data points */}
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="#4CAF50"
        />
      ))}

      {/* Budget threshold line */}
      <line
        x1={padding}
        y1={height - padding - COST_BUDGETS.monthly.total * yScale}
        x2={width - padding}
        y2={height - padding - COST_BUDGETS.monthly.total * yScale}
        stroke="#FF5722"
        strokeWidth="2"
        strokeDasharray="5,5"
      />
      <text
        x={width - padding}
        y={height - padding - COST_BUDGETS.monthly.total * yScale - 5}
        textAnchor="end"
        fontSize="12"
        fill="#FF5722"
      >
        Budget: ${COST_BUDGETS.monthly.total}
      </text>
    </svg>
  );
};

/**
 * Detailed Metrics Component
 */
const DetailedMetrics: React.FC<{ summary: CostSummary }> = ({ summary }) => {
  return (
    <>
      <div className="metric-card">
        <h3>API Calls</h3>
        <div className="metric-value">{summary.custom.apiCalls.total.toLocaleString()}</div>
        <div className="metric-breakdown">
          <div>RCSB: {summary.custom.apiCalls.rcsb.toLocaleString()}</div>
          <div>AlphaFold: {summary.custom.apiCalls.alphafold.toLocaleString()}</div>
          <div>UniProt: {summary.custom.apiCalls.uniprot.toLocaleString()}</div>
        </div>
      </div>

      <div className="metric-card">
        <h3>Visualizations</h3>
        <div className="metric-value">{summary.custom.visualizations.rendered.toLocaleString()}</div>
        <div className="metric-breakdown">
          <div>Cached: {summary.custom.visualizations.cached.toLocaleString()}</div>
          <div>Hit Rate: {formatPercent(summary.custom.visualizations.cacheHitRate)}</div>
        </div>
      </div>

      <div className="metric-card">
        <h3>Sessions</h3>
        <div className="metric-value">{summary.custom.sessions.active}</div>
        <div className="metric-breakdown">
          <div>Collaborative: {summary.custom.sessions.collaborative}</div>
          <div>Avg Duration: {summary.custom.sessions.avgDuration.toFixed(1)} min</div>
        </div>
      </div>

      <div className="metric-card">
        <h3>Simulation Success Rate</h3>
        <div className="metric-value">
          {formatPercent((summary.simulations.jobs.successful / summary.simulations.jobs.total) * 100)}
        </div>
        <div className="metric-breakdown">
          <div>Successful: {summary.simulations.jobs.successful}</div>
          <div>Failed: {summary.simulations.jobs.failed}</div>
        </div>
      </div>
    </>
  );
};

export default CostDashboard;
