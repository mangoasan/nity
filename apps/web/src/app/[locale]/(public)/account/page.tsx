'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import { bookingsApi, authApi, Booking, PassSummary } from '@/lib/api';

// Kazakhstan UTC+5
const KZ_OFFSET_MINUTES = 5 * 60;

function classStartUtc(bookingDateStr: string, startTimeStr: string): Date {
  const utcDate = new Date(bookingDateStr);
  const kzMs = utcDate.getTime() + KZ_OFFSET_MINUTES * 60_000;
  const kzDate = new Date(kzMs);
  const [hh, mm] = startTimeStr.split(':').map(Number);
  return new Date(
    Date.UTC(kzDate.getUTCFullYear(), kzDate.getUTCMonth(), kzDate.getUTCDate(), hh, mm)
    - KZ_OFFSET_MINUTES * 60_000,
  );
}

function canCancel(booking: Booking): boolean {
  if (booking.status !== 'CONFIRMED') return false;
  const slot = booking.scheduleSlot;
  if (!slot) return false;
  const classStart = classStartUtc(booking.bookingDate, slot.startTime);
  const deadline = new Date(classStart.getTime() - 60 * 60_000);
  return new Date() <= deadline;
}

export default function AccountPage() {
  const t = useTranslations('bookings');
  const tAuth = useTranslations('auth');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [passes, setPasses] = useState<PassSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string>('');

  // Password change state
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/signin');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      Promise.all([
        bookingsApi.getMyBookings(),
        authApi.getMyPasses(),
      ]).then(([b, p]) => {
        setBookings(b);
        setPasses(p);
        setLoading(false);
      });
    }
  }, [user]);

  const handleCancel = async (id: string) => {
    if (!confirm(t('cancelConfirm'))) return;
    setCancelling(id);
    setCancelError('');
    try {
      await bookingsApi.cancel(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' as const } : b)),
      );
    } catch (err: any) {
      setCancelError(err.message || 'Error');
    } finally {
      setCancelling(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    setPwLoading(true);
    try {
      await authApi.changePassword(currentPw, newPw);
      setPwSuccess(tAuth('changePasswordSuccess'));
      setCurrentPw('');
      setNewPw('');
      setTimeout(() => setShowPwForm(false), 1500);
    } catch (err: any) {
      setPwError(err.message || tAuth('changePasswordError'));
    } finally {
      setPwLoading(false);
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

  const formatShortDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

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
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#4978BC' }}>
            Аккаунт
          </div>
          <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
            {user?.name}
          </h1>
          <p className="text-[#6b6b6b] mt-1">{user?.email}</p>
          {user?.phone && <p className="text-[#9b9b9b] text-sm mt-0.5">{user.phone}</p>}
        </div>

        {/* Pass summary */}
        <div className="mb-8 p-4 sm:p-5 rounded-xl border border-[#e0d8cc]">
          {passes?.unlimitedPass ? (
            <div className="flex items-center gap-2">
              <span className="text-base" style={{ fontFamily: 'Georgia, serif' }}>
                {t('passUnlimited', {
                  date: passes.unlimitedPass.expiresAt
                    ? formatShortDate(passes.unlimitedPass.expiresAt)
                    : '∞',
                })}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#E8F5E9', color: '#2e7d32' }}>
                Безлимит
              </span>
            </div>
          ) : passes?.finitePass ? (
            <div className="flex items-center gap-2">
              <span className="text-base" style={{ fontFamily: 'Georgia, serif' }}>
                {t('passClasses', { count: passes.finitePass.remainingClasses })}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#EFF3FB', color: '#4978BC' }}>
                Абонемент
              </span>
            </div>
          ) : (
            <div className="text-sm text-[#9b9b9b]">{t('passNone')}</div>
          )}
        </div>

        {/* Cancel error */}
        {cancelError && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#FDECEA', color: '#c62828' }}>
            {cancelError}
          </div>
        )}

        {/* Bookings */}
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
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
            {bookings.map((booking) => {
              const cancelable = canCancel(booking);
              const deadlinePassed =
                booking.status === 'CONFIRMED' && !cancelable && booking.scheduleSlot;

              return (
                <div key={booking.id} className="p-4 sm:p-5 rounded-xl border border-[#e0d8cc]">
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
                      {cancelable && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelling === booking.id}
                          className="text-xs text-[#9b9b9b] hover:text-[#c62828] transition-colors disabled:opacity-50 py-1 px-2"
                        >
                          {t('cancel')}
                        </button>
                      )}
                      {deadlinePassed && (
                        <span className="text-xs text-[#9b9b9b] text-right max-w-[140px]">
                          {t('cancelDeadlinePassed')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Change password */}
        {user?.authProvider === 'EMAIL' && (
          <div className="mt-12">
            <div className="border-t border-[#e0d8cc] pt-8">
              <button
                onClick={() => { setShowPwForm((v) => !v); setPwError(''); setPwSuccess(''); }}
                className="text-sm text-[#4978BC] hover:underline"
              >
                {tAuth('changePassword')}
              </button>

              {showPwForm && (
                <form onSubmit={handleChangePassword} className="mt-4 space-y-3 max-w-sm">
                  {pwError && (
                    <div className="p-3 rounded-xl text-sm" style={{ background: '#FDECEA', color: '#c62828' }}>
                      {pwError}
                    </div>
                  )}
                  {pwSuccess && (
                    <div className="p-3 rounded-xl text-sm" style={{ background: '#E8F5E9', color: '#2e7d32' }}>
                      {pwSuccess}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-[#6b6b6b] mb-1.5">{tAuth('currentPassword')}</label>
                    <input
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      required
                      minLength={1}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#6b6b6b] mb-1.5">{tAuth('newPassword')}</label>
                    <input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPwForm(false)}
                      className="flex-1 py-2.5 rounded-full text-sm border border-[#e0d8cc] text-[#6b6b6b]"
                    >
                      {'Отмена'}
                    </button>
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="flex-1 py-2.5 rounded-full text-sm text-white disabled:opacity-50"
                      style={{ background: '#4978BC' }}
                    >
                      {pwLoading ? '...' : tAuth('changePassword')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
