'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('nity_token', token);
      authApi.getMe().then((user) => {
        login(token, user);
        router.push('/');
      }).catch(() => {
        router.push('/auth/signin');
      });
    } else {
      router.push('/auth/signin');
    }
  }, []);

  return (
    <div className="flex min-h-[calc(100svh-160px)] items-center justify-center bg-[var(--warm-bg)] px-4 py-10">
      <div className="text-center">
        <div className="font-display text-4xl text-[var(--accent)]">NITY</div>
        <p className="mt-3 text-sm text-[var(--muted)]">...</p>
      </div>
    </div>
  );
}
