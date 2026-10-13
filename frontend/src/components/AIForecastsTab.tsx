import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { InventoryItem } from '../types';
import { api } from '../api/client';

interface AIForecastsTabProps {
  items: InventoryItem[];
}

export const AIForecastsTab: React.FC<AIForecastsTabProps> = ({ items }) => {
  const [selectedItemId, setSelectedItemId] = useState<number>(items[0]?.id || 1);
  const [horizon, setHorizon] = useState<number>(8);
  const [loading, setLoading] = useState<boolean>(true);
  const [forecastData, setForecastData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = async (itemId: number, h: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getItemForecast(itemId, h);
      setForecastData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch forecast from model engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItemId) {
      fetchForecast(selectedItemId, horizon);
    }
  }, [selectedItemId, horizon]);

  // SVG Chart Dimensions & Computations
  const observed: number[] = forecastData?.observed_demand || [];
  const points: any[] = forecastData?.forecast_points || [];

  const maxObserved = observed.length > 0 ? Math.max(...observed, 5) : 10;
  const maxForecast = points.length > 0 ? Math.max(...points.map((p) => p.p90 || p.mean), 5) : 10;
  const maxY = Math.ceil(Math.max(maxObserved, maxForecast) * 1.25);

  const svgWidth = 720;
  const svgHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const observedCount = Math.min(observed.length, 24); // Show last 24 weeks for legibility
  const totalPeriods = observedCount + points.length;
  const colWidth = chartWidth / (totalPeriods || 1);

  const getYPos = (val: number) => {
    const clamped = Math.max(0, Math.min(val, maxY));
    return paddingTop + chartHeight - (clamped / (maxY || 1)) * chartHeight;
  };

  return (
    <div className="ai-forecast-workspace">
      {/* Top Controls Toolbar */}
      <div className="ai-forecast-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: 480 }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Select Part:</label>
          <select
            className="form-select"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(Number(e.target.value))}
            style={{ fontSize: '0.8rem' }}
          >
            {items.map((itm) => (
              <option key={itm.id} value={itm.id}>
                {itm.sku} — {itm.name} (Stock: {itm.total_on_hand})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Horizon:</span>
          {[4, 8, 12].map((h) => (
            <button
              key={h}
              type="button"
              className={`btn ${horizon === h ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
              onClick={() => setHorizon(h)}
            >
              {h} Weeks
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle style={{ width: 16, height: 16 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Split-View (Main Chart ~66% | Side Panel ~34%) */}
      <div className="ai-forecast-split-view">
        {/* Main Panel: Weekly Observed Demand & Quantile Forecast */}
        <div className="ai-forecast-chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp style={{ width: 16, height: 16, color: '#38bdf8' }} />
                <span>Observed Demand vs Forward Quantile Forecast</span>
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                Showing last {observedCount} observed weeks and +{points.length} forecast weeks with P50 and P90 uncertainty bounds.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.72rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, background: '#3b82f6', borderRadius: 2 }} />
                <span style={{ color: 'var(--text-secondary)' }}>Observed History</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, background: '#10b981', borderRadius: 2 }} />
                <span style={{ color: 'var(--text-secondary)' }}>Forecast P50</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, background: 'rgba(56, 189, 248, 0.25)', borderRadius: 2 }} />
                <span style={{ color: 'var(--text-secondary)' }}>P90 Upper Ribbon</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', gap: '0.5rem' }}>
              <RefreshCw className="animate-spin" style={{ width: 16, height: 16 }} />
              <span>Fetching model forecast & demand series...</span>
            </div>
          ) : (
            <div className="ai-timeline-container">
              <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                {/* Horizontal Gridlines */}
                {[0, 0.33, 0.66, 1].map((pct, i) => {
                  const y = paddingTop + chartHeight * (1 - pct);
                  const val = Math.round(maxY * pct);
                  return (
                    <g key={i}>
                      <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="#1c1c20" strokeWidth="1" strokeDasharray="3 3" />
                      <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fill="#52525b" fontSize="9" fontFamily="var(--font-mono)">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Separation Divider between History and Future */}
                <line
                  x1={paddingLeft + observedCount * colWidth}
                  y1={paddingTop}
                  x2={paddingLeft + observedCount * colWidth}
                  y2={paddingTop + chartHeight}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <text
                  x={paddingLeft + observedCount * colWidth + 4}
                  y={paddingTop + 12}
                  fill="#fbbf24"
                  fontSize="8"
                  fontWeight="600"
                >
                  TODAY (CUTOFF)
                </text>

                {/* Historical Observed Demand Bars */}
                {observed.slice(-observedCount).map((val, idx) => {
                  const x = paddingLeft + idx * colWidth + colWidth * 0.15;
                  const barW = Math.max(3, colWidth * 0.7);
                  const barY = getYPos(val);
                  const barH = paddingTop + chartHeight - barY;
                  return (
                    <g key={`obs-${idx}`}>
                      <rect
                        x={x}
                        y={barY}
                        width={barW}
                        height={Math.max(0, barH)}
                        fill="#3b82f6"
                        opacity={val > 0 ? "0.85" : "0.15"}
                        rx="2"
                      />
                    </g>
                  );
                })}

                {/* Future Quantile Forecast Ribbons (P90) */}
                {points.length > 1 && (
                  <path
                    d={`
                      M ${paddingLeft + observedCount * colWidth} ${getYPos(points[0].mean)}
                      ${points.map((p, i) => `L ${paddingLeft + (observedCount + i) * colWidth + colWidth * 0.5} ${getYPos(p.p90)}`).join(' ')}
                      L ${paddingLeft + (observedCount + points.length - 1) * colWidth + colWidth * 0.5} ${getYPos(points[points.length - 1].mean)}
                      ${points.slice().reverse().map((p, i) => `L ${paddingLeft + (observedCount + points.length - 1 - i) * colWidth + colWidth * 0.5} ${getYPos(p.mean)}`).join(' ')}
                      Z
                    `}
                    fill="rgba(56, 189, 248, 0.15)"
                    stroke="none"
                  />
                )}

                {/* Future Forecast Mean Line (P50) */}
                {points.length > 0 && (
                  <path
                    d={`
                      M ${paddingLeft + (observedCount - 1) * colWidth + colWidth * 0.5} ${getYPos(observed[observed.length - 1] || 0)}
                      ${points.map((p, i) => `L ${paddingLeft + (observedCount + i) * colWidth + colWidth * 0.5} ${getYPos(p.mean)}`).join(' ')}
                    `}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Forecast Point Nodes */}
                {points.map((p, i) => {
                  const cx = paddingLeft + (observedCount + i) * colWidth + colWidth * 0.5;
                  const cy = getYPos(p.mean);
                  return (
                    <circle key={`pt-${i}`} cx={cx} cy={cy} r="3.5" fill="#10b981" stroke="#09090b" strokeWidth="1.5" />
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Side Panel: Method & Policy Explanation */}
        <div className="ai-forecast-side-card">
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Forecasting Model Rationale
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>
              {forecastData?.selected_method || 'TSB'} Algorithm
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              Pattern: {forecastData?.demand_pattern || 'Intermittent'}
            </div>
          </div>

          <div style={{ padding: '0.75rem', background: '#121214', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '0.78rem', lineHeight: '1.45', color: '#ffffff' }}>
            {forecastData?.method_rationale || 'TSB was selected for this intermittent-demand series because it estimates both the probability of demand occurring and the expected size when it occurs.'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem' }}>
            <div className="card" style={{ padding: '0.55rem 0.75rem' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weekly Mean</div>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.95rem', marginTop: 2 }}>
                {forecastData?.forecast_mean !== undefined ? Number(forecastData.forecast_mean).toFixed(2) : '—'} units
              </div>
            </div>

            <div className="card" style={{ padding: '0.55rem 0.75rem' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Safety Stock</div>
              <div style={{ fontWeight: 600, color: '#34d399', fontSize: '0.95rem', marginTop: 2 }}>
                {forecastData?.policy?.safety_stock || 0} units
              </div>
            </div>

            <div className="card" style={{ padding: '0.55rem 0.75rem' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reorder Point</div>
              <div style={{ fontWeight: 600, color: '#fbbf24', fontSize: '0.95rem', marginTop: 2 }}>
                {forecastData?.policy?.reorder_point || 0} units
              </div>
            </div>

            <div className="card" style={{ padding: '0.55rem 0.75rem' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order-Up-To</div>
              <div style={{ fontWeight: 600, color: '#60a5fa', fontSize: '0.95rem', marginTop: 2 }}>
                {forecastData?.policy?.order_up_to || 0} units
              </div>
            </div>
          </div>

          <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Data Cutoff: {forecastData?.data_cutoff ? new Date(forecastData.data_cutoff).toUTCString() : 'Active'} • 52 Weeks History
          </div>
        </div>
      </div>
    </div>
  );
};
