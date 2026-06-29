'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, LoadingStack, Pill, ProgressBar, cn } from '@/components/ui/nity';
import { resolveMediaUrl, scheduleApi, ScheduleSlot } from '@/lib/api';
import { isSlotCancelled } from '@/lib/schedule-date';

const TODAY_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const KZ_OFFSET_MINUTES = 5 * 60;

function addDays(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekdayForDate(date: Date) {
  return TODAY_DAYS[date.getDay()];
}

function dateLocale(locale: string) {
  if (locale === 'kk') return 'ru-RU';
  if (locale === 'en') return 'en-US';
  return 'ru-RU';
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

function isPastSlot(date: string, slot: ScheduleSlot) {
  return classStartUtc(date, slot.startTime) <= new Date();
}

function slotTitle(slot: ScheduleSlot, locale: string) {
  if (!slot.classType) return '';
  if (locale === 'kk') return slot.classType.titleKk;
  if (locale === 'en') return slot.classType.titleEn;
  return slot.classType.titleRu;
}

export default function HomeSchedulePreview() {
  const t = useTranslations('schedule');
  const tLevels = useTranslations('levels');
  const locale = useLocale();
  const [schedule, setSchedule] = useState<Record<string, ScheduleSlot[]>>({});
  const [activeDate, setActiveDate] = useState('');
  const [loading, setLoading] = useState(true);

  const dates = useMemo(() => Array.from({ length: 10 }, (_, i) => addDays(i)), []);
  const levelLabels: Record<string, string> = {
    BEGINNER: tLevels('BEGINNER'),
    INTERMEDIATE: tLevels('INTERMEDIATE'),
    ADVANCED: tLevels('ADVANCED'),
    ALL_LEVELS: tLevels('ALL_LEVELS'),
  };

  useEffect(() => {
    scheduleApi
      .getAll(true)
      .then((data) => {
        setSchedule(data);
        const firstDateWithSlots =
          dates.find((date) => (data[weekdayForDate(date)] || []).length > 0) || dates[0];
        setActiveDate(dateKey(firstDateWithSlots));
      })
      .finally(() => setLoading(false));
  }, [dates]);

  if (loading) {
    return <LoadingStack count={3} />;
  }

  const active = dates.find((date) => dateKey(date) === activeDate) || dates[0];
  const activeSlots = (schedule[weekdayForDate(active)] || [])
    .filter((slot) => !isSlotCancelled(slot, activeDate))
    .slice(0, 4);
  const monthLabel = active.toLocaleDateString(dateLocale(locale), {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <div className="mb-5 rounded-[24px] border border-[var(--border)] bg-[rgba(250,247,241,0.82)] p-3 backdrop-blur-xl">
        <div className="px-1 pb-3 text-sm capitalize text-[var(--muted)]">{monthLabel}</div>
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {dates.map((date) => {
            const key = dateKey(date);
            const isActive = key === activeDate;
            const slots = (schedule[weekdayForDate(date)] || []).filter(
              (slot) => !isSlotCancelled(slot, key),
            );
            const isToday = key === dateKey(new Date());

            return (
              <button
                key={key}
                onClick={() => setActiveDate(key)}
                type="button"
                className={cn(
                  'relative flex h-[76px] w-[60px] shrink-0 flex-col items-center justify-center rounded-[20px] font-semibold transition sm:w-[76px]',
                  isActive
                    ? 'scale-[1.02] bg-[var(--accent)] text-white shadow-[0_12px_28px_-18px_rgba(73,120,188,0.9)]'
                    : 'bg-white text-[var(--dark)] shadow-[0_1px_0_rgba(24,24,27,0.04)] hover:text-[var(--accent)]',
                )}
              >
                <span className={cn('text-[10px] uppercase', isActive ? 'text-white/75' : 'text-[#9E978A]')}>
                  {date.toLocaleDateString(dateLocale(locale), { weekday: 'short' }).replace('.', '')}
                </span>
                <span className="font-display text-2xl leading-none">{date.getDate()}</span>
                <span className={cn('mt-1 text-[10px]', isActive ? 'text-white/70' : 'text-[#A8A199]')}>
                  {slots.length}
                </span>
                {isToday && (
                  <span
                    className={cn(
                      'absolute bottom-2 h-1 w-1 rounded-full',
                      isActive ? 'bg-white' : 'bg-[var(--accent)]',
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeSlots.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-[var(--muted)]">
          {t('subtitle')}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activeSlots.map((slot) => {
            const filled = slot._count?.bookings ?? 0;
            const spotsLeft = slot.capacity - filled;
            const isFull = spotsLeft <= 0;
            const isPast = isPastSlot(activeDate, slot);
            const unavailable = isFull || isPast;
            const fillPct = slot.capacity > 0 ? (filled / slot.capacity) * 100 : 0;
            const photo = resolveMediaUrl(slot.master?.photoUrl);

            return (
              <Link key={slot.id} href="/schedule" className="group block">
                <Card className={cn('h-full p-5 transition group-hover:-translate-y-1', unavailable && 'opacity-70')}>
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-4xl leading-none text-[var(--accent)]">
                        {slot.startTime}
                      </div>
                      <div className="mt-1 text-xs text-[#A8A199]">{slot.endTime}</div>
                    </div>
                    <Pill tone={unavailable || spotsLeft <= 3 ? 'red' : 'accent'}>
                      {isPast ? t('past') : isFull ? t('full') : t('spotsLeft', { count: spotsLeft })}
                    </Pill>
                  </div>

                  <div className="font-display text-2xl leading-[1.08] text-[var(--dark)]">
                    {slotTitle(slot, locale)}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--cream)]">
                      {photo ? (
                        <img src={photo} alt={slot.master?.name || ''} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-lg text-[var(--accent)]">
                          {slot.master?.name?.[0] || 'N'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 text-sm text-[#52525B]">
                      <div className="truncate font-semibold">{slot.master?.name}</div>
                      {slot.classType && (
                        <div className="truncate text-xs text-[var(--muted)]">
                          {levelLabels[slot.classType.level] ?? slot.classType.level}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>
                        {filled} / {slot.capacity}
                      </span>
                      {slot.locationLabel && <span>{slot.locationLabel}</span>}
                    </div>
                    <ProgressBar value={fillPct} danger={unavailable || spotsLeft <= 3} />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#F4EDDE] pt-4 text-sm font-semibold text-[var(--accent)]">
                    <span>{isPast ? t('past') : isFull ? t('full') : t('book')}</span>
                    {unavailable ? <CheckCircle2 size={16} className="opacity-30" /> : <ArrowRight size={16} />}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
