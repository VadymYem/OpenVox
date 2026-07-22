import { Seo } from '../components/Seo';
import { useI18n } from '../i18n/I18nContext';

export function PrivacyPage() {
  const { t } = useI18n();
  return (
    <div className="page page-narrow">
      <Seo title={t('privacy.title')} description={t('privacy.body')} path="/privacy" />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">{t('privacy.eyebrow')}</div>
          <h1>{t('privacy.title')}</h1>
          <p>{t('privacy.body')}</p>
        </div>
      </div>
      <section className="card panel">
        <h2>{t('privacy.localTitle')}</h2>
        <p className="hint">{t('privacy.localText')}</p>
        <h2>{t('privacy.analyticsTitle')}</h2>
        <p className="hint">{t('privacy.analyticsText')}</p>
        <h2>{t('privacy.speechTitle')}</h2>
        <p className="hint">{t('privacy.speechText')}</p>
        <h2>{t('privacy.permissionsTitle')}</h2>
        <p className="hint">{t('privacy.permissionsText')}</p>
      </section>
    </div>
  );
}
