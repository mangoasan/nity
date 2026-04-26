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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div
          className="text-2xl tracking-[0.2em] mb-4"
          style={{ color: '#4978BC', fontFamily: 'Georgia' }}
        >
          NITY
        </div>
        <p className="text-[#6b6b6b]">Выполняется вход...</p>
      </div>
    </div>
  );
}
