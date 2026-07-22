import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { Icon } from '../components/Icon';
import { useI18n } from '../i18n/I18nContext';
import { proText } from '../i18n/proTranslations';
import { AuthorCard } from '../components/AuthorCard';

export function LandingPage() {
  const { t, language } = useI18n();
  const x = (key: string) => proText(language, key);
  const features = [
    ['shield', 'home.privacyTitle', 'home.privacyBody', '/privacy'],
    ['mic', 'home.pitchTitle', 'home.pitchBody', '/studio'],
    ['music', 'landing.academyTitle', 'landing.academyBody', '/academy'],
    ['spark', 'landing.instrumentsTitle', 'landing.instrumentsBody', '/instruments'],
    ['wave', 'landing.trackTitle', 'landing.trackBody', '/track-lab'],
    ['settings', 'landing.mixerTitle', 'landing.mixerBody', '/mixer'],
    ['chart', 'landing.audioLabTitle', 'landing.audioLabBody', '/audio-lab'],
    ['score', 'home.scoreTitle', 'home.scoreBody', '/score'],
    ['users', 'landing.choirTitle', 'landing.choirBody', '/choir'],
    ['chart', 'landing.progressTitle', 'landing.progressBody', '/progress']
  ] as const;

  return (
    <div className="page">
      <Seo
        title="Your voice. Understood."
        description="Privacy-first voice analysis, vocal education, instrument tuning, multitrack rehearsal, transcription and score editing directly in your browser."
        path="/"
      />
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">{t('hero.eyebrow')}</div>
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.body')}</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/studio">
              <Icon name="mic" />
              {t('hero.open')}
            </Link>
            <a className="button" href="#features">
              <Icon name="spark" />
              {t('hero.learn')}
            </a>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit" />
          <div className="hero-note-card">
            <div className="big-note">A4</div>
            <div className="freq">440.00 Hz · +0 cents</div>
            <div className="meter">
              <span style={{ width: '92%' }} />
            </div>
          </div>
        </div>
      </section>
      <section className="feature-grid" id="features">
        {features.map(([icon, title, body, path]) => (
          <Link className="feature-card feature-card-link" to={path} key={title}>
            <div className="feature-icon">
              <Icon name={icon} />
            </div>
            <h2>{title.startsWith('home.') ? t(title) : x(title)}</h2>
            <p>{body.startsWith('home.') ? t(body) : x(body)}</p>
            <span className="feature-open">
              {x('landing.openModule')} <Icon name="chevron" />
            </span>
          </Link>
        ))}
      </section>
      <AuthorCard />
    </div>
  );
}
