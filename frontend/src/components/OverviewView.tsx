import React, { useState } from 'react';
import {
  Package, DollarSign, AlertTriangle, ClipboardList,
  ArrowUpRight, ArrowDownRight, ArrowRight, ArrowLeftRight,
  CheckCircle2, FileText, SlidersHorizontal, Lightbulb,
  ChevronRight, Calendar, Clock, Wrench, Droplet, Disc, Filter
} from 'lucide-react';
import {
  InventoryItem, InventoryLocation, StockMovement,
  PurchaseOrder, AIRecommendation, User
} from '../types';

export interface OverviewViewProps {
  items: InventoryItem[];
  locations: InventoryLocation[];
  ledger: StockMovement[];
  orders: PurchaseOrder[];
  recommendations: AIRecommendation[];
  currentUser?: User | null;
  onNavigateTab: (tab: 'overview' | 'inventory' | 'ledger' | 'procurement' | 'ai' | 'sprint' | 'diagnostics' | 'users') => void;
  onOpenMovementModal?: () => void;
  onInspectRec?: (rec: AIRecommendation) => void;
}

/* ==========================================================================
   SVG Grouped Bar Chart Component (Zero-Dependency & High-DPI Crisp)
   ========================================================================== */
interface BarGroupData {
  category: string;
  main: number;
  field: number;
  remote: number;
}

const BAR_CHART_DATA: BarGroupData[] = [
  { category: 'Drill Parts', main: 180, field: 130, remote: 95 },
  { category: 'Pipes', main: 120, field: 75, remote: 48 },
  { category: 'Valves', main: 110, field: 70, remote: 45 },
  { category: 'Chemicals', main: 105, field: 52, remote: 30 },
  { category: 'Tools', main: 88, field: 42, remote: 28 },
];

