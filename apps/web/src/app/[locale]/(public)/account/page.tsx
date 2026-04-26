'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import { bookingsApi, Booking } from '@/lib/api';

export default function AccountPage() {
  const t = useTranslations('bookings');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      bookingsApi.getMyBookings().then((data) => {
        setBookings(data);
        setLoading(false);
      });
    }
  }, [user]);

  const handleCancel = async (id: string) => {
    if (!confirm(t('cancelConfirm'))) return;
    setCancelling(id);
    try {
      await bookingsApi.cancel(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' as const } : b))
      );
    } finally {
      setCancelling(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-16 max-w-3xl mx-auto px-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#f5f0e8] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  const statusColors: Record<string, string> = {
    CONFIRMED: '#E8F5E9',
    CANCELLED: '#F5F0E8',
    ATTENDED: '#E3F2FD',
    NO_SHOW: '#FDECEA',
  };
  const statusTextColors: Record<string, string> = {
    CONFIRMED: '#2e7d32',
    CANCELLED: '#9b9b9b',
    ATTENDED: '#1565c0',
    NO_SHOW: '#c62828',
  };

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <div
            className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{ color: '#4978BC' }}
          >
            Аккаунт
          </div>
          <h1
            className="text-3xl sm:text-4xl"
            style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
          >
            {user?.name}
          </h1>
          <p className="text-[#6b6b6b] mt-1">{user?.email}</p>
        </div>

        <h2
          className="text-2xl mb-6"
          style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
        >
          {t('title')}
        </h2>

        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#6b6b6b] mb-6">{t('empty')}</p>
            <Link
              href="/schedule"
              className="inline-block px-6 py-3 rounded-full text-sm text-white"
              style={{ background: '#4978BC' }}
            >
              {t('browseSchedule')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 sm:p-5 rounded-xl border border-[#e0d8cc]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-base sm:text-lg mb-0.5"
                      style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
                    >
                      {booking.scheduleSlot?.classType?.titleRu}
                    </div>
                    <div className="text-sm text-[#6b6b6b]">
                      {booking.scheduleSlot?.master?.name} · {booking.scheduleSlot?.startTime} – {booking.scheduleSlot?.endTime}
                    </div>
                    <div className="text-sm text-[#9b9b9b] mt-0.5">{formatDate(booking.bookingDate)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className="text-xs px-3 py-1 rounded-full whitespace-nowrap"
                      style={{
                        background: statusColors[booking.status] || '#F5F0E8',
                        color: statusTextColors[booking.status] || '#1a1a1a',
                      }}
                    >
                      {t(`status.${booking.status}` as any)}
                    </span>
                    {booking.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelling === booking.id}
                        className="text-xs text-[#9b9b9b] hover:text-[#c62828] transition-colors disabled:opacity-50 py-1 px-2"
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
