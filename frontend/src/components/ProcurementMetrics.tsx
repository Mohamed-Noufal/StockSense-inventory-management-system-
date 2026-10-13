import React from 'react';
import { ShoppingBag, Clock, Truck, CheckCircle2 } from 'lucide-react';
import { PurchaseOrder } from '../types';

interface ProcurementMetricsProps {
  orders: PurchaseOrder[];
}

export const ProcurementMetrics: React.FC<ProcurementMetricsProps> = ({ orders }) => {
  const draftCount = orders.filter((o) => o.status === 'DRAFT').length;
  const inFlightCount = orders.filter((o) => o.status === 'APPROVED' || o.status === 'PARTIALLY_RECEIVED').length;
  const receivedCount = orders.filter((o) => o.status === 'RECEIVED').length;

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Total Purchase Orders</span>
          <ShoppingBag className="metric-icon" />
        </div>
        <div className="metric-value">{orders.length}</div>
        <div className="metric-sub">Active & historical procurement orders</div>
      </div>
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Pending Review</span>
          <Clock className="metric-icon" style={{ color: '#fbbf24' }} />
        </div>
        <div className="metric-value">{draftCount}</div>
        <div className="metric-sub">Awaiting officer authorization</div>
      </div>
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Inbound Receiving</span>
          <Truck className="metric-icon" style={{ color: '#ffffff' }} />
        </div>
        <div className="metric-value">{inFlightCount}</div>
        <div className="metric-sub">Pending dock delivery verification</div>
      </div>
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Fulfilled Into Stock</span>
          <CheckCircle2 className="metric-icon" style={{ color: '#34d399' }} />
        </div>
        <div className="metric-value">{receivedCount}</div>
        <div className="metric-sub">100% posted to stock ledger</div>
      </div>
    </div>
  );
};
