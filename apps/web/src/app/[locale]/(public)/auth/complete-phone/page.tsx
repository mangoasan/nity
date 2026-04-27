'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function CompletePhonePage() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }
    // Store token so API calls work
    localStorage.setItem('nity_token', token);
    authApi.getMe().then((user) => {
      if (user.phone) {
        // Already has phone, just log in and redirect
        login(token, user);
        router.push('/');
      } else {
        setReady(true);
      }
    }).catch(() => {
      router.push('/auth/signin');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const updatedUser = await authApi.updatePhone(phone);
      const token = localStorage.getItem('nity_token')!;
      login(token, updatedUser);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to save phone');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl tracking-[0.2em] mb-4" style={{ color: '#4978BC', fontFamily: 'Georgia' }}>
            NITY
          </div>
          <p className="text-[#6b6b6b]">Выполняется вход...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-3xl tracking-[0.2em] mb-4" style={{ color: '#4978BC', fontFamily: 'Georgia, serif' }}>
            NITY
          </div>
          <h1 className="text-3xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
            {t('completePhone')}
          </h1>
          <p className="text-sm text-[#6b6b6b] mt-2">{t('completePhoneSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm text-center" style={{ background: '#FDECEA', color: '#c62828' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full text-sm text-white transition-colors disabled:opacity-50"
            style={{ background: '#4978BC' }}
          >
            {loading ? '...' : t('completePhoneBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}
