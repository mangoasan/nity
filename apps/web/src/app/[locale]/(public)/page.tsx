import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import HomeSchedulePreview from '@/components/sections/HomeSchedulePreview';
import MastersPreview from '@/components/sections/MastersPreview';

export default async function HomePage() {
  const t = await getTranslations('home');
  const tNav = await getTranslations('nav');

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          className="object-cover z-0"
          priority
        />
        <div
          className="absolute inset-0 z-0"
          style={{ background: 'linear-gradient(135deg, rgba(232,220,196,0.75) 0%, rgba(245,240,232,0.6) 50%, rgba(232,238,247,0.55) 100%)' }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="max-w-2xl">
            <div
              className="text-xs sm:text-sm tracking-[0.3em] uppercase mb-4 sm:mb-6"
              style={{ color: '#4978BC' }}
            >
              Астана · Жошы хан, 1
            </div>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-6 sm:mb-8"
              style={{ fontFamily: 'Georgia, serif', fontWeight: 400, color: '#1a1a1a' }}
            >
              {t('heroTitle')}
            </h1>
            <p className="text-base sm:text-lg text-[#4a4a4a] mb-8 sm:mb-10 leading-relaxed max-w-lg">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link
                href="/schedule"
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm tracking-wide transition-colors"
                style={{ background: '#4978BC', color: '#fff' }}
              >
                {t('heroBook')}
              </Link>
              <Link
                href="/schedule"
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm tracking-wide border transition-colors"
                style={{ borderColor: '#4978BC', color: '#4978BC' }}
              >
                {t('heroSchedule')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 md:py-24" style={{ background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <div
                className="text-xs tracking-[0.3em] uppercase mb-4"
                style={{ color: '#4978BC' }}
              >
                О студии
              </div>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl mb-6"
                style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
              >
                {t('aboutTitle')}
              </h2>
              <p className="text-[#6b6b6b] leading-relaxed text-base sm:text-lg">
                {t('aboutText')}
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-[4/3] relative" style={{ background: '#E8DCC4' }}>
              <Image
                src="/about-photo.png"
                alt="О студии Nity"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Preview */}
      <section className="py-16 md:py-24" style={{ background: '#F5F0E8' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 md:mb-12">
            <div>
              <div
                className="text-xs tracking-[0.3em] uppercase mb-4"
                style={{ color: '#4978BC' }}
              >
                Расписание
              </div>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl"
                style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
              >
                {t('scheduleTitle')}
              </h2>
            </div>
            <Link
              href="/schedule"
              className="mt-4 sm:mt-0 text-sm text-[#4978BC] hover:underline self-start sm:self-auto"
            >
              Полное расписание →
            </Link>
          </div>
          <HomeSchedulePreview />
        </div>
      </section>

      {/* Masters */}
      <section className="py-16 md:py-24" style={{ background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 md:mb-12">
            <div>
              <div
                className="text-xs tracking-[0.3em] uppercase mb-4"
                style={{ color: '#4978BC' }}
              >
                Команда
              </div>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl"
                style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
              >
                {t('mastersTitle')}
              </h2>
            </div>
            <Link
              href="/masters"
              className="mt-4 sm:mt-0 text-sm text-[#4978BC] hover:underline self-start sm:self-auto"
            >
              Все мастера →
            </Link>
          </div>
          <MastersPreview />
        </div>
      </section>

      {/* Personal Training CTA */}
      <section className="py-16 md:py-24" style={{ background: '#1a1a1a' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{ color: '#E8DCC4' }}
          >
            Индивидуально
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl mb-6 text-white"
            style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
          >
            {t('ptTitle')}
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
            {t('ptText')}
          </p>
          <Link
            href="/personal-training"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm tracking-wide transition-colors"
            style={{ background: '#E8DCC4', color: '#1a1a1a' }}
          >
            {t('ptCta')}
          </Link>
        </div>
      </section>

      {/* Location */}
      <section className="py-16 md:py-24" style={{ background: '#F5F0E8' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div
                className="text-xs tracking-[0.3em] uppercase mb-4"
                style={{ color: '#4978BC' }}
              >
                Адрес
              </div>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl mb-6 sm:mb-8"
                style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
              >
                {t('locationTitle')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                    style={{ background: '#4978BC' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-[#1a1a1a]">Nity Yoga Studio</div>
                    <div className="text-[#6b6b6b]">{t('address')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: '#4978BC' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.39 2 2 0 0 1 3.07 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.21 8.56a16 16 0 0 0 6.22 6.22l1.32-1.32a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <span className="text-[#6b6b6b]">{t('phone')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: '#4978BC' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <span className="text-[#6b6b6b]">{t('email')}</span>
                </div>
              </div>
            </div>
            {/* Map placeholder */}
            <div
              className="rounded-2xl overflow-hidden aspect-video lg:aspect-auto lg:h-72"
              style={{ background: '#e0d8cc' }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-[#4978BC] mb-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div className="text-sm text-[#6b6b6b]">Астана, Жошы хан, 1</div>
                  <a
                    href="https://2gis.kz/astana/search/Жошы%20хан%201"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#4978BC] hover:underline mt-2 block"
                  >
                    Открыть на карте →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
