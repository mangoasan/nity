'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Alert,
  Button,
  Card,
  CloseButton,
  EmptyState,
  LoadingStack,
  ModalShell,
  Pill,
  ProgressBar,
  cn,
} from '@/components/ui/nity';
import {
  bookingsApi,
  resolveMediaUrl,
  scheduleApi,
  ScheduleSlot,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from '@/i18n/navigation';
import { ArrowRight, Check, CheckCircle2, Clock3, MapPin } from 'lucide-react';

const TODAY_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const KZ_OFFSET_MINUTES = 5 * 60;

function addDays(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function keyFromApiDate(value: string) {
  const date = new Date(value);
  return localDateKey(date);
}

function weekdayForDate(date: Date) {
  return TODAY_DAYS[date.getDay()];
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

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

function isPastSlot(date: string, slot: ScheduleSlot, now = new Date()) {
  return classStartUtc(date, slot.startTime) <= now;
}

function dateLocale(locale: string) {
  if (locale === 'kk') return 'ru-RU';
  if (locale === 'en') return 'en-US';
  return 'ru-RU';
}

function bookingKey(slotId: string, date: string) {
  return `${slotId}:${date}`;
}

function slotTitle(slot: ScheduleSlot, locale: string) {
  if (!slot.classType) return '';
  if (locale === 'kk') return slot.classType.titleKk;
  if (locale === 'en') return slot.classType.titleEn;
  return slot.classType.titleRu;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

type PendingBooking = {
  slot: ScheduleSlot;
  date: string;
};

export default function ScheduleClient() {
  const t = useTranslations('schedule');
  const tCommon = useTranslations('common');
  const tLevels = useTranslations('levels');
  const locale = useLocale();
  const { user } = useAuth();
  const router = useRouter();

  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(i)), []);
  const [schedule, setSchedule] = useState<Record<string, ScheduleSlot[]>>({});
  const [activeDate, setActiveDate] = useState(localDateKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const [successBooking, setSuccessBooking] = useState<PendingBooking | null>(null);
  const [now, setNow] = useState(() => new Date());

  const levelLabels: Record<string, string> = {
    BEGINNER: tLevels('BEGINNER'),
    INTERMEDIATE: tLevels('INTERMEDIATE'),
    ADVANCED: tLevels('ADVANCED'),
    ALL_LEVELS: tLevels('ALL_LEVELS'),
  };

  const loadSchedule = useCallback(async () => {
    setLoadError('');
    setLoading(true);
    try {
      const data = await scheduleApi.getAll(true);
      setSchedule(data);
      const firstDateWithSlots =
        dates.find((date) => (data[weekdayForDate(date)] || []).length > 0) || dates[0];
      setActiveDate(localDateKey(firstDateWithSlots));
    } catch (err: unknown) {
      setLoadError(errorMessage(err, 'Error'));
    } finally {
      setLoading(false);
    }
  }, [dates]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!user) {
      setBookedSlots(new Set());
      return;
    }

    bookingsApi.getMyBookings().then((bookings) => {
      const ids = new Set(
        bookings
          .filter((booking) => booking.status === 'CONFIRMED')
          .map((booking) => bookingKey(booking.scheduleSlotId, keyFromApiDate(booking.bookingDate))),
      );
      setBookedSlots(ids);
    });
  }, [user]);

  const handleBook = (slot: ScheduleSlot, date: string) => {
    if (isPastSlot(date, slot)) {
      setPending(null);
      setSuccessMsg('');
      setError(t('alreadyPassed'));
      return;
    }

    if (!user) {
      router.push('/auth/signin');
      return;
    }
    setError('');
    setSuccessMsg('');
    setPending({ slot, date });
  };

  const handleConfirm = async () => {
    if (!pending) return;
    const { slot, date } = pending;

    if (isPastSlot(date, slot)) {
      setPending(null);
      setSuccessMsg('');
      setError(t('alreadyPassed'));
      return;
    }

    setBookingSlot(slot.id);
    setError('');
    setSuccessMsg('');
    try {
      await bookingsApi.book(slot.id, date);
      setBookedSlots((prev) => new Set([...prev, bookingKey(slot.id, date)]));
      setPending(null);
      setSuccessBooking({ slot, date });
      setSuccessMsg(`${slotTitle(slot, locale)} · ${formatDate(date, locale)}`);
      const data = await scheduleApi.getAll(true);
      setSchedule(data);
      window.setTimeout(() => setSuccessBooking(null), 1700);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Ошибка при бронировании'));
    } finally {
      setBookingSlot(null);
    }
  };

  if (loading) {
    return <LoadingStack count={4} />;
  }

  if (loadError) {
    return (
      <EmptyState
        title={tCommon('error')}
        text={loadError}
        action={<Button onClick={loadSchedule}>{tCommon('retry')}</Button>}
      />
    );
  }

  const activeDateObj = dateFromKey(activeDate);
  const activeDay = weekdayForDate(activeDateObj);
  const activeSlots = schedule[activeDay] || [];
  const monthLabel = activeDateObj.toLocaleDateString(dateLocale(locale), {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <DateSelector
        dates={dates}
        activeDate={activeDate}
        onChange={setActiveDate}
        schedule={schedule}
        locale={locale}
        monthLabel={monthLabel}
      />

      <div className="mt-6 space-y-3">
        {successMsg && (
          <Alert tone="success" className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </Alert>
        )}
        {error && <Alert tone="error">{error}</Alert>}
      </div>

      <div className="mt-6">
        {activeSlots.length === 0 ? (
          <EmptyState title="-" text={t('subtitle')} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {activeSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                date={activeDate}
                title={slotTitle(slot, locale)}
                level={slot.classType ? levelLabels[slot.classType.level] ?? slot.classType.level : ''}
                isBooked={bookedSlots.has(bookingKey(slot.id, activeDate))}
                isPast={isPastSlot(activeDate, slot, now)}
                loading={bookingSlot === slot.id}
                onBook={() => handleBook(slot, activeDate)}
                bookLabel={t('book')}
                bookedLabel={t('booked')}
                pastLabel={t('past')}
                fullLabel={t('full')}
                spotsLabel={(count) => t('spotsLeft', { count })}
              />
            ))}
          </div>
        )}
      </div>

      {pending && (
        <BookingModal
          pending={pending}
          title={slotTitle(pending.slot, locale)}
          dateLabel={formatLongDate(pending.date, locale)}
          spotsLeft={pending.slot.capacity - (pending.slot._count?.bookings ?? 0)}
          loading={bookingSlot === pending.slot.id}
          onClose={() => setPending(null)}
          onConfirm={handleConfirm}
          labels={{
            title: t('confirmTitle'),
            date: t('confirmDate'),
            time: t('confirmTime'),
            master: t('confirmMaster'),
            cancel: tCommon('no'),
            confirm: t('confirmBtn'),
          }}
        />
      )}

      {successBooking && (
        <ModalShell onClose={() => setSuccessBooking(null)} panelClassName="max-w-md">
          <div className="p-8 text-center">
            <div className="relative mx-auto mb-5 h-24 w-24">
              <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-20 [animation:nity-ripple_1.4s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
              <div className="absolute inset-5 rounded-full bg-[var(--accent-soft)]" />
              <div className="absolute inset-8 flex items-center justify-center rounded-full bg-[var(--accent)] text-white [animation:nity-pop_0.35s_ease-out]">
                <Check size={24} />
              </div>
            </div>
            <h3 className="font-display text-3xl text-[var(--dark)]">{t('booked')}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {slotTitle(successBooking.slot, locale)}
              <br />
              {formatLongDate(successBooking.date, locale)} · {successBooking.slot.startTime}
            </p>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function DateSelector({
  dates,
  activeDate,
  onChange,
  schedule,
  locale,
  monthLabel,
}: {
  dates: Date[];
  activeDate: string;
  onChange: (date: string) => void;
  schedule: Record<string, ScheduleSlot[]>;
  locale: string;
  monthLabel: string;
}) {
  const today = localDateKey(new Date());

  return (
    <div className="sticky top-16 z-30 -mx-4 border-y border-[rgba(24,24,27,0.06)] bg-[rgba(250,247,241,0.9)] px-4 py-4 backdrop-blur-2xl sm:mx-0 sm:rounded-[24px] sm:border lg:top-[76px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm capitalize text-[var(--muted)]">{monthLabel}</div>
        <div className="hidden items-center gap-3 text-xs text-[var(--muted)] sm:flex">
          <Legend color="bg-[var(--accent)]" label="Free" />
          <Legend color="bg-[#D97757]" label="Few" />
          <Legend color="bg-[#A43A2C]" label="Full" />
        </div>
      </div>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
        {dates.map((date) => {
          const key = localDateKey(date);
          const active = key === activeDate;
          const slots = schedule[weekdayForDate(date)] || [];
          const isToday = key === today;

          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              type="button"
              className={cn(
                'relative flex h-[78px] w-[60px] shrink-0 flex-col items-center justify-center rounded-[20px] font-semibold transition sm:h-[88px] sm:w-[84px]',
                active
                  ? 'scale-[1.03] bg-[var(--accent)] text-white shadow-[0_12px_28px_-18px_rgba(73,120,188,0.9)]'
                  : 'bg-white text-[var(--dark)] shadow-[0_1px_0_rgba(24,24,27,0.04)] hover:text-[var(--accent)]',
              )}
            >
              {isToday && (
                <span
                  className={cn(
                    'absolute top-2 rounded-full px-1.5 py-0.5 text-[9px] uppercase',
                    active ? 'bg-white/20 text-white' : 'bg-[var(--accent)] text-white',
                  )}
                >
                  today
                </span>
              )}
              <span className={cn('text-[10px] uppercase', active ? 'text-white/75' : 'text-[#9E978A]')}>
                {date.toLocaleDateString(dateLocale(locale), { weekday: 'short' }).replace('.', '')}
              </span>
              <span className="mt-1 font-display text-2xl leading-none sm:text-3xl">{date.getDate()}</span>
              <span className={cn('mt-1 text-[10px]', active ? 'text-white/70' : 'text-[#A8A199]')}>
                {slots.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full', color)} />
      {label}
    </span>
  );
}

function SlotCard({
  slot,
  title,
  level,
  isBooked,
  isPast,
  loading,
  onBook,
  bookLabel,
  bookedLabel,
  pastLabel,
  fullLabel,
  spotsLabel,
}: {
  slot: ScheduleSlot;
  date: string;
  title: string;
  level: string;
  isBooked: boolean;
  isPast: boolean;
  loading: boolean;
  onBook: () => void;
  bookLabel: string;
  bookedLabel: string;
  pastLabel: string;
  fullLabel: string;
  spotsLabel: (count: number) => string;
}) {
  const filled = slot._count?.bookings ?? 0;
  const spotsLeft = slot.capacity - filled;
  const isFull = spotsLeft <= 0;
  const fillPct = slot.capacity > 0 ? (filled / slot.capacity) * 100 : 0;
  const photo = resolveMediaUrl(slot.master?.photoUrl);
  const unavailable = isFull || isPast;

  return (
    <Card padded={false} className={cn('overflow-hidden transition hover:-translate-y-1', unavailable && 'opacity-70')}>
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-5xl leading-none text-[var(--accent)]">
              {slot.startTime}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#A8A199]">
              <Clock3 size={13} />
              {slot.endTime}
              {slot.classType && ` · ${slot.classType.durationMinutes} min`}
            </div>
          </div>
          {slot.locationLabel && <Pill>{slot.locationLabel}</Pill>}
        </div>

        <h3 className="font-display text-3xl leading-[1.05] text-[var(--dark)]">{title}</h3>

        <div className="mt-5 flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--cream)]">
            {photo ? (
              <img src={photo} alt={slot.master?.name || ''} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-xl text-[var(--accent)]">
                {slot.master?.name?.[0] || 'N'}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--dark)]">{slot.master?.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted)]">
              <span>{level}</span>
              {slot.locationLabel && (
                <>
                  <span>·</span>
                  <MapPin size={12} />
                  <span>{slot.locationLabel}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#F4EDDE] bg-[#FBF8F1] p-5">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
          <span>
            {filled} / {slot.capacity}
          </span>
          {!isFull && spotsLeft <= 3 && <span className="font-semibold text-[#A43A2C]">{spotsLabel(spotsLeft)}</span>}
        </div>
        <ProgressBar value={fillPct} danger={unavailable || spotsLeft <= 3} />

        <div className="mt-5">
          {isBooked ? (
            <Button variant="outline" full disabled>
              <Check size={16} className="text-[var(--accent)]" />
              {bookedLabel}
            </Button>
          ) : isPast ? (
            <Button variant="outline" full disabled>
              {pastLabel}
            </Button>
          ) : isFull ? (
            <Button variant="outline" full disabled>
              {fullLabel}
            </Button>
          ) : (
            <Button full onClick={onBook} disabled={loading}>
              {loading ? '...' : bookLabel}
              {!loading && <ArrowRight size={16} />}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function BookingModal({
  pending,
  title,
  dateLabel,
  spotsLeft,
  loading,
  onClose,
  onConfirm,
  labels,
}: {
  pending: PendingBooking;
  title: string;
  dateLabel: string;
  spotsLeft: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  labels: {
    title: string;
    date: string;
    time: string;
    master: string;
    cancel: string;
    confirm: string;
  };
}) {
  const masterPhoto = resolveMediaUrl(pending.slot.master?.photoUrl);

  return (
    <ModalShell onClose={onClose} panelClassName="max-w-lg">
      <div className="max-h-[88vh] overflow-y-auto p-5 sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {labels.title}
            </div>
            <h3 className="font-display text-3xl leading-[1.05] text-[var(--dark)]">{title}</h3>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-[20px] bg-white p-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--cream)]">
            {masterPhoto ? (
              <img src={masterPhoto} alt={pending.slot.master?.name || ''} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-2xl text-[var(--accent)]">
                {pending.slot.master?.name?.[0] || 'N'}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-[var(--dark)]">{pending.slot.master?.name}</div>
            {pending.slot.master?.specialties && (
              <div className="mt-1 truncate text-xs text-[var(--muted)]">
                {pending.slot.master.specialties.join(' · ')}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-[20px] bg-white p-4 text-sm">
          <DetailRow label={labels.date} value={dateLabel} />
          <DetailRow label={labels.time} value={`${pending.slot.startTime} - ${pending.slot.endTime}`} />
          <DetailRow label={labels.master} value={pending.slot.master?.name || ''} />
          <DetailRow label="Spots" value={spotsLeft} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {labels.cancel}
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? '...' : labels.confirm}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-right font-semibold text-[var(--dark)]">{value}</span>
    </div>
  );
}

function formatDate(date: string, locale: string) {
  return dateFromKey(date).toLocaleDateString(dateLocale(locale), {
    day: 'numeric',
    month: 'long',
  });
}

function formatLongDate(date: string, locale: string) {
  return dateFromKey(date).toLocaleDateString(dateLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
