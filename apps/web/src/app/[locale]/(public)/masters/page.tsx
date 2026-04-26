import { getTranslations } from 'next-intl/server';
import MastersClient from './MastersClient';

export default async function MastersPage() {
  const t = await getTranslations('masters');

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-16">
          <div
            className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{ color: '#4978BC' }}
          >
            Команда
          </div>
          <h1
            className="text-4xl md:text-5xl mb-4"
            style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
          >
            {t('title')}
          </h1>
          <p className="text-[#6b6b6b] text-base sm:text-lg">{t('subtitle')}</p>
        </div>
        <MastersClient />
      </div>
    </div>
  );
}
