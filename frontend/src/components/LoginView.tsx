import React, { useState } from 'react';
import {
  Layers, Globe, Lock, Mail, User, UserPlus,
  LogIn, AlertCircle, PackageCheck, ShieldCheck, Activity,
  MapPin, Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { User as UserType } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface LoginViewProps {
  onLoginSuccess: (user: UserType, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { t, locale, toggleLocale } = useI18n();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  
  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up state
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('STOREKEEPER');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoRoles = [
    { id: 1, name: 'John Doe', role: 'Storekeeper', color: '#10b981' },
    { id: 2, name: 'Sara Mansour', role: 'Procurement', color: '#6366f1' },
    { id: 3, name: 'Khaled Hassan', role: 'Operations Mgr', color: '#f59e0b' },
  ];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setError(locale === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please provide work email and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: signInEmail, password: signInPassword });
      localStorage.setItem('stocksense_token', res.access_token);
      localStorage.setItem('stocksense_current_user_id', String(res.user.id));
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || (locale === 'ar' ? 'بيانات الاعتماد غير صحيحة' : 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !signUpEmail || !signUpPassword) {
      setError(locale === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please complete all required fields');
      return;
    }
    if (signUpPassword.length < 6) {
      setError(t('login.password_short'));
      return;
    }
    if (signUpPassword !== confirmPassword) {
      setError(t('login.password_mismatch'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // 1. Register new user in DB
      await api.registerUser({
        full_name: fullName,
        email: signUpEmail,
        role: role,
        password: signUpPassword,
      });

      // 2. Seamlessly authenticate to obtain JWT
      const loginRes = await api.login({
        email: signUpEmail,
        password: signUpPassword,
      });

      localStorage.setItem('stocksense_token', loginRes.access_token);
      localStorage.setItem('stocksense_current_user_id', String(loginRes.user.id));
      onLoginSuccess(loginRes.user, loginRes.access_token);
    } catch (err: any) {
      setError(err.message || (locale === 'ar' ? 'فشل إنشاء الحساب. قد يكون البريد مسجلاً بالفعل' : 'Registration failed. Email may already be in use.'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (userId: number) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.demoLogin({ user_id: userId });
      localStorage.setItem('stocksense_token', res.access_token);
      localStorage.setItem('stocksense_current_user_id', String(res.user.id));
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Demo authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      {/* -------------------------------------------------------------
          Left Panel: Industrial Operational Hero
          ------------------------------------------------------------- */}
      <div className="login-hero-panel">
        <div className="login-hero-top">
          <div className="login-hero-badge">
            <span className="hero-pulse-dot" />
            <span>{t('login.hero_badge')}</span>
          </div>
        </div>

        <div className="login-hero-center">
          <h1 className="login-hero-title">{t('login.hero_title')}</h1>
          <p className="login-hero-desc">{t('login.hero_desc')}</p>

          <div className="login-telemetry-grid">
            <div className="telemetry-card">
              <div className="telemetry-card-icon emerald">
                <PackageCheck style={{ width: 18, height: 18 }} />
              </div>
              <div className="telemetry-stat-value">{t('login.metric_assets')}</div>
              <div className="telemetry-stat-label">{t('login.metric_assets_label')}</div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-card-icon indigo">
                <ShieldCheck style={{ width: 18, height: 18 }} />
              </div>
              <div className="telemetry-stat-value">{t('login.metric_wal')}</div>
              <div className="telemetry-stat-label">{t('login.metric_wal_label')}</div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-card-icon amber">
                <Activity style={{ width: 18, height: 18 }} />
              </div>
              <div className="telemetry-stat-value">{t('login.metric_uptime')}</div>
              <div className="telemetry-stat-label">{t('login.metric_uptime_label')}</div>
            </div>
          </div>
        </div>

        <div className="login-hero-footer">
          <div className="hero-facility-tag">
            <MapPin style={{ width: 14, height: 14, color: '#10b981' }} />
            <span>{t('login.facility_label')}</span>
          </div>
          <span className="font-mono" style={{ fontSize: '0.74rem' }}>StockSense v2.4-PROD</span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          Right Panel: Interactive Authentication Station
          ------------------------------------------------------------- */}
      <div className="login-auth-panel">
        <div className="login-auth-container">
          {/* Top Bar with Brand & Language Toggle */}
          <div className="login-auth-top-bar">
            <div className="login-brand-group">
              <div className="login-brand-icon">
                <Layers style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <div className="login-brand-title">{t('login.title')}</div>
                <div className="login-brand-sub">{t('login.subtitle')}</div>
              </div>
            </div>

            <button
              type="button"
              className="lang-toggle-btn"
              onClick={toggleLocale}
              title={locale === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
              id="auth-lang-toggle"
            >
              <Globe style={{ width: 14, height: 14, color: '#10b981' }} />
              <span>{t('header.language')}</span>
            </button>
          </div>

          {/* Tab Switcher: Sign In vs Create Account */}
          <div className="login-tabs">
            <button
              type="button"
              id="tab-signin-btn"
              className={`login-tab-btn ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
            >
              <LogIn style={{ width: 15, height: 15 }} />
              <span>{t('login.tab_signin')}</span>
            </button>
            <button
              type="button"
              id="tab-signup-btn"
              className={`login-tab-btn ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
            >
              <UserPlus style={{ width: 15, height: 15 }} />
              <span>{t('login.tab_signup')}</span>
            </button>
          </div>

          {/* Error Alert Display */}
          {error && (
            <div className="login-error-alert" role="alert">
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form 1: Sign In */}
          {tab === 'signin' && (
            <form className="login-form" onSubmit={handleSignIn} id="signin-form">
              <div className="form-group">
                <label className="form-label" htmlFor="signin-email">
                  {t('login.email_label')}
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signin-email"
                    type="email"
                    className="form-input ltr-field"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@company.oilfield"
                    required
                    autoComplete="email"
                  />
                  <Mail style={{ width: 15, height: 15 }} className="form-input-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signin-password">
                  {t('login.password_label')}
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signin-password"
                    type="password"
                    className="form-input ltr-field"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <Lock style={{ width: 15, height: 15 }} className="form-input-icon" />
                </div>
              </div>

              <button
                type="submit"
                id="submit-signin-btn"
                className="login-submit-btn"
                disabled={loading}
              >
                <LogIn style={{ width: 16, height: 16 }} />
                <span>{loading ? t('login.authenticating') : t('login.signin_btn')}</span>
              </button>
            </form>
          )}

          {/* Form 2: Sign Up / Create Account */}
          {tab === 'signup' && (
            <form className="login-form" onSubmit={handleSignUp} id="signup-form">
              <div className="form-group">
                <label className="form-label" htmlFor="signup-name">
                  {t('login.fullname_label')}
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signup-name"
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('login.fullname_placeholder')}
                    required
                  />
                  <User style={{ width: 15, height: 15 }} className="form-input-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-email">
                  {t('login.email_label')}
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signup-email"
                    type="email"
                    className="form-input ltr-field"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="name@company.oilfield"
                    required
                    autoComplete="email"
                  />
                  <Mail style={{ width: 15, height: 15 }} className="form-input-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-role">
                  {t('login.role_label')}
                </label>
                <div className="form-input-wrapper">
                  <select
                    id="signup-role"
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="STOREKEEPER">{t('login.role_storekeeper')}</option>
                    <option value="PROCUREMENT_OFFICER">{t('login.role_procurement')}</option>
                    <option value="MANAGER">{t('login.role_manager')}</option>
                    <option value="AUDITOR">{t('login.role_auditor')}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-password">
                  {t('login.password_label')}
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signup-password"
                    type="password"
                    className="form-input ltr-field"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="new-password"
                  />
                  <Lock style={{ width: 15, height: 15 }} className="form-input-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-confirm-password">
                  {t('login.confirm_password_label')}
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signup-confirm-password"
                    type="password"
                    className="form-input ltr-field"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="new-password"
                  />
                  <Lock style={{ width: 15, height: 15 }} className="form-input-icon" />
                </div>
              </div>

              <button
                type="submit"
                id="submit-signup-btn"
                className="login-submit-btn"
                disabled={loading}
              >
                <UserPlus style={{ width: 16, height: 16 }} />
                <span>{loading ? t('login.creating_account') : t('login.signup_btn')}</span>
              </button>
            </form>
          )}

          {/* Quick-Access Demo Sandbox Bar */}
          <div className="login-demo-bar">
            <div className="login-demo-bar-title">
              <Sparkles style={{ width: 13, height: 13, color: '#10b981' }} />
              <span>{t('login.demo_bar_title')}</span>
            </div>
            <div className="login-demo-pills">
              {demoRoles.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  id={`demo-user-btn-${demo.id}`}
                  className="demo-role-btn"
                  onClick={() => handleQuickDemo(demo.id)}
                  disabled={loading}
                  title={`1-Click Instant Login as ${demo.name}`}
                >
                  <span className="demo-role-dot" style={{ backgroundColor: demo.color }} />
                  <span>{demo.name}</span>
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>({demo.role})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
