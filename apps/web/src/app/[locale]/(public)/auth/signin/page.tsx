'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SignInPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      login(result.accessToken, result.user);
      router.push('/');
    } catch (err: any) {
      setError(t('signInError'));
    } finally {
      setLoading(false);
    }
  };

  const googleUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?locale=${locale}`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div
            className="text-3xl tracking-[0.2em] mb-4"
            style={{ color: '#4978BC', fontFamily: 'Georgia, serif' }}
          >
            NITY
          </div>
          <h1
            className="text-3xl"
            style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
          >
            {t('signIn')}
          </h1>
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-xl text-sm text-center"
            style={{ background: '#FDECEA', color: '#c62828' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              required
              className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full text-sm text-white transition-colors disabled:opacity-50"
            style={{ background: '#4978BC' }}
          >
            {loading ? '...' : t('signIn')}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#e0d8cc]" />
          </div>
          <div className="relative flex justify-center text-xs text-[#9b9b9b]">
            <span className="px-3 bg-white">или</span>
          </div>
        </div>

        <a
          href={googleUrl}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-full text-sm border border-[#e0d8cc] hover:border-[#4978BC] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('continueWithGoogle')}
        </a>

        <p className="text-center text-sm text-[#6b6b6b] mt-6">
          {t('noAccount')}{' '}
          <Link href="/auth/signup" className="text-[#4978BC] hover:underline">
            {t('signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
}
