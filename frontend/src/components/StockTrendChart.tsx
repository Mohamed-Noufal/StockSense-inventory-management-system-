import React, { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface TrendDataPoint {
  date: string;
  stock: number;
}

interface StockTrendChartProps {
  data?: TrendDataPoint[];
  currentStock?: number;
  reorderPoint?: number;
}

export const generateDynamicTrend = (currentStock: number, reorderPoint: number): TrendDataPoint[] => {
  const now = new Date('2026-10-15T12:00:00Z');
  const result: TrendDataPoint[] = [];
  const baseStep = Math.max(1, Math.round(currentStock * 0.08));
  const rolling = currentStock <= reorderPoint
    ? Math.round(reorderPoint * 2.2)
    : Math.max(currentStock + baseStep * 3, Math.round(currentStock * 1.15));

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 86400000);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (i === 0) {
      result.push({ date: dateStr, stock: currentStock });
    } else {
      const progress = (11 - i) / 11;
      const interpolated = Math.round(rolling * (1 - progress) + currentStock * progress);
      const noise = ((i % 3) - 1) * Math.max(1, Math.round(baseStep * 0.3));
      result.push({ date: dateStr, stock: Math.max(0, interpolated + noise) });
    }
  }
  return result;
};

export const StockTrendChart: React.FC<StockTrendChartProps> = ({
  data,
  currentStock = 8,
  reorderPoint = 10,
}) => {
  const { t, locale } = useI18n();
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    y: number;
    val: TrendDataPoint;
    prevVal?: TrendDataPoint;
  } | null>(null);

  // Fallback to dynamic trend derived from item properties if data not provided
  const chartData = data && data.length > 0 ? data : generateDynamicTrend(currentStock, reorderPoint);

  // Chart dimensions & scaling
  const width = 360;
  const height = 150;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 15;
  const paddingBottom = 26;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Dynamically calculate yMax based on highest data value, current stock, and ROP
  const peakVal = Math.max(...chartData.map((d) => d.stock), currentStock, reorderPoint, 1);
  const yMax = Math.max(Math.ceil((peakVal * 1.25) / 10) * 10, 10);
  const yTicks = [
    yMax,
    Math.round(yMax * 0.75),
    Math.round(yMax * 0.5),
    Math.round(yMax * 0.25),
    0,
  ];

  // Map data points to SVG coordinates
  const points = chartData.map((d, i) => {
    const x = paddingLeft + (i / (chartData.length - 1)) * innerWidth;
    const y = paddingTop + innerHeight - (Math.min(yMax, Math.max(0, d.stock)) / yMax) * innerHeight;
    return { x, y, data: d };
  });

  // Build smooth bezier path
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  // Build area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`;

  // Reorder point line Y coordinate
  const ropY = paddingTop + innerHeight - (reorderPoint / yMax) * innerHeight;

  // Handle smooth canvas hover tracking
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    if (!svgRect || svgRect.width <= 0) return;
    const mouseX = e.clientX - svgRect.left;
    const viewBoxX = (mouseX / svgRect.width) * width;

    // Find closest data point
    let closestIndex = 0;
    let minDist = Infinity;
    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - viewBoxX);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = idx;
      }
    });

    const pt = points[closestIndex];
    setHoveredPoint({
      index: closestIndex,
      x: pt.x,
      y: pt.y,
      val: pt.data,
      prevVal: closestIndex > 0 ? points[closestIndex - 1].data : undefined,
    });
  };

  return (
    <div className="stock-trend-card" style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.01em' }}>
          {t('inventory.trend_title')}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
          <span>{t('inventory.trend_current')} <strong style={{ color: '#ffffff' }}>{currentStock}</strong></span>
          <span>{t('inventory.trend_rop')} <strong style={{ color: '#f59e0b' }}>{reorderPoint}</strong></span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="stockTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>

            <filter id="pointGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Y-Axis Horizontal Gridlines & Tick Labels */}
          {yTicks.map((tick) => {
            const y = paddingTop + innerHeight - (tick / yMax) * innerHeight;
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray={tick === 0 ? '0' : '2,3'}
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Reorder Point Reference Guide */}
          <line
            x1={paddingLeft}
            y1={ropY}
            x2={width - paddingRight}
            y2={ropY}
            stroke="#f59e0b"
            strokeDasharray="4,3"
            strokeWidth="1"
            strokeOpacity="0.6"
          />

          {/* Area Fill */}
          <path d={areaD} fill="url(#stockTrendGradient)" />

          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active Hover Crosshair Guideline */}
          {hoveredPoint && (
            <g pointerEvents="none">
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={paddingTop + innerHeight}
                stroke="rgba(255, 255, 255, 0.28)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              {/* Outer halo */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="6.5"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeOpacity="0.85"
                filter="url(#pointGlow)"
              />
              {/* Inner dot */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="3.5"
                fill="#ffffff"
              />
            </g>
          )}

          {/* Baseline Markers */}
          {points.map((pt, i) => {
            const isHovered = hoveredPoint?.index === i;
            if (isHovered) return null; // Rendered via active crosshair above
            const showPoint = i === 0 || i === 3 || i === 6 || i === 9 || i === points.length - 1;
            if (!showPoint) return null;

            return (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={2.5}
                fill="#a1a1aa"
                stroke="#000000"
                strokeWidth={1}
                pointerEvents="none"
              />
            );
          })}

          {/* X-Axis Date Labels with clean non-overlapping spacing */}
          {chartData.map((d, i) => {
            const tickIndices = [0, 3, 6, 9, chartData.length - 1];
            if (!tickIndices.includes(i)) return null;
            const x = paddingLeft + (i / (chartData.length - 1)) * innerWidth;
            return (
              <text
                key={i}
                x={x}
                y={height - 8}
                textAnchor={i === 0 ? 'start' : i === chartData.length - 1 ? 'end' : 'middle'}
                fill="#64748b"
                fontSize="8.5"
                fontFamily="var(--font-mono)"
              >
                {d.date}
              </text>
            );
          })}
        </svg>

        {/* Ultra-Premium Glassmorphic Hover Window */}
        {hoveredPoint && (() => {
          const stock = hoveredPoint.val.stock;
          const diff = stock - reorderPoint;
          const isHealthy = stock > reorderPoint;
          const isAtRop = stock === reorderPoint;
          const prevStock = hoveredPoint.prevVal?.stock;
          const weekDelta = prevStock !== undefined ? stock - prevStock : null;

          // Clamp tooltip position near left/right borders
          const clampTransform =
            hoveredPoint.x < 95
              ? 'translate(-15%, -118%)'
              : hoveredPoint.x > width - 95
              ? 'translate(-85%, -118%)'
              : 'translate(-50%, -118%)';

          return (
            <div
              className="chart-premium-tooltip"
              style={{
                position: 'absolute',
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100}%`,
                transform: clampTransform,
              }}
            >
              {/* Header Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  marginBottom: '0.35rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '0.35rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#94a3b8',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Calendar style={{ width: 11, height: 11, color: '#64748b' }} />
                  {hoveredPoint.val.date}
                </span>
                <span
                  style={{
                    fontSize: '0.64rem',
                    color: '#888888',
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                  }}
                >
                  {locale === 'ar' ? `الأسبوع ${hoveredPoint.index + 1}` : `Week ${hoveredPoint.index + 1}`}
                </span>
              </div>

              {/* Primary Value Display */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.35rem',
                  marginBottom: '0.35rem',
                }}
              >
                <span
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stock}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
                  {locale === 'ar' ? 'وحدة متوفرة' : 'units on-hand'}
                </span>
                {weekDelta !== null && weekDelta !== 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: weekDelta > 0 ? '#34d399' : '#f87171',
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.15rem',
                    }}
                  >
                    {weekDelta > 0 ? (
                      <TrendingUp style={{ width: 10, height: 10 }} />
                    ) : (
                      <TrendingDown style={{ width: 10, height: 10 }} />
                    )}
                    {weekDelta > 0 ? `+${weekDelta}` : weekDelta}
                  </span>
                )}
              </div>

              {/* ROP Safety Status Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.45rem',
                  borderRadius: '5px',
                  background: isHealthy
                    ? 'rgba(16, 185, 129, 0.12)'
                    : isAtRop
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${
                    isHealthy
                      ? 'rgba(16, 185, 129, 0.25)'
                      : isAtRop
                      ? 'rgba(245, 158, 11, 0.25)'
                      : 'rgba(239, 68, 68, 0.25)'
                  }`,
                  color: isHealthy ? '#34d399' : isAtRop ? '#fbbf24' : '#f87171',
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: isHealthy ? '#34d399' : isAtRop ? '#fbbf24' : '#f87171',
                    boxShadow: `0 0 6px ${isHealthy ? '#34d399' : isAtRop ? '#fbbf24' : '#f87171'}`,
                  }}
                />
                <span>
                  {isHealthy
                    ? (locale === 'ar' ? `+${diff} فوق حد الأمان (${reorderPoint})` : `+${diff} above safety threshold (${reorderPoint})`)
                    : isAtRop
                    ? (locale === 'ar' ? `عند حد إعادة الطلب (${reorderPoint})` : `At reorder threshold (${reorderPoint})`)
                    : (locale === 'ar' ? `${Math.abs(diff)} وحدة تحت حد الطلب (إعادة طلب)` : `${Math.abs(diff)} units below ROP (Reorder)`)}
                </span>
              </div>

              {/* Pointer Caret */}
              <div className="tooltip-caret-down" />
            </div>
          );
        })()}
      </div>
    </div>
  );
};

