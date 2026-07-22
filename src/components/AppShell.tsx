import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { I18nProvider, useI18n } from '../i18n/I18nContext';
import { Icon } from './Icon';
import { SupportModal } from './SupportModal';
import { MobileExperienceNotice } from './MobileExperienceNotice';
import { SUPPORT_EVENT, shouldPromptForSupport } from '../core/support';

const navItems = [
  ['/', 'home', 'nav.home'],
  ['/studio', 'mic', 'nav.studio'],
  ['/transcribe', 'wave', 'nav.transcribe'],
  ['/score', 'score', 'nav.score'],
  ['/academy', 'spark', 'nav.academy'],
  ['/practice', 'music', 'nav.practice'],
  ['/analyze', 'chart', 'nav.analyze'],
  ['/progress', 'chart', 'nav.progress'],
  ['/instruments', 'music', 'nav.instruments'],
  ['/track-lab', 'wave', 'nav.trackLab'],
  ['/mixer', 'wave', 'nav.mixer'],
  ['/choir', 'users', 'nav.choir'],
  ['/audio-lab', 'settings', 'nav.audioLab'],
  ['/projects', 'folder', 'nav.projects'],
  ['/settings', 'settings', 'nav.settings']
] as const;

function ShellInner() {
  const { settings, setSettings } = useApp();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRoute = useRef(true);

  useEffect(() => {
    const onSupportOpportunity = () => {
      if (shouldPromptForSupport()) setSupportOpen(true);
    };
    window.addEventListener(SUPPORT_EVENT, onSupportOpportunity);
    return () => window.removeEventListener(SUPPORT_EVENT, onSupportOpportunity);
  }, []);

  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    const frame = window.requestAnimationFrame(() => mainRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('common.skipContent')}
      </a>
      <div className="cosmic-backdrop" aria-hidden="true">
        <div className="nebula nebula-a" />
        <div className="nebula nebula-b" />
        <div className="star-layer" />
      </div>
      <header className="topbar">
        <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)} aria-label="OpenVox Studio home">
          <img src={`${import.meta.env.BASE_URL}openvox-icon.svg`} alt="" className="brand-mark" />
          <span>
            <strong>OpenVox Studio</strong>
            <small>{t('brand.by')}</small>
          </span>
        </NavLink>
        <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label={t('common.primaryNavigation')}>
          {navItems.map(([to, icon, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <Icon name={icon} />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="top-actions">
          <button
            className="icon-button theme-toggle"
            onClick={() =>
              setSettings((current) => ({
                ...current,
                theme: current.theme === 'dark' ? 'light' : current.theme === 'light' ? 'system' : 'dark'
              }))
            }
            aria-label={t('common.themeCycle')}
          >
            <Icon name={settings.theme === 'light' ? 'sun' : 'moon'} />
          </button>
          <div className="language-switch" aria-label={t('settings.language')}>
            {(['en', 'uk', 'de'] as const).map((language) => (
              <button
                key={language}
                className={settings.language === language ? 'active' : ''}
                onClick={() => setSettings((current) => ({ ...current, language }))}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={t('common.menu')}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </header>
      <MobileExperienceNotice />
      <main id="main-content" ref={mainRef} className="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="footer">
        <span>© {new Date().getFullYear()} AuthorChe. OpenVox Studio.</span>
        <a href="https://authorche.top" target="_blank" rel="noopener noreferrer">
          authorche.top
        </a>
        <a href="https://github.com/vadymyem/OpenVox" target="_blank" rel="noopener noreferrer">
          {t('common.source')}
        </a>
        <Link to="/about">{t('author.title')}</Link>
        <a href="https://authorche.top/resume" target="_blank" rel="noopener noreferrer">
          {t('author.resume')}
        </a>
        <Link to="/privacy">{t('common.privacy')}</Link>
      </footer>
      <button className="support-fab" onClick={() => setSupportOpen(true)} aria-label={t('common.support')}>
        <Icon name="heart" />
        <span>{t('common.support')}</span>
      </button>
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}

export function AppShell() {
  const { settings } = useApp();
  return (
    <I18nProvider language={settings.language}>
      <ShellInner />
    </I18nProvider>
  );
}