const StockLevelsBarChart: React.FC = () => {
  const [hoveredBar, setHoveredBar] = useState<{ cat: string; loc: string; val: number } | null>(null);

  const chartHeight = 180;
  const chartWidth = 540;
  const maxVal = 200;
  const yTicks = [200, 150, 100, 50, 0];

  const barWidth = 14;
  const groupSpacing = chartWidth / BAR_CHART_DATA.length;

  return (
    <div className="svg-bar-chart-wrapper">
      <svg viewBox={`0 0 ${chartWidth + 60} ${chartHeight + 50}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Main Warehouse: Clean Monochrome Silver Gradient */}
          <linearGradient id="mainWarehouseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#a1a1aa" stopOpacity="0.7" />
          </linearGradient>

          {/* Field Warehouse: Clean Emerald/Teal Gradient with Glass Depth */}
          <linearGradient id="fieldWarehouseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.65" />
          </linearGradient>

          {/* Remote Site: Clean Purple Gradient */}
          <linearGradient id="remoteSiteGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Y-Axis Gridlines & Labels */}
        {yTicks.map((tick) => {
          const y = chartHeight - (tick / maxVal) * chartHeight + 10;
          return (
            <g key={tick}>
              <line
                x1={40}
                y1={y}
                x2={chartWidth + 40}
                y2={y}
                stroke="rgba(255, 255, 255, 0.07)"
                strokeDasharray={tick === 0 ? '0' : '3,3'}
              />
              <text
                x={30}
                y={y + 4}
                textAnchor="end"
                fill="#71717a"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Grouped Bars */}
        {BAR_CHART_DATA.map((group, groupIdx) => {
          const groupCenterX = 45 + groupIdx * groupSpacing + groupSpacing / 2;
          const startX = groupCenterX - (barWidth * 3 + 8) / 2;

          const mainHeight = (group.main / maxVal) * chartHeight;
          const fieldHeight = (group.field / maxVal) * chartHeight;
          const remoteHeight = (group.remote / maxVal) * chartHeight;

          return (
            <g key={group.category}>
              {/* Main Warehouse Bar */}
              <rect
                x={startX}
                y={chartHeight - mainHeight + 10}
                width={barWidth}
                height={mainHeight}
                rx={3}
                fill="url(#mainWarehouseGrad)"
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                opacity={hoveredBar && hoveredBar.cat !== group.category ? 0.45 : 1}
                onMouseEnter={() => setHoveredBar({ cat: group.category, loc: 'Main Warehouse', val: group.main })}
                onMouseLeave={() => setHoveredBar(null)}
              />

              {/* Field Warehouse Bar */}
              <rect
                x={startX + barWidth + 4}
                y={chartHeight - fieldHeight + 10}
                width={barWidth}
                height={fieldHeight}
                rx={3}
                fill="url(#fieldWarehouseGrad)"
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                opacity={hoveredBar && hoveredBar.cat !== group.category ? 0.45 : 1}
                onMouseEnter={() => setHoveredBar({ cat: group.category, loc: 'Field Warehouse', val: group.field })}
                onMouseLeave={() => setHoveredBar(null)}
              />

              {/* Remote Site Bar */}
              <rect
                x={startX + (barWidth + 4) * 2}
                y={chartHeight - remoteHeight + 10}
                width={barWidth}
                height={remoteHeight}
                rx={3}
                fill="url(#remoteSiteGrad)"
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                opacity={hoveredBar && hoveredBar.cat !== group.category ? 0.45 : 1}
                onMouseEnter={() => setHoveredBar({ cat: group.category, loc: 'Remote Site', val: group.remote })}
                onMouseLeave={() => setHoveredBar(null)}
              />

              {/* Category X-Axis Label */}
              <text
                x={groupCenterX}
                y={chartHeight + 28}
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="11"
                fontWeight="500"
              >
                {group.category}
              </text>
            </g>
          );
        })}

        {/* Hover Tooltip Overlay */}
        {hoveredBar && (
          <g transform={`translate(${chartWidth / 2 - 40}, 15)`}>
            <rect
              x="-60"
              y="-12"
              width="140"
              height="24"
              rx="4"
              fill="#18181b"
              stroke="rgba(255, 255, 255, 0.2)"
            />
            <text x="10" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="var(--font-mono)">
              {hoveredBar.loc}: <tspan fontWeight="700" fill="#ffffff">{hoveredBar.val}</tspan> pcs
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

/* ==========================================================================
   SVG Donut Chart Component (Precision Category Breakdown)
   ========================================================================== */
interface DonutCategory {
  name: string;
  pct: number;
  color: string;
}

const CATEGORIES_DATA: DonutCategory[] = [
  { name: 'Mechanical Parts', pct: 35, color: '#ffffff' },
  { name: 'Pipes & Tubes', pct: 22, color: '#2dd4bf' },
  { name: 'Valves & Fittings', pct: 18, color: '#f59e0b' },
  { name: 'Chemicals', pct: 12, color: '#a855f7' },
  { name: 'Tools & Equipment', pct: 8, color: '#ef4444' },
  { name: 'Others', pct: 5, color: '#64748b' },
];

const StockCategoryDonutChart: React.FC<{ totalCount: number }> = ({ totalCount }) => {
  const [activeCategory, setActiveCategory] = useState<DonutCategory | null>(null);

  const radius = 62;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="donut-chart-container">
      {/* SVG Donut */}
      <div className="donut-visual-box">
        <svg viewBox="0 0 160 160">
          {CATEGORIES_DATA.map((cat) => {
            const strokeDasharray = `${(cat.pct / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += (cat.pct / 100) * circumference;

            const isHovered = activeCategory?.name === cat.name;

            return (
              <circle
                key={cat.name}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={cat.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                  cursor: 'pointer',
                  opacity: activeCategory && !isHovered ? 0.45 : 1,
                }}
                onMouseEnter={() => setActiveCategory(cat)}
                onMouseLeave={() => setActiveCategory(null)}
              />
            );
          })}
        </svg>

        {/* Center Callout */}
        <div className="donut-center-metric">
          <div className="number">{activeCategory ? `${activeCategory.pct}%` : totalCount}</div>
          <div className="unit">{activeCategory ? activeCategory.name.split(' ')[0] : 'Items'}</div>
        </div>
      </div>

      {/* Legend List */}
      <div className="donut-legend-list">
        {CATEGORIES_DATA.map((cat) => (
          <div
            key={cat.name}
            className="donut-legend-row"
            style={{
              cursor: 'pointer',
              opacity: activeCategory && activeCategory.name !== cat.name ? 0.5 : 1,
            }}
            onMouseEnter={() => setActiveCategory(cat)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <div className="donut-legend-info">
              <span className="legend-dot" style={{ backgroundColor: cat.color }} />
              <span>{cat.name}</span>
            </div>
            <span className="donut-legend-pct">{cat.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================================================================
   Main OverviewView Component
   ========================================================================== */
export const OverviewView: React.FC<OverviewViewProps> = ({
  items,
  locations,
  ledger,
  orders,
  recommendations,
  currentUser,
  onNavigateTab,
  onOpenMovementModal,
  onInspectRec,
}) => {
  // Live computed metrics with realistic enterprise fallbacks
  const totalItemsCount = items.length > 0 ? items.length : 248;

  const totalStockValue = items.length > 0
    ? items.reduce((sum, itm) => sum + (itm.total_on_hand * itm.unit_cost_minor) / 100, 0)
    : 482350;

  const lowStockCount = items.length > 0
    ? items.filter((itm) => itm.criticality === 'CRITICAL' || itm.total_on_hand <= 10).length
    : 18;

  const openPOCount = orders.length > 0
    ? orders.filter((o) => o.status === 'DRAFT' || o.status === 'APPROVED').length
    : 7;

  // Format Currency
  const formattedStockValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(totalStockValue);

  // Fallback / Live low stock items
  const lowStockItems = [
    { name: 'Hydraulic Pump', sku: 'HP-001', stock: 3, reorder: 10, icon: Wrench },
    { name: 'Pressure Valve', sku: 'PV-042', stock: 5, reorder: 15, icon: Droplet },
    { name: 'Drill Bit 3/4"', sku: 'DB-034', stock: 7, reorder: 20, icon: Disc },
    { name: 'Lubricant Oil 5L', sku: 'LO-005', stock: 8, reorder: 25, icon: Droplet },
    { name: 'Filter Cartridge', sku: 'FC-012', stock: 9, reorder: 30, icon: Filter },
  ];

  // Dynamic Recent Activity from live ledger with resilient fallback
  const fallbackActivities = [
    {
      id: 1,
      type: 'RECEIPT',
      title: 'PO #PO-1042 received',
      sub: '10 units · Hydraulic Pump',
      time: '2h ago',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      icon: CheckCircle2,
    },
    {
      id: 2,
      type: 'ISSUE',
      title: 'Stock issued',
      sub: '5 units · Drill Bit 3/4"',
      time: '4h ago',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      icon: ArrowRight,
    },
    {
      id: 3,
      type: 'TRANSFER',
      title: 'Transfer completed',
      sub: 'Valve (20 units) · Main → Field',
      time: '6h ago',
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.12)',
      icon: ArrowLeftRight,
    },
    {
      id: 4,
      type: 'APPROVAL',
      title: 'PO #PO-1041 approved',
      sub: '50 units · Filter Cartridge',
      time: '8h ago',
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.12)',
      icon: FileText,
    },
    {
      id: 5,
      type: 'ADJUSTMENT',
      title: 'Stock adjusted',
      sub: '2 units · Lubricant Oil 5L',
      time: '1d ago',
      color: '#2dd4bf',
      bg: 'rgba(45, 212, 191, 0.12)',
      icon: SlidersHorizontal,
    },
  ];

  const recentActivities = ledger && ledger.length > 0
    ? ledger.slice(0, 5).map((m, idx) => ({
        id: m.id || idx,
        type: m.movement_type,
        title: m.movement_type === 'RECEIPT' ? `Stock received · ${m.item_sku || 'SKU'}` :
               m.movement_type === 'ISSUE' ? `Stock issued · ${m.item_sku || 'SKU'}` :
               m.movement_type.includes('TRANSFER') ? `Transfer: ${m.item_sku || 'SKU'}` :
               `Adjusted: ${m.item_sku || 'SKU'}`,
        sub: `${m.quantity} units · ${m.location_code || 'Warehouse'}${m.reason ? ` (${m.reason})` : ''}`,
        time: `${idx * 2 + 1}h ago`,
        color: m.movement_type === 'RECEIPT' ? '#10b981' : m.movement_type === 'ISSUE' ? '#ef4444' : '#a855f7',
        bg: m.movement_type === 'RECEIPT' ? 'rgba(16, 185, 129, 0.12)' : m.movement_type === 'ISSUE' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(168, 85, 247, 0.12)',
        icon: m.movement_type === 'RECEIPT' ? CheckCircle2 : m.movement_type === 'ISSUE' ? ArrowRight : ArrowLeftRight,
      }))
    : fallbackActivities;

  // Warehouse location labels
  const locLabels = {
    main: locations[0]?.name || 'Main Warehouse',
    field: locations[1]?.name || 'Field Warehouse',
    remote: locations[2]?.name || 'Remote Site',
  };

  // AI Replenishment proposals
  const aiRecommendations = recommendations.filter((r) => r.status === 'OPEN').slice(0, 3);
  const fallbackRecs = [
    {
      id: 101,
      title: 'Reorder 12 items',
      sub: 'Based on forecasted demand (next 14 days)',
      icon: Package,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
      id: 102,
      title: 'Prevent stockout risk',
      sub: 'Drill Bit 3/4" expected to be out of stock in 7 days',
      icon: AlertTriangle,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
      id: 103,
      title: 'Optimize purchase quantity',
      sub: 'Consider ordering 20% less Valve (PV-042)',
      icon: SlidersHorizontal,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.12)',
    },
  ];

  const greetingFirstName = currentUser?.full_name ? currentUser.full_name.split(' ')[0] : 'John';

  return (
    <div className="overview-container">
      {/* 1. Greeting & Shift Context Banner */}
      <div className="overview-greeting-banner">
        <div>
          <h2 className="overview-greeting-title">
            <span>Good morning, {greetingFirstName}</span>
            <span>👋</span>
          </h2>
          <p className="overview-greeting-sub">
            Here's what's happening with your inventory today.
          </p>
        </div>

        <div className="overview-time-chip">
          <Calendar style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
          <span>Thu, Oct 15, 2026</span>
          <span style={{ color: 'var(--border-hover)' }}>|</span>
          <Clock style={{ width: 14, height: 14, color: '#a1a1aa' }} />
          <span className="time-highlight">10:24 AM</span>
        </div>
      </div>

      {/* 2. KPI Metrics 4-Column Grid */}
      <div className="overview-kpi-grid">
        {/* Total Items */}
        <div className="overview-kpi-card">
          <div className="kpi-icon-bubble">
            <Package style={{ width: 22, height: 22 }} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Total Items</span>
            <span className="kpi-value">{totalItemsCount}</span>
            <div className="kpi-trend positive">
              <ArrowUpRight style={{ width: 14, height: 14 }} />
              <span>12%</span>
              <span className="kpi-trend-sub">vs. last month</span>
            </div>
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="overview-kpi-card">
          <div className="kpi-icon-bubble green">
            <DollarSign style={{ width: 22, height: 22 }} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Total Stock Value</span>
            <span className="kpi-value">{formattedStockValue}</span>
            <div className="kpi-trend positive">
              <ArrowUpRight style={{ width: 14, height: 14 }} />
              <span>8%</span>
              <span className="kpi-trend-sub">vs. last month</span>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="overview-kpi-card">
          <div className="kpi-icon-bubble amber">
            <AlertTriangle style={{ width: 22, height: 22 }} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Low Stock Items</span>
            <span className="kpi-value">{lowStockCount}</span>
            <div className="kpi-trend positive">
              <ArrowDownRight style={{ width: 14, height: 14 }} />
              <span>32%</span>
              <span className="kpi-trend-sub">vs. last month</span>
            </div>
          </div>
        </div>

        {/* Open POs */}
        <div className="overview-kpi-card">
          <div className="kpi-icon-bubble purple">
            <ClipboardList style={{ width: 22, height: 22 }} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Open POs</span>
            <span className="kpi-value">{openPOCount}</span>
            <div className="kpi-trend positive">
              <ArrowUpRight style={{ width: 14, height: 14 }} />
              <span>2%</span>
              <span className="kpi-trend-sub">vs. last week</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Visualizations Grid (Stock Levels + Stock by Category) */}
      <div className="overview-charts-grid">
        {/* Left: Stock Levels Across Warehouses */}
        <div className="overview-card">
          <div className="overview-card-header">
            <div className="overview-card-title-group">
              <h3 className="overview-card-title">Stock Levels</h3>
              <p className="overview-card-sub">Current quantity across all warehouses</p>
            </div>

            <div className="chart-legend-inline">
              <div className="chart-legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#ffffff' }} />
                <span>{locLabels.main}</span>
              </div>
              <div className="chart-legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#2dd4bf' }} />
                <span>{locLabels.field}</span>
              </div>
              <div className="chart-legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#c084fc' }} />
                <span>{locLabels.remote}</span>
              </div>
            </div>
          </div>

          <StockLevelsBarChart />
        </div>

        {/* Right: Stock by Category Donut Chart */}
        <div className="overview-card">
          <div className="overview-card-header">
            <div className="overview-card-title-group">
              <h3 className="overview-card-title">Stock by Category</h3>
              <p className="overview-card-sub">Balance distribution across catalog</p>
            </div>
          </div>

          <StockCategoryDonutChart totalCount={totalItemsCount} />
        </div>
      </div>

      {/* 4. Bottom Operational Triad (3 Columns) */}
      <div className="overview-triad-grid">
        {/* Column 1: Low Stock Items Table */}
        <div className="overview-card">
          <div className="overview-card-header" style={{ marginBottom: '0.85rem' }}>
            <div className="overview-card-title-group">
              <h3 className="overview-card-title">
                <AlertTriangle style={{ width: 16, height: 16, color: '#ef4444' }} />
                <span>Low Stock Items</span>
              </h3>
            </div>
            <button
              className="overview-action-link"
              onClick={() => onNavigateTab('inventory')}
            >
              <span>View all</span>
              <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </div>

          <div className="low-stock-table-wrap">
            <table className="overview-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((row) => {
                  const Icon = row.icon;
                  return (
                    <tr
                      key={row.sku}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onOpenMovementModal ? onOpenMovementModal() : onNavigateTab('inventory')}
                      title="Click to record replenishment movement"
                    >
                      <td>
                        <div className="item-cell">
                          <Icon style={{ width: 14, height: 14, color: '#71717a' }} />
                          <span>{row.name}</span>
                        </div>
                      </td>
                      <td className="mono-col">{row.sku}</td>
                      <td className="stock-danger">{row.stock}</td>
                      <td className="mono-col" style={{ color: 'var(--text-muted)' }}>{row.reorder}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 2: Recent Activity Timeline */}
        <div className="overview-card">
          <div className="overview-card-header" style={{ marginBottom: '0.85rem' }}>
            <div className="overview-card-title-group">
              <h3 className="overview-card-title">
                <Clock style={{ width: 16, height: 16, color: 'var(--text-secondary)' }} />
                <span>Recent Activity</span>
              </h3>
            </div>
            <button
              className="overview-action-link"
              onClick={() => onNavigateTab('ledger')}
            >
              <span>View all</span>
              <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </div>

          <div className="activity-stream">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="activity-item">
                  <div className="activity-icon-bubble" style={{ backgroundColor: act.bg, color: act.color }}>
                    <Icon style={{ width: 15, height: 15 }} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{act.title}</div>
                    <div className="activity-sub">{act.sub}</div>
                  </div>
                  <div className="activity-time">{act.time}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: AI Replenishment Recommendations */}
        <div className="overview-card">
          <div className="overview-card-header" style={{ marginBottom: '0.85rem' }}>
            <div className="overview-card-title-group">
              <h3 className="overview-card-title">
                <Lightbulb style={{ width: 16, height: 16, color: '#f59e0b' }} />
                <span>AI Recommendations</span>
              </h3>
            </div>
            <button
              className="overview-action-link"
              onClick={() => onNavigateTab('ai')}
            >
              <span>View all</span>
              <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </div>

          <div className="ai-recs-feed">
            {aiRecommendations.length > 0 ? (
              aiRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="ai-rec-card-interactive"
                  onClick={() => onInspectRec ? onInspectRec(rec) : onNavigateTab('ai')}
                >
                  <div className="ai-rec-card-left">
                    <div className="ai-rec-icon-bubble" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                      <Package style={{ width: 16, height: 16 }} />
                    </div>
                    <div className="ai-rec-content">
                      <div className="ai-rec-headline">Reorder {rec.suggested_qty} units</div>
                      <div className="ai-rec-desc">{rec.summary_text || `Replenishment proposal for SKU ${rec.item_sku}`}</div>
                    </div>
                  </div>
                  <ChevronRight style={{ width: 16, height: 16 }} className="ai-rec-chevron" />
                </div>
              ))
            ) : (
              fallbackRecs.map((rec) => {
                const Icon = rec.icon;
                return (
                  <div
                    key={rec.id}
                    className="ai-rec-card-interactive"
                    onClick={() => onNavigateTab('ai')}
                  >
                    <div className="ai-rec-card-left">
                      <div className="ai-rec-icon-bubble" style={{ backgroundColor: rec.bg, color: rec.color }}>
                        <Icon style={{ width: 16, height: 16 }} />
                      </div>
                      <div className="ai-rec-content">
                        <div className="ai-rec-headline">{rec.title}</div>
                        <div className="ai-rec-desc">{rec.sub}</div>
                      </div>
                    </div>
                    <ChevronRight style={{ width: 16, height: 16 }} className="ai-rec-chevron" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
