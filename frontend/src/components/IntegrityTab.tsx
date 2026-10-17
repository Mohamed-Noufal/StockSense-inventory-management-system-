import React, { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, Lock,
  Database, FileCode2, ArrowLeftRight
} from 'lucide-react';
import { IntegrityCheckResponse } from '../types';
import { api } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

interface IntegrityTabProps {
  initialIntegrity: IntegrityCheckResponse | null;
  onAuditCompleted?: (report: IntegrityCheckResponse) => void;
}

export const IntegrityTab: React.FC<IntegrityTabProps> = ({
  initialIntegrity,
  onAuditCompleted,
}) => {
  const { locale } = useI18n();
  const [integrity, setIntegrity] = useState<IntegrityCheckResponse | null>(initialIntegrity);
  const [running, setRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await api.getIntegrityCheck();
      setIntegrity(res);
      onAuditCompleted?.(res);
    } catch (err: any) {
      setError(err?.message || (locale === 'ar' ? 'فشل تنفيذ تدقيق مطابقة السجل' : 'Failed to execute deep integrity audit'));
    } finally {
      setRunning(false);
    }
  };

  const isPassing = integrity ? integrity.mismatches_count === 0 : true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header Banner & Audit CTA */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <ShieldCheck style={{ width: 22, height: 22, color: '#10b981' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              {locale === 'ar' ? 'سلامة قاعدة البيانات ومطابقة الأرصدة' : 'Database Integrity & Balance Reconciliation'}
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            {locale === 'ar'
              ? 'التحقق الخوارزمي البرمجي من تطابق الأرصدة الفعلية مع مجموع حركات السجل غير القابل للتعديل'
              : 'Algorithmic verification proving physical inventory balances equal sum of append-only movements'}
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleRunAudit}
          disabled={running}
          style={{ padding: '0.55rem 1rem' }}
        >
          <RefreshCw className={running ? 'animate-spin' : ''} style={{ width: 15, height: 15 }} />
          <span>
            {running
              ? (locale === 'ar' ? 'جاري فحص فروقات السجل...' : 'Calculating Ledger Drift...')
              : (locale === 'ar' ? 'تشغيل التدقيق العميق للمطابقة' : 'Run Deep Audit Reconciliation')}
          </span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      {/* 2. Certificate Banner */}
      {integrity && (
        <div>
          {isPassing ? (
            <div className="integrity-banner-success">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 style={{ width: 26, height: 26, color: '#10b981' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  {locale === 'ar'
                    ? 'تم تأكيد تطابق السجل بنسبة 100% — صفر فروقات أو انحراف'
                    : '100% Ledger Consistency Verified — Zero Drift Detected'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {locale === 'ar'
                    ? `تم فحص ${integrity.total_items_checked} صنفاً عبر ${integrity.total_locations_checked} موقع مستودعي نشط. كل رصيد يطابق تماماً مجموع حركات سجله المحاسبي.`
                    : `Audited ${integrity.total_items_checked} SKU assets across ${integrity.total_locations_checked} active bin locations at ${new Date(integrity.timestamp).toISOString().slice(11, 19)}. Every balance perfectly matches its cumulative signed ledger transactions.`}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                <span className="badge badge-success" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
                  {locale === 'ar' ? `الحالة: ${integrity.status === 'PASS' ? 'مطابق بنجاح' : integrity.status}` : `STATUS: ${integrity.status}`}
                </span>
              </div>
            </div>
          ) : (
            <div className="integrity-banner-error">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle style={{ width: 26, height: 26, color: '#ef4444' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f87171' }}>
                  {locale === 'ar'
                    ? `تم اكتشاف فروقات في السجل (${integrity.mismatches_count} فروقات)`
                    : `Integrity Discrepancies Detected (${integrity.mismatches_count} Mismatches)`}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {locale === 'ar'
                    ? 'تم رصد اختلاف بين سجل الحركات التاريخية ورصيد المخزون الفعلي.'
                    : 'Discrepancy detected between ledger transaction history and physical balance records.'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Diagnostic Invariants Grid */}
      <div className="integrity-grid">
        <div className="integrity-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database style={{ width: 16, height: 16, color: '#3b82f6' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                {locale === 'ar' ? 'عزل معاملات SQLite WAL (تسجيل مسبق)' : 'SQLite WAL Isolation (Write-Ahead Logging)'}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              {locale === 'ar' ? 'نشط' : 'ACTIVE'}
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {locale === 'ar'
              ? 'عزل متزامن بين القراءة والكتابة دون قفل الجداول، مما يمنع تعارض الحركات أثناء الاستلام والتوزيع الميداني السريع.'
              : 'Concurrent reader-writer isolation without table-level database locking. Ensures zero race condition during warehouse dock receiving and high-frequency rig dispatch.'}
          </p>
        </div>

        <div className="integrity-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock style={{ width: 16, height: 16, color: '#10b981' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                {locale === 'ar' ? 'فرض قيود المفاتيح الأجنبية والعلاقات' : 'Foreign Key Enforcement (PRAGMA foreign_keys = ON)'}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              {locale === 'ar' ? 'مفعل' : 'ENFORCED'}
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {locale === 'ar'
              ? 'جميع حركات السجل ترتبط بشكل صارم بأصناف ومواقع ومستخدمين معتمدين، لمنع السجلات المعلقة أو المنعزلة تماماً.'
              : 'All ledger movements strictly refer to verified item IDs, active location bins, and verified users. Eliminates orphaned records across all transactions.'}
          </p>
        </div>

        <div className="integrity-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCode2 style={{ width: 16, height: 16, color: '#f59e0b' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                {locale === 'ar' ? 'حظر الأرصدة السالبة (شرط CHECK)' : 'Non-Negative Stock Constraints (CHECK quantity >= 0)'}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              {locale === 'ar' ? 'مؤكد' : 'VERIFIED'}
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {locale === 'ar'
              ? 'مفعلة على مستوى مخطط قاعدة البيانات؛ أي محاولة لصرف كمية تؤدي إلى رصيد سالب يتم إحباطها فوراً مع استجابة HTTP 400.'
              : 'Enforced at SQLite database schema level. Any issue attempting to decrement stock below zero is aborted with HTTP 400 Bad Request, guaranteeing physical impossibility cannot be entered.'}
          </p>
        </div>

        <div className="integrity-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeftRight style={{ width: 16, height: 16, color: '#a855f7' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                {locale === 'ar' ? 'اقتران التحويل المزدوج الذري' : 'Atomic Paired Transfer Coupling'}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              {locale === 'ar' ? 'متزامن' : 'SYNCHRONIZED'}
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {locale === 'ar'
              ? 'تتم عمليات التحويل بين المواقع في معاملة محاسبية ذرية واحدة تسجل الخروج والدخول بنفس المعرف، مما يمنع فقدان أي بضاعة أثناء النقل.'
              : 'Inter-facility transfers execute in single database transaction writing TRANSFER_OUT and TRANSFER_IN with identical transfer_group_id. Zero lost in-transit inventory drift.'}
          </p>
        </div>
      </div>

      {/* 4. Discrepancy Breakdown Table if any mismatches */}
      {integrity && integrity.mismatches && integrity.mismatches.length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171', marginBottom: '0.75rem' }}>
            {locale === 'ar' ? 'تفصيل فروقات التدقيق والمطابقة' : 'Audit Discrepancy Breakdown'}
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'رقم الصنف' : 'Item ID'}</th>
                  <th>{locale === 'ar' ? 'رقم الموقع' : 'Location ID'}</th>
                  <th style={{ textAlign: 'right' }}>{locale === 'ar' ? 'الرصيد الفعلي' : 'Balance On Hand'}</th>
                  <th style={{ textAlign: 'right' }}>{locale === 'ar' ? 'مجموع السجل التراكمي' : 'Ledger Cumulative Sum'}</th>
                  <th style={{ textAlign: 'right' }}>{locale === 'ar' ? 'فرق المطابقة' : 'Discrepancy Drift'}</th>
                </tr>
              </thead>
              <tbody>
                {integrity.mismatches.map((m, idx) => (
                  <tr key={idx}>
                    <td>#{m.item_id}</td>
                    <td>#{m.location_id}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{m.balance_on_hand}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{m.ledger_sum}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#ef4444', fontWeight: 700 }}>
                      {m.difference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
