import React, { useState } from 'react';
import {
  Layers, Globe, Eye, EyeOff, Loader2, AlertCircle
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
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up state
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('STOREKEEPER');

  const [loading, setLoading] = useState(false);
  const [demoLoadingId, setDemoLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState(false);

  const demoRoles = [
    { id: 1, name: 'John Doe', roleTitle: 'Storekeeper' },
    { id: 2, name: 'Sara Mansour', roleTitle: 'Procurement' },
    { id: 3, name: 'Khaled Hassan', roleTitle: 'Operations' },
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
      await api.registerUser({
        full_name: fullName,
        email: signUpEmail,
        role: role,
        password: signUpPassword,
      });

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
    setDemoLoadingId(userId);
    try {
      const res = await api.demoLogin({ user_id: userId });
      localStorage.setItem('stocksense_token', res.access_token);
      localStorage.setItem('stocksense_current_user_id', String(res.user.id));
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Demo authentication failed');
    } finally {
      setLoading(false);
      setDemoLoadingId(null);
    }
  };

  return (
    <div className="auth-viewport" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Bar with Language Switcher */}
      <div className="auth-top-bar">
        <button
          type="button"
          className="auth-lang-btn"
          onClick={toggleLocale}
          id="auth-lang-toggle"
          title={locale === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
        >
          <Globe style={{ width: 14, height: 14 }} />
          <span>{locale === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </div>

      {/* Centered Minimal Authentication Card */}
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <Layers style={{ width: 22, height: 22 }} />
          </div>
          <h1 className="auth-title">
            {tab === 'signin' ? t('login.welcome_title') : t('login.signup_heading')}
          </h1>
          <p className="auth-subtitle">
            {tab === 'signin' ? t('login.welcome_sub') : t('login.signup_sub')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'signin'}
            className={`auth-tab-btn ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setTab('signin');
              setError(null);
            }}
          >
            <span>{t('login.tab_signin')}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'signup'}
            className={`auth-tab-btn ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
          >
            <span>{t('login.tab_signup')}</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-alert" role="alert">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Forgot Credentials Helper Hint */}
        {forgotNotice && (
          <div className="auth-error-alert" style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#d4d4d8' }}>
            <span>
              {locale === 'ar'
                ? 'للوصول السريع، انقر على أحد أدوار العرض التجريبي المباشرة في الأسفل.'
                : 'For instant review, choose one of the demo access roles below.'}
            </span>
          </div>
        )}

        {/* Sign In Form */}
        {tab === 'signin' && (
          <form className="auth-form" onSubmit={handleSignIn} id="signin-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="signin-email">
                {t('login.email_label')}
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signin-email"
                  type="email"
                  className="auth-input"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="signin-password">
                  {t('login.password_label')}
                </label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => setForgotNotice(!forgotNotice)}
                >
                  {t('login.forgot_password')}
                </button>
              </div>
              <div className="auth-input-wrapper">
                <input
                  id="signin-password"
                  type={showSignInPassword ? 'text' : 'password'}
                  className="auth-input auth-input-password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  title={showSignInPassword ? 'Hide password' : 'Show password'}
                  aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignInPassword ? (
                    <EyeOff style={{ width: 14, height: 14 }} />
                  ) : (
                    <Eye style={{ width: 14, height: 14 }} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="submit-signin-btn"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: 15, height: 15 }} className="spin" />
                  <span>{t('login.authenticating')}</span>
                </>
              ) : (
                <span>{t('login.tab_signin')}</span>
              )}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {tab === 'signup' && (
          <form className="auth-form" onSubmit={handleSignUp} id="signup-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-name">
                {t('login.fullname_label')}
              </label>
              <input
                id="signup-name"
                type="text"
                className="auth-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('login.fullname_placeholder')}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-email">
                {t('login.email_label')}
              </label>
              <input
                id="signup-email"
                type="email"
                className="auth-input"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-role">
                {t('login.role_label')}
              </label>
              <select
                id="signup-role"
                className="auth-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="STOREKEEPER">{t('login.role_storekeeper')}</option>
                <option value="PROCUREMENT_OFFICER">{t('login.role_procurement')}</option>
                <option value="MANAGER">{t('login.role_manager')}</option>
                <option value="AUDITOR">{t('login.role_auditor')}</option>
              </select>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-password">
                {t('login.password_label')}
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-password"
                  type={showSignUpPassword ? 'text' : 'password'}
                  className="auth-input auth-input-password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignUpPassword ? (
                    <EyeOff style={{ width: 14, height: 14 }} />
                  ) : (
                    <Eye style={{ width: 14, height: 14 }} />
                  )}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-confirm-password">
                {t('login.confirm_password_label')}
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input auth-input-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff style={{ width: 14, height: 14 }} />
                  ) : (
                    <Eye style={{ width: 14, height: 14 }} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="submit-signup-btn"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: 15, height: 15 }} className="spin" />
                  <span>{t('login.creating_account')}</span>
                </>
              ) : (
                <span>{t('login.tab_signup')}</span>
              )}
            </button>
          </form>
        )}

        {/* Demo Roles Access */}
        <div className="auth-divider">
          <span>{t('login.demo_divider')}</span>
        </div>

        <div className="auth-demo-grid">
          {demoRoles.map((demo) => {
            const isThisLoading = demoLoadingId === demo.id;
            return (
              <button
                key={demo.id}
                type="button"
                id={`demo-user-btn-${demo.id}`}
                className="auth-demo-btn"
                onClick={() => handleQuickDemo(demo.id)}
                disabled={loading}
                title={`Sign in as ${demo.name}`}
              >
                {isThisLoading ? (
                  <Loader2 style={{ width: 14, height: 14 }} className="spin" />
                ) : (
                  <>
                    <span>{demo.roleTitle}</span>
                    <span className="auth-demo-sub">{demo.name}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Minimal Footer */}
        <div className="auth-footer">
          <span>StockSense Platform</span>
        </div>
      </div>
    </div>
  );
};
