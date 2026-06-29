'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import { bookingsApi, authApi, Booking, PassSummary, User } from '@/lib/api';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  LoadingStack,
  Pill,
  TextField,
  cn,
} from '@/components/ui/nity';
import { CalendarDays, CheckCircle2, LockKeyhole, LogOut } from 'lucide-react';

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

function dateLocale(locale: string) {
  if (locale === 'kk') return 'ru-RU';
  if (locale === 'en') return 'en-US';
  return 'ru-RU';
}

function classTitle(booking: Booking, locale: string) {
  const classType = booking.scheduleSlot?.classType;
  if (!classType) return '';
  if (locale === 'kk') return classType.titleKk;
  if (locale === 'en') return classType.titleEn;
  return classType.titleRu;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function AccountPage() {
  const t = useTranslations('bookings');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [passes, setPasses] = useState<PassSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');

  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const statusLabels: Record<Booking['status'], string> = {
    CONFIRMED: t('status.CONFIRMED'),
    CANCELLED: t('status.CANCELLED'),
    ATTENDED: t('status.ATTENDED'),
    NO_SHOW: t('status.NO_SHOW'),
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/signin');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      bookingsApi.getMyBookings(),
      authApi.getMyPasses(),
    ]).then(([b, p]) => {
      setBookings(b);
      setPasses(p);
      setLoading(false);
    });
  }, [user]);

  const handleCancel = async (id: string) => {
    if (!confirm(t('cancelConfirm'))) return;
    setCancelling(id);
    setCancelError('');
    setCancelSuccess('');
    try {
      await bookingsApi.cancel(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' as const } : b)),
      );
      const passSummary = await authApi.getMyPasses();
      setPasses(passSummary);
      setCancelSuccess(statusLabels.CANCELLED);
    } catch (err: unknown) {
      setCancelError(errorMessage(err, 'Error'));
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
    } catch (err: unknown) {
      setPwError(errorMessage(err, tAuth('changePasswordError')));
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="page-shell py-10 lg:py-14">
        <LoadingStack count={4} />
      </div>
    );
  }

  const sortedBookings = [...bookings].sort((a, b) => {
    const aKey = `${a.bookingDate}${a.scheduleSlot?.startTime || ''}`;
    const bKey = `${b.bookingDate}${b.scheduleSlot?.startTime || ''}`;
    return aKey.localeCompare(bKey);
  });
  const now = new Date();
  const upcoming = sortedBookings.filter((booking) => {
    const slot = booking.scheduleSlot;
    if (!slot || booking.status !== 'CONFIRMED') return false;
    return classStartUtc(booking.bookingDate, slot.startTime) >= now;
  });
  const history = sortedBookings.filter((booking) => !upcoming.includes(booking));

  return (
    <div className="bg-[var(--warm-bg)] py-8 sm:py-12 lg:py-14">
      <div className="page-shell">
        <div className="mb-8 max-w-3xl lg:mb-10">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {t('title')}
          </div>
          <h1 className="font-display text-4xl leading-[1.02] text-[var(--dark)] sm:text-5xl lg:text-7xl">
            {user?.name}
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            {user?.email}
            {user?.phone ? ` · ${user.phone}` : ''}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
          <aside className="space-y-5 lg:sticky lg:top-28">
            <UserCard user={user} onLogout={handleLogout} />
            <PassCard
              passes={passes}
              locale={locale}
              labels={{
                unlimited: (date) => t('passUnlimited', { date }),
                classes: (count) => t('passClasses', { count }),
                none: t('passNone'),
                noPass: t('noPass'),
              }}
            />
            {user?.authProvider === 'EMAIL' && (
              <Card>
                <button
                  onClick={() => {
                    setShowPwForm((value) => !value);
                    setPwError('');
                    setPwSuccess('');
                  }}
                  className="flex w-full items-center justify-between gap-3 text-left"
                  type="button"
                >
                  <span className="flex items-center gap-3 font-semibold text-[var(--dark)]">
                    <LockKeyhole size={18} className="text-[var(--accent)]" />
                    {tAuth('changePassword')}
                  </span>
                  <span className="text-[var(--accent)]">{showPwForm ? '-' : '+'}</span>
                </button>

                {showPwForm && (
                  <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                    {pwError && <Alert tone="error">{pwError}</Alert>}
                    {pwSuccess && <Alert tone="success">{pwSuccess}</Alert>}
                    <TextField
                      label={tAuth('currentPassword')}
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      required
                    />
                    <TextField
                      label={tAuth('newPassword')}
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      minLength={8}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowPwForm(false)}>
                        {tCommon('close')}
                      </Button>
                      <Button type="submit" disabled={pwLoading}>
                        {pwLoading ? '...' : tCommon('confirm')}
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            )}
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  {t('title')}
                </div>
                <h2 className="font-display text-3xl leading-[1.05] text-[var(--dark)] sm:text-4xl">
                  {upcoming.length}
                </h2>
              </div>
              <Link
                href="/schedule"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
              >
                {t('browseSchedule')}
              </Link>
            </div>

            <div className="mb-4 space-y-3">
              {cancelError && <Alert tone="error">{cancelError}</Alert>}
              {cancelSuccess && (
                <Alert tone="success" className="flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  {cancelSuccess}
                </Alert>
              )}
            </div>

            {upcoming.length === 0 ? (
              <EmptyState
                title={t('empty')}
                action={
                  <Link href="/schedule">
                    <Button>{t('browseSchedule')}</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {upcoming.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    locale={locale}
                    statusLabel={statusLabels[booking.status]}
                    cancelLabel={t('cancel')}
                    cancelDeadlinePassed={t('cancelDeadlinePassed')}
                    cancelling={cancelling === booking.id}
                    onCancel={() => handleCancel(booking.id)}
                  />
                ))}
              </div>
            )}

            {history.length > 0 && (
              <div className="mt-10">
                <div className="mb-5">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    History
                  </div>
                  <h2 className="font-display text-3xl leading-[1.05] text-[var(--dark)] sm:text-4xl">
                    {history.length}
                  </h2>
                </div>
                <div className="space-y-3">
                  {history.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      locale={locale}
                      statusLabel={statusLabels[booking.status]}
                      cancelLabel={t('cancel')}
                      cancelDeadlinePassed={t('cancelDeadlinePassed')}
                      muted
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function UserCard({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-display text-3xl text-white">
          {user?.name?.[0] || 'N'}
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--dark)]">{user?.name}</div>
          <div className="truncate text-sm text-[var(--muted)]">{user?.email}</div>
          {user?.phone && <div className="truncate text-sm text-[#A8A199]">{user.phone}</div>}
        </div>
      </div>
      <Button variant="outline" full className="mt-5" onClick={onLogout}>
        <LogOut size={16} />
        Logout
      </Button>
    </Card>
  );
}

function PassCard({
  passes,
  locale,
  labels,
}: {
  passes: PassSummary | null;
  locale: string;
  labels: {
    unlimited: (date: string) => string;
    classes: (count: number) => string;
    none: string;
    noPass: string;
  };
}) {
  const finite = passes?.finitePass;
  const unlimited = passes?.unlimitedPass;
  const totalByTemplate: Record<string, number> = {
    TRIAL: 1,
    EIGHT: 8,
    TWELVE: 12,
  };

  if (unlimited) {
    const date = unlimited.expiresAt
      ? new Date(unlimited.expiresAt).toLocaleDateString(dateLocale(locale), {
          day: 'numeric',
          month: 'long',
        })
      : '∞';

    return (
      <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,var(--accent)_0%,var(--dark)_125%)] p-5 text-white shadow-[0_18px_44px_-28px_rgba(73,120,188,0.9)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              Pass
            </div>
            <div className="mt-2 font-display text-4xl leading-none">Unlimited</div>
            <div className="mt-2 text-sm text-white/75">{labels.unlimited(date)}</div>
          </div>
          <Pill tone="white">Nity</Pill>
        </div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-full rounded-full bg-white" />
        </div>
      </div>
    );
  }

  if (finite) {
    const total = finite.totalClasses || totalByTemplate[finite.template] || finite.remainingClasses || 1;
    const percent = (finite.remainingClasses / total) * 100;

    return (
      <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,var(--accent)_0%,var(--dark)_125%)] p-5 text-white shadow-[0_18px_44px_-28px_rgba(73,120,188,0.9)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              Pass
            </div>
            <div className="mt-2 font-display text-4xl leading-none">
              {finite.remainingClasses} / {total}
            </div>
            <div className="mt-2 text-sm text-white/75">
              {labels.classes(finite.remainingClasses)}
            </div>
          </div>
          <Pill tone="white">{finite.template}</Pill>
        </div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.min(100, percent)}%` }} />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Pass
      </div>
      <div className="font-display text-3xl text-[var(--dark)]">{labels.none}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{labels.noPass}</p>
    </Card>
  );
}

function BookingRow({
  booking,
  locale,
  statusLabel,
  cancelLabel,
  cancelDeadlinePassed,
  cancelling,
  muted,
  onCancel,
}: {
  booking: Booking;
  locale: string;
  statusLabel: string;
  cancelLabel: string;
  cancelDeadlinePassed: string;
  cancelling?: boolean;
  muted?: boolean;
  onCancel?: () => void;
}) {
  const slot = booking.scheduleSlot;
  const date = new Date(booking.bookingDate);
  const cancelable = canCancel(booking);
  const deadlinePassed = booking.status === 'CONFIRMED' && !cancelable && slot;
  const statusTone: 'green' | 'red' | 'accent' | 'cream' =
    booking.status === 'CONFIRMED'
      ? 'green'
      : booking.status === 'NO_SHOW'
      ? 'red'
      : booking.status === 'ATTENDED'
      ? 'accent'
      : 'cream';

  return (
    <Card className={cn('p-4 sm:p-5', muted && 'opacity-70')}>
      <div className="flex gap-4">
        <div
          className={cn(
            'flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl',
            muted ? 'bg-[#F5EFE0] text-[var(--muted)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]',
          )}
        >
          <div className="text-[10px] font-semibold uppercase">
            {date.toLocaleDateString(dateLocale(locale), { weekday: 'short' }).replace('.', '')}
          </div>
          <div className="font-display text-2xl leading-none">{date.getDate()}</div>
          <div className="text-[10px] font-semibold uppercase">
            {date.toLocaleDateString(dateLocale(locale), { month: 'short' }).replace('.', '')}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl leading-[1.08] text-[var(--dark)]">
            {classTitle(booking, locale)}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-[var(--muted)]">
            <CalendarDays size={14} />
            <span>{slot?.startTime} - {slot?.endTime}</span>
            <span>·</span>
            <span className="truncate">{slot?.master?.name}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill tone={statusTone}>{statusLabel}</Pill>
            {slot?.locationLabel && <Pill>{slot.locationLabel}</Pill>}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {cancelable && onCancel && (
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="rounded-full border border-[#F4EDDE] px-3 py-2 text-xs font-semibold text-[#A43A2C] transition hover:bg-[#F7E0DD] disabled:opacity-50"
              type="button"
            >
              {cancelling ? '...' : cancelLabel}
            </button>
          )}
          {deadlinePassed && (
            <span className="max-w-[150px] text-right text-xs leading-5 text-[#A8A199]">
              {cancelDeadlinePassed}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
