import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import HomeSchedulePreview from '@/components/sections/HomeSchedulePreview';
import MastersPreview from '@/components/sections/MastersPreview';

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <div className="bg-[var(--warm-bg)]">
      <section className="page-shell pt-5 lg:pt-8">
        <div className="relative min-h-[620px] overflow-hidden rounded-[32px] bg-[var(--cream)] text-white shadow-[0_24px_70px_-42px_rgba(80,56,32,0.55)] sm:rounded-[36px] lg:min-h-[680px]">
          <Image
            src="/about-photo.png"
            alt="Nity Yoga Studio"
            fill
            priority
            sizes="(min-width: 1024px) 1200px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(24,24,27,0.76)_0%,rgba(24,24,27,0.48)_44%,rgba(24,24,27,0.16)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(to_top,rgba(24,24,27,0.48),transparent)]" />

          <div className="relative z-10 flex min-h-[620px] flex-col justify-between p-5 sm:p-8 lg:min-h-[680px] lg:p-14">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/22 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {t('address')}
            </div>

            <div className="max-w-3xl pb-2">
              <h1 className="font-display text-5xl leading-[0.98] text-white sm:text-6xl lg:text-8xl">
                {t('heroTitle')}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/88 sm:text-lg">
                {t('heroSubtitle')}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/schedule"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--dark)] px-6 text-sm font-semibold text-white transition hover:bg-black"
                >
                  {t('heroBook')}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/schedule"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white/22 px-6 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/30"
                >
                  {t('heroSchedule')}
                </Link>
              </div>
            </div>

            <div className="grid max-w-3xl grid-cols-2 gap-3 rounded-[24px] border border-white/25 bg-white/24 p-4 text-white backdrop-blur-xl sm:grid-cols-4">
              {[
                ['540+', 'students'],
                ['12', 'masters'],
                ['8', 'styles'],
                ['7', 'days'],
              ].map(([value, label]) => (
                <div key={label}>
                  <div className="font-display text-3xl leading-none">{value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-12 sm:py-16 lg:py-20">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {t('scheduleSubtitle')}
            </div>
            <h2 className="font-display text-3xl leading-[1.04] text-[var(--dark)] sm:text-4xl lg:text-5xl">
              {t('scheduleTitle')}
            </h2>
          </div>
          <Link
            href="/schedule"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
          >
            {t('heroSchedule')}
            <ArrowRight size={15} />
          </Link>
        </div>
        <HomeSchedulePreview />
      </section>

      <section className="bg-[#F3ECDD] py-12 sm:py-16 lg:py-20">
        <div className="page-shell">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                {t('aboutTitle')}
              </div>
              <h2 className="font-display text-4xl leading-[1.02] text-[var(--dark)] sm:text-5xl lg:text-6xl">
                {t('aboutTitle')}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#52525B]">
                {t('aboutText')}
              </p>
              <div className="mt-8 grid max-w-md grid-cols-2 gap-5">
                <div>
                  <div className="font-display text-4xl text-[var(--accent)]">8</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">years of practice</div>
                </div>
                <div>
                  <div className="font-display text-4xl text-[var(--accent)]">320+</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">classes monthly</div>
                </div>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[var(--cream)] shadow-[0_18px_44px_-30px_rgba(24,24,27,0.32)] lg:aspect-[4/5]">
              <Image
                src="/nity1.jpeg"
                alt="Nity Yoga Studio entrance"
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-12 sm:py-16 lg:py-20">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {t('mastersSubtitle')}
            </div>
            <h2 className="font-display text-3xl leading-[1.04] text-[var(--dark)] sm:text-4xl lg:text-5xl">
              {t('mastersTitle')}
            </h2>
          </div>
          <Link
            href="/masters"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
          >
            {t('mastersTitle')}
            <ArrowRight size={15} />
          </Link>
        </div>
        <MastersPreview />
      </section>

      <section className="page-shell pb-12 sm:pb-16 lg:pb-20">
        <div className="grid overflow-hidden rounded-[32px] bg-[var(--dark)] text-white shadow-[0_24px_70px_-44px_rgba(24,24,27,0.65)] lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-10 lg:p-14">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--cream)]">
              {t('ptTitle')}
            </div>
            <h2 className="font-display text-4xl leading-[1.02] text-white sm:text-5xl lg:text-6xl">
              {t('ptTitle')}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
              {t('ptText')}
            </p>
            <Link
              href="/personal-training"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--cream)] px-6 text-sm font-semibold text-[var(--dark)] transition hover:bg-[#ded0b8]"
            >
              {t('ptCta')}
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="relative min-h-64 bg-[linear-gradient(135deg,#26344A,#4978BC)]">
            <Image
              src="/nity2.PNG"
              alt="Nity personal training"
              fill
              sizes="(min-width: 1024px) 420px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="page-shell pb-12 sm:pb-16 lg:pb-20">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[28px] bg-white p-6 shadow-[0_1px_0_rgba(24,24,27,0.04),0_18px_38px_-26px_rgba(24,24,27,0.22)] sm:p-8">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {t('locationTitle')}
            </div>
            <h2 className="font-display text-4xl leading-[1.04] text-[var(--dark)]">
              {t('locationTitle')}
            </h2>
            <div className="mt-8 space-y-5">
              <ContactRow icon={<MapPin size={18} />} title="Nity Yoga Studio" text={t('address')} />
              <ContactRow icon={<Phone size={18} />} title={t('phone')} text="9:00 - 22:00" />
              <ContactRow icon={<Mail size={18} />} title={t('email')} text="Nity Yoga Studio" />
            </div>
            <a
              href="https://2gis.kz/astana/search/Жошы%20хан%201"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--dark)] transition hover:border-[var(--accent)]"
            >
              2GIS
            </a>
          </div>
          <div className="relative min-h-80 overflow-hidden rounded-[28px] bg-[#D9E2F1]">
            <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:72px_72px]" />
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent-soft)]" />
            <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_0_12px_rgba(73,120,188,0.14)]" />
            <div className="absolute left-1/2 top-[calc(50%+52px)] -translate-x-1/2 rounded-full bg-[var(--dark)] px-5 py-2 text-sm font-semibold text-white">
              {t('address')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactRow({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-[var(--dark)]">{title}</div>
        <div className="mt-1 text-sm leading-5 text-[var(--muted)]">{text}</div>
      </div>
    </div>
  );
}
