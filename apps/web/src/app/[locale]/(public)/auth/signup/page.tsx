'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SignUpPage() {
  const t = useTranslations('auth');
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.register(name, email, password, phone || undefined);
      login(result.accessToken, result.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message || t('signUpError'));
    } finally {
      setLoading(false);
    }
  };

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
            {t('signUp')}
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
            <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              required
              className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] transition-colors"
            />
          </div>
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
            <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
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
              minLength={8}
              className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full text-sm text-white transition-colors disabled:opacity-50"
            style={{ background: '#4978BC' }}
          >
            {loading ? '...' : t('signUp')}
          </button>
        </form>

        <p className="text-center text-sm text-[#6b6b6b] mt-6">
          {t('hasAccount')}{' '}
          <Link href="/auth/signin" className="text-[#4978BC] hover:underline">
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
