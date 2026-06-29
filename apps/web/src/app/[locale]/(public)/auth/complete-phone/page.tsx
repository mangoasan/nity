'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Alert, Button, Card, TextField } from '@/components/ui/nity';

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

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
    localStorage.setItem('nity_token', token);
    authApi.getMe().then((user) => {
      if (user.phone) {
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
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to save phone'));
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return <AuthLoading />;
  }

  return (
    <div className="flex min-h-[calc(100svh-160px)] items-center justify-center bg-[var(--warm-bg)] px-4 py-10">
      <Card className="w-full max-w-md p-5 sm:p-8">
        <div className="mb-8 text-center">
          <div className="font-display text-4xl text-[var(--accent)]">NITY</div>
          <h1 className="mt-4 font-display text-4xl leading-[1.04] text-[var(--dark)]">
            {t('completePhone')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t('completePhoneSubtitle')}</p>
        </div>

        {error && <Alert tone="error" className="mb-5 text-center">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label={t('phone')}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('phonePlaceholder')}
            required
            autoFocus
          />
          <Button type="submit" full size="lg" disabled={loading}>
            {loading ? '...' : t('completePhoneBtn')}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function AuthLoading() {
  return (
    <div className="flex min-h-[calc(100svh-160px)] items-center justify-center bg-[var(--warm-bg)]">
      <div className="text-center">
        <div className="font-display text-4xl text-[var(--accent)]">NITY</div>
        <p className="mt-3 text-sm text-[var(--muted)]">...</p>
      </div>
    </div>
  );
}
