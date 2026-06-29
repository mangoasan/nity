import { getTranslations } from 'next-intl/server';
import MastersClient from './MastersClient';

export default async function MastersPage() {
  const t = await getTranslations('masters');

  return (
    <div className="bg-[var(--warm-bg)] py-8 sm:py-12 lg:py-14">
      <div className="page-shell">
        <div className="mb-8 max-w-3xl lg:mb-12">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {t('specialties')}
          </div>
          <h1 className="font-display text-4xl leading-[1.02] text-[var(--dark)] sm:text-5xl lg:text-7xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg">{t('subtitle')}</p>
        </div>
        <MastersClient />
      </div>
    </div>
  );
}
