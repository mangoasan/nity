'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Alert, Button, Card, TextField } from '@/components/ui/nity';

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

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
    } catch (err: unknown) {
      setError(errorMessage(err, t('signUpError')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100svh-160px)] items-center justify-center bg-[var(--warm-bg)] px-4 py-10">
      <Card className="w-full max-w-md p-5 sm:p-8">
        <div className="mb-8 text-center">
          <div className="font-display text-4xl text-[var(--accent)]">NITY</div>
          <h1 className="mt-4 font-display text-4xl leading-[1.04] text-[var(--dark)]">
            {t('signUp')}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t('hasAccount')}{' '}
            <Link href="/auth/signin" className="font-semibold text-[var(--accent)]">
              {t('signIn')}
            </Link>
          </p>
        </div>

        {error && <Alert tone="error" className="mb-5 text-center">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label={t('name')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            required
          />
          <TextField
            label={t('phone')}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('phonePlaceholder')}
            required
          />
          <TextField
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            required
          />
          <TextField
            label={t('password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('passwordPlaceholder')}
            required
            minLength={8}
          />
          <Button type="submit" full size="lg" disabled={loading}>
            {loading ? '...' : t('signUp')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
