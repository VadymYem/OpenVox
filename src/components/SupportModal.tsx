import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Icon } from './Icon';

export function SupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      role="presentation"
    >
      <section
        ref={dialogRef}
        className="modal-card support-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-title"
      >
        <button ref={closeRef} className="icon-button modal-close" onClick={onClose} aria-label={t('common.close')}>
          <Icon name="close" />
        </button>
        <div className="modal-symbol">
          <Icon name="heart" />
        </div>
        <div className="eyebrow">{t('support.eyebrow')}</div>
        <h2 id="support-title">{t('support.title')}</h2>
        <p>{t('support.body')}</p>
        <div className="support-modal-actions">
          <a
            className="button button-primary button-wide"
            href="https://authorche.top/donate"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => window.setTimeout(onClose, 250)}
          >
            <Icon name="heart" />
            {t('support.action')}
          </a>
          <button className="button button-wide" onClick={onClose}>
            {t('support.later')}
          </button>
        </div>
        <small className="support-note">{t('support.note')}</small>
      </section>
    </div>
  );
}
