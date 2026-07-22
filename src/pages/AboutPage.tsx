import { Seo } from '../components/Seo';
import { useI18n } from '../i18n/I18nContext';
import { AuthorCard } from '../components/AuthorCard';
export function AboutPage() {
  const { t } = useI18n();
  return (
    <div className="page page-narrow">
      <Seo title={t('about.title')} description={t('about.body')} path="/about" />
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="eyebrow">{t('about.eyebrow')}</div>
          <h1>{t('about.title')}</h1>
          <p>{t('about.body')}</p>
        </div>
      </div>
      <AuthorCard />
    </div>
  );
}
