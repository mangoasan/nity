'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Mail, MapPin, Phone } from 'lucide-react';
import { SectionLabel } from '@/components/ui/nity';

export default function Footer() {
  const t = useTranslations('footer');
  const tHome = useTranslations('home');
  const tNav = useTranslations('nav');

  return (
    <footer className="mt-auto hidden bg-[var(--dark)] text-white lg:block">
      <div className="page-shell py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_1fr_0.8fr]">
          <div>
            <div className="font-display text-4xl text-[var(--cream)]">NITY</div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#A8A199]">
              {tHome('heroSubtitle')}
            </p>
          </div>

          <FooterColumn
            title={tNav('schedule')}
            links={[
              { href: '/', label: tNav('home') },
              { href: '/schedule', label: tNav('schedule') },
              { href: '/masters', label: tNav('masters') },
              { href: '/personal-training', label: tNav('personalTraining') },
            ]}
          />

          <div>
            <SectionLabel className="mb-4 text-[#71717A]">{tNav('contact')}</SectionLabel>
            <div className="space-y-4 text-sm text-[#D4CCBB]">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--cream)]" />
                <span>{tHome('address')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-[var(--cream)]" />
                <span>{tHome('phone')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-[var(--cream)]" />
                <span>{tHome('email')}</span>
              </div>
            </div>
          </div>

          <div>
            <SectionLabel className="mb-4 text-[#71717A]">Social</SectionLabel>
            <div className="flex items-center gap-3 text-sm text-[#D4CCBB]">
              <a
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
                href="https://www.instagram.com/nity.kz/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
                href="https://wa.me/77476810582"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-[#71717A]">
          {t('rights')}
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12.04 2a9.92 9.92 0 0 0-8.45 15.12L2.46 22l4.99-1.1A9.94 9.94 0 1 0 12.04 2Zm0 1.8a8.13 8.13 0 0 1 6.82 12.55 8.15 8.15 0 0 1-10.9 2.72l-.31-.18-2.77.61.63-2.67-.2-.32A8.12 8.12 0 0 1 12.04 3.8Zm-3.1 3.8c-.18 0-.46.07-.7.34-.24.26-.92.9-.92 2.2 0 1.29.94 2.54 1.07 2.71.13.18 1.82 2.9 4.5 3.95 2.23.88 2.69.7 3.17.66.49-.04 1.57-.64 1.79-1.26.22-.62.22-1.15.15-1.26-.06-.11-.24-.18-.51-.31-.26-.13-1.56-.77-1.8-.86-.24-.09-.42-.13-.6.13-.17.26-.68.86-.83 1.04-.15.17-.31.2-.57.06-.27-.13-1.12-.41-2.13-1.31-.79-.7-1.32-1.57-1.47-1.84-.15-.26-.02-.4.12-.53.12-.12.26-.31.4-.46.13-.16.17-.27.26-.45.09-.17.04-.33-.02-.46-.07-.13-.6-1.45-.82-1.99-.22-.52-.43-.45-.6-.46h-.55Z" />
    </svg>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <SectionLabel className="mb-4 text-[#71717A]">{title}</SectionLabel>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-[#D4CCBB] transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
