'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

const LOCALES = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'kk', label: 'KK' },
];

export default function Header() {
  const t = useTranslations('nav');
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/schedule', label: t('schedule') },
    { href: '/masters', label: t('masters') },
    { href: '/personal-training', label: t('personalTraining') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#e0d8cc]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="NITY"
              width={80}
              height={40}
              className="object-contain"
              style={{ maxHeight: '40px', width: 'auto' }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm tracking-wide text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {/* Locale switcher */}
            <div className="flex items-center gap-1">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => router.push(pathname, { locale: l.code })}
                  className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                    locale === l.code
                      ? 'text-[#4978BC] font-medium'
                      : 'text-[#6b6b6b] hover:text-[#1a1a1a]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm text-[#4978BC] hover:underline"
                  >
                    {t('admin')}
                  </Link>
                )}
                <Link
                  href="/account"
                  className="text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
                >
                  {t('myBookings')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
                >
                  {t('signOut')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
                >
                  {t('signIn')}
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm px-4 py-2 bg-[#4978BC] text-white rounded-full hover:bg-[#3a67a8] transition-colors"
                >
                  {t('signUp')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#e0d8cc] py-3">
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center text-sm text-[#6b6b6b] hover:text-[#1a1a1a] py-2.5 px-1 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-2 mt-2 border-t border-[#e0d8cc] space-y-1">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center text-sm text-[#4978BC] py-2.5 px-1"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t('admin')}
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className="flex items-center text-sm text-[#6b6b6b] hover:text-[#1a1a1a] py-2.5 px-1 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('myBookings')}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="flex items-center text-sm text-[#6b6b6b] hover:text-[#1a1a1a] py-2.5 px-1 w-full transition-colors"
                  >
                    {t('signOut')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="flex items-center text-sm text-[#6b6b6b] hover:text-[#1a1a1a] py-2.5 px-1 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('signIn')}
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center justify-center text-sm text-white bg-[#4978BC] hover:bg-[#3a67a8] py-2.5 px-4 rounded-full mt-2 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('signUp')}
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 pt-3 mt-2 border-t border-[#e0d8cc] px-1">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { router.push(pathname, { locale: l.code }); setMenuOpen(false); }}
                  className={`text-xs py-1.5 px-2 rounded transition-colors ${
                    locale === l.code ? 'text-[#4978BC] font-medium' : 'text-[#6b6b6b] hover:text-[#1a1a1a]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
