'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const tHome = useTranslations('home');

  return (
    <footer className="bg-[#1a1a1a] text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div
              className="text-3xl font-light tracking-[0.2em] mb-4"
              style={{ color: '#E8DCC4', fontFamily: 'Georgia, serif' }}
            >
              NITY
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Студия йоги в Астане
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-4">
              Навигация
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/schedule', label: 'Расписание' },
                { href: '/masters', label: 'Мастера' },
                { href: '/personal-training', label: 'Персональные тренировки' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-4">
              Контакты
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#E8DCC4]" />
                <span>{tHome('address')}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={14} className="shrink-0 text-[#E8DCC4]" />
                <span>{tHome('phone')}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={14} className="shrink-0 text-[#E8DCC4]" />
                <span>{tHome('email')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-xs text-gray-600 text-center">
          {t('rights')}
        </div>
      </div>
    </footer>
  );
}
