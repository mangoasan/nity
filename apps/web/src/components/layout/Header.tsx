'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import { useParams } from 'next/navigation';
import {
  CalendarDays,
  Dumbbell,
  Home,
  Shield,
  UserRound,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/components/ui/nity';

const LOCALES = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'kk', label: 'KK' },
];

export default function Header() {
  const t = useTranslations('nav');
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const navLinks = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/schedule', label: t('schedule'), icon: CalendarDays },
    { href: '/masters', label: t('masters'), icon: UsersRound },
    { href: '/personal-training', label: t('personalTraining'), icon: Dumbbell },
  ];

  const mobileTabs = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/schedule', label: t('schedule'), icon: CalendarDays },
    { href: '/masters', label: t('masters'), icon: UsersRound },
    ...(isAdmin ? [{ href: '/admin', label: t('admin'), icon: Shield }] : []),
    { href: user ? '/account' : '/auth/signin', label: t('profile'), icon: UserRound },
  ];

  const switchLocale = (nextLocale: string) => {
    router.push(pathname, { locale: nextLocale });
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-transparent bg-[rgba(250,247,241,0.84)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[rgba(250,247,241,0.78)]">
        <div className="page-shell">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-[76px]">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              <span className="relative h-10 w-10 overflow-hidden rounded-xl bg-[var(--accent)]">
                <Image src="/nity.png" alt="NITY" fill sizes="40px" className="object-cover" priority />
              </span>
            </Link>

            <div className="flex items-center rounded-full bg-white/60 px-1.5 py-1 shadow-[inset_0_0_0_1px_rgba(229,221,200,0.7)] lg:hidden">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => switchLocale(l.code)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold transition',
                    locale === l.code
                      ? 'bg-white text-[var(--accent)] shadow-sm'
                      : 'text-[#9E978A] hover:text-[var(--dark)]',
                  )}
                  type="button"
                >
                  {l.label}
                </button>
              ))}
            </div>

            <nav className="hidden items-center gap-1 rounded-full bg-white/55 p-1 shadow-[inset_0_0_0_1px_rgba(229,221,200,0.7)] lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    isActive(link.href)
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:bg-white hover:text-[var(--dark)]',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <div className="flex items-center rounded-full bg-white/55 px-2 py-1 shadow-[inset_0_0_0_1px_rgba(229,221,200,0.7)]">
                {LOCALES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => switchLocale(l.code)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-semibold transition',
                      locale === l.code
                        ? 'bg-white text-[var(--accent)] shadow-sm'
                        : 'text-[#9E978A] hover:text-[var(--dark)]',
                    )}
                    type="button"
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {user ? (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--accent)] transition hover:border-[var(--accent)]"
                    >
                      <Shield size={15} />
                      {t('admin')}
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className="inline-flex min-h-10 items-center gap-3 rounded-full border border-[var(--border)] bg-white py-1 pl-4 pr-1.5 text-sm font-semibold text-[var(--dark)] transition hover:border-[var(--accent)]"
                  >
                    <span className="max-w-[140px] truncate">{user.name}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] font-display text-base text-white">
                      {user.name?.[0] || 'N'}
                    </span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/signin"
                    className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--dark)]"
                  >
                    {t('signIn')}
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-flex min-h-10 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[#3f6dac]"
                  >
                    {t('signUp')}
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(24,24,27,0.08)] bg-[rgba(250,247,241,0.88)] px-2 pt-2 backdrop-blur-2xl safe-bottom lg:hidden">
        <div className={cn('mx-auto grid max-w-md gap-1', isAdmin ? 'grid-cols-5' : 'grid-cols-4')}>
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition',
                  active ? 'text-[var(--accent)]' : 'text-[#9E978A]',
                )}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
                <span className="max-w-full truncate">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
