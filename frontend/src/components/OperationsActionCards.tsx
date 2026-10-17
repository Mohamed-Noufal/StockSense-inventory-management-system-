import React from 'react';
import { ArrowDownLeft, ArrowLeftRight, Package, ShieldCheck, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface OperationsActionCardsProps {
  onOpenAction: (type: 'ISSUE' | 'TRANSFER' | 'RECEIPT' | 'ADJUSTMENT') => void;
}

export const OperationsActionCards: React.FC<OperationsActionCardsProps> = ({ onOpenAction }) => {
  const { t } = useI18n();

  return (
    <div className="ops-action-grid">
      {/* 1. Issue Stock */}
      <div className="ops-action-card card-issue" onClick={() => onOpenAction('ISSUE')}>
        <div className="ops-action-top">
          <div className="ops-icon-circle icon-issue">
            <ArrowDownLeft style={{ width: 18, height: 18 }} />
          </div>
          <ChevronRight className="ops-card-chevron" style={{ width: 16, height: 16 }} />
        </div>
        <div className="ops-action-content">
          <h3 className="ops-action-title">{t('operations.card_issue_title')}</h3>
          <p className="ops-action-desc">{t('operations.card_issue_desc')}</p>
        </div>
        <button
          type="button"
          className="ops-btn ops-btn-issue"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAction('ISSUE');
          }}
        >
          {t('operations.card_issue_btn')}
        </button>
      </div>

      {/* 2. Transfer Stock */}
      <div className="ops-action-card card-transfer" onClick={() => onOpenAction('TRANSFER')}>
        <div className="ops-action-top">
          <div className="ops-icon-circle icon-transfer">
            <ArrowLeftRight style={{ width: 18, height: 18 }} />
          </div>
          <ChevronRight className="ops-card-chevron" style={{ width: 16, height: 16 }} />
        </div>
        <div className="ops-action-content">
          <h3 className="ops-action-title">{t('operations.card_transfer_title')}</h3>
          <p className="ops-action-desc">{t('operations.card_transfer_desc')}</p>
        </div>
        <button
          type="button"
          className="ops-btn ops-btn-transfer"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAction('TRANSFER');
          }}
        >
          {t('operations.card_transfer_btn')}
        </button>
      </div>

      {/* 3. Receive Stock */}
      <div className="ops-action-card card-receive" onClick={() => onOpenAction('RECEIPT')}>
        <div className="ops-action-top">
          <div className="ops-icon-circle icon-receive">
            <Package style={{ width: 18, height: 18 }} />
          </div>
          <ChevronRight className="ops-card-chevron" style={{ width: 16, height: 16 }} />
        </div>
        <div className="ops-action-content">
          <h3 className="ops-action-title">{t('operations.card_receive_title')}</h3>
          <p className="ops-action-desc">{t('operations.card_receive_desc')}</p>
        </div>
        <button
          type="button"
          className="ops-btn ops-btn-receive"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAction('RECEIPT');
          }}
        >
          {t('operations.card_receive_btn')}
        </button>
      </div>

      {/* 4. Adjust Stock Count */}
      <div className="ops-action-card card-adjust" onClick={() => onOpenAction('ADJUSTMENT')}>
        <div className="ops-action-top">
          <div className="ops-icon-circle icon-adjust">
            <ShieldCheck style={{ width: 18, height: 18 }} />
          </div>
          <ChevronRight className="ops-card-chevron" style={{ width: 16, height: 16 }} />
        </div>
        <div className="ops-action-content">
          <h3 className="ops-action-title">{t('operations.card_adjust_title')}</h3>
          <p className="ops-action-desc">{t('operations.card_adjust_desc')}</p>
        </div>
        <button
          type="button"
          className="ops-btn ops-btn-adjust"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAction('ADJUSTMENT');
          }}
        >
          {t('operations.card_adjust_btn')}
        </button>
      </div>
    </div>
  );
};
