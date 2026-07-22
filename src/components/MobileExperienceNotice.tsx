import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Icon } from './Icon';

const DISMISS_KEY = 'openvox.mobileNotice.dismissed.v1';

export function MobileExperienceNotice() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;
  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Session storage is optional; dismissal still works for the current render.
    }
    setDismissed(true);
  };

  return (
    <aside className="mobile-experience-notice" aria-label={t('mobile.noticeTitle')}>
      <div className="mobile-experience-icon" aria-hidden="true">
        <Icon name="settings" />
      </div>
      <div>
        <strong>{t('mobile.noticeTitle')}</strong>
        <p>{t('mobile.noticeBody')}</p>
      </div>
      <button className="mini-button" onClick={dismiss}>
        {t('mobile.noticeDismiss')}
      </button>
    </aside>
  );
}
