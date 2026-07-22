import { useI18n } from '../i18n/I18nContext';
import { Icon } from './Icon';

export function AuthorCard() {
  const { t } = useI18n();
  return (
    <section className="author-card" aria-labelledby="author-card-title">
      <div className="author-portrait-wrap">
        <img
          className="author-portrait"
          src="https://authorche.top/poems/logo.jpg"
          alt="AuthorChe — Vadym Yemelianov"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = `${import.meta.env.BASE_URL}openvox-icon.svg`;
          }}
        />
      </div>
      <div className="author-copy">
        <div className="eyebrow">{t('author.eyebrow')}</div>
        <h2 id="author-card-title">{t('author.title')}</h2>
        <p>{t('author.body')}</p>
        <div className="author-actions">
          <a
            className="button button-primary"
            href="https://authorche.top/resume"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="chevron" />
            {t('author.resume')}
          </a>
          <a className="button" href="https://authorche.top" target="_blank" rel="noopener noreferrer">
            <Icon name="home" />
            {t('author.website')}
          </a>
        </div>
      </div>
    </section>
  );
}
