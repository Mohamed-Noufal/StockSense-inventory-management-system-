import React, { useState } from 'react';

export interface TrendDataPoint {
  date: string;
  stock: number;
}

interface StockTrendChartProps {
  data?: TrendDataPoint[];
  currentStock?: number;
  reorderPoint?: number;
}

const DEFAULT_TREND_DATA: TrendDataPoint[] = [
  { date: 'Jul 20', stock: 38 },
  { date: 'Jul 27', stock: 34 },
  { date: 'Aug 3', stock: 31 },
  { date: 'Aug 10', stock: 29 },
  { date: 'Aug 17', stock: 25 },
  { date: 'Aug 24', stock: 24 },
  { date: 'Aug 31', stock: 20 },
  { date: 'Sep 7', stock: 19 },
  { date: 'Sep 14', stock: 18 },
  { date: 'Sep 21', stock: 15 },
  { date: 'Sep 28', stock: 12 },
  { date: 'Oct 12', stock: 8 },
];

export const StockTrendChart: React.FC<StockTrendChartProps> = ({
  data = DEFAULT_TREND_DATA,
  currentStock = 8,
  reorderPoint = 10,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number; val: TrendDataPoint } | null>(null);

  // Chart dimensions & scaling
  const width = 360;
  const height = 150;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 15;
  const paddingBottom = 26;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const yMax = 40;
  const yTicks = [40, 30, 20, 10, 0];

  // Map data points to SVG coordinates
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * innerWidth;
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

  return (
    <div className="stock-trend-card" style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.01em' }}>
          Stock Trend (Last 12 Weeks)
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
          <span>Current: <strong style={{ color: '#38bdf8' }}>{currentStock}</strong></span>
          <span>ROP: <strong style={{ color: '#f59e0b' }}>{reorderPoint}</strong></span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="stockTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0066fe" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#0284c7" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>

            <filter id="pointGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
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
            stroke="#0066fe"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Key Data Markers */}
          {points.map((pt, i) => {
            const isHovered = hoveredPoint?.index === i;
            // Render circle on key dates (every ~2nd point) or hovered
            const showPoint = i === 0 || i === 2 || i === 4 || i === 6 || i === 8 || i === 10 || i === points.length - 1 || isHovered;
            if (!showPoint) return null;

            return (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3.5}
                  fill={isHovered ? '#38bdf8' : '#0066fe'}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2 : 1.5}
                  filter="url(#pointGlow)"
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={() => setHoveredPoint({ index: i, x: pt.x, y: pt.y, val: pt.data })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* X-Axis Date Labels matching reference mock */}
          {data.map((d, i) => {
            // Show dates like Jul 20, Aug 3, Aug 17, Aug 31, Sep 14, Sep 28, Oct 12
            if (i % 2 !== 0 && i !== data.length - 1) return null;
            const x = paddingLeft + (i / (data.length - 1)) * innerWidth;
            return (
              <text
                key={i}
                x={x}
                y={height - 8}
                textAnchor="middle"
                fill="#64748b"
                fontSize="8.5"
                fontFamily="var(--font-mono)"
              >
                {d.date}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
              transform: 'translate(-50%, -120%)',
              background: '#090d16',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '6px',
              padding: '3px 7px',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            <span style={{ color: '#94a3b8' }}>{hoveredPoint.val.date}: </span>
            <strong style={{ color: '#38bdf8' }}>{hoveredPoint.val.stock} units</strong>
          </div>
        )}
      </div>
    </div>
  );
};
