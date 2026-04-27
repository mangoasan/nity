'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  scheduleApi,
  bookingsApi,
  ScheduleSlot,
  resolveMediaUrl,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from '@/i18n/navigation';

const WEEKDAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const TODAY_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function getNextDateForWeekday(weekday: string): string {
  const dayMap: Record<string, number> = {
    MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4,
    FRIDAY: 5, SATURDAY: 6, SUNDAY: 0,
  };
  const today = new Date();
  const target = dayMap[weekday];
  const current = today.getDay();
  let diff = target - current;
  if (diff < 0) diff += 7;
  const date = new Date(today);
  date.setDate(today.getDate() + diff);
  return date.toISOString().split('T')[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export default function ScheduleClient() {
  const t = useTranslations('schedule');
  const tWeekdays = useTranslations('weekdays');
  const tLevels = useTranslations('levels');
  const { user } = useAuth();
  const router = useRouter();

  const [schedule, setSchedule] = useState<Record<string, ScheduleSlot[]>>({});
  const [activeDay, setActiveDay] = useState<string>('MONDAY');
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    scheduleApi.getAll(true).then((data) => {
      setSchedule(data);
      const todayIdx = new Date().getDay();
      const today = TODAY_DAYS[todayIdx];
      if ((data[today] || []).length > 0) setActiveDay(today);
      else {
        const first = WEEKDAYS_ORDER.find((d) => (data[d] || []).length > 0) || 'MONDAY';
        setActiveDay(first);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) {
      bookingsApi.getMyBookings().then((bookings) => {
        const ids = new Set(bookings.filter(b => b.status === 'CONFIRMED').map(b => b.scheduleSlotId));
        setBookedSlots(ids);
      });
    }
  }, [user]);

  const handleBook = async (slot: ScheduleSlot) => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    setBookingSlot(slot.id);
    setError('');
    setSuccessMsg('');
    try {
      const date = getNextDateForWeekday(slot.weekday);
      await bookingsApi.book(slot.id, date);
      setBookedSlots((prev) => new Set([...prev, slot.id]));
      setSuccessMsg(`Забронировано: ${slot.classType?.titleRu} на ${formatDate(date)}`);
      const data = await scheduleApi.getAll(true);
      setSchedule(data);
    } catch (e: any) {
      setError(e.message || 'Ошибка при бронировании');
    } finally {
      setBookingSlot(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-[#f5f0e8] animate-pulse" />
        ))}
      </div>
    );
  }

  const activeDaySlots = schedule[activeDay] || [];
  const nextDate = getNextDateForWeekday(activeDay);

  return (
    <div>
      {/* Day tabs — horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        {WEEKDAYS_ORDER.map((day) => {
          const slots = schedule[day] || [];
          if (slots.length === 0) return null;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-full text-sm transition-all ${
                activeDay === day ? 'text-white shadow-sm' : 'text-[#6b6b6b] hover:text-[#1a1a1a]'
              }`}
              style={activeDay === day ? { background: '#4978BC' } : { background: '#F5F0E8' }}
            >
              {tWeekdays(day as any)}
            </button>
          );
        })}
      </div>

      {/* Next date for active day */}
      <div className="mb-5 text-sm text-[#6b6b6b]">
        Ближайшее занятие: <span className="text-[#1a1a1a] font-medium">{formatDate(nextDate)}</span>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="mb-4 p-4 rounded-xl text-sm" style={{ background: '#E8F5E9', color: '#2e7d32' }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 rounded-xl text-sm" style={{ background: '#FDECEA', color: '#c62828' }}>
          {error}
        </div>
      )}

      {/* Slots */}
      <div className="space-y-3">
        {activeDaySlots.length === 0 ? (
          <div className="text-[#6b6b6b] py-8 text-center">Нет занятий</div>
        ) : (
          activeDaySlots.map((slot) => {
            const filled = slot._count?.bookings ?? 0;
            const spotsLeft = slot.capacity - filled;
            const isFull = spotsLeft <= 0;
            const isBooked = bookedSlots.has(slot.id);
            const isLoading = bookingSlot === slot.id;

            return (
              <div
                key={slot.id}
                className="p-4 sm:p-5 rounded-xl border border-[#e0d8cc] hover:border-[#4978BC] transition-colors"
                style={{ background: '#fff' }}
              >
                {/* Mobile layout: time + button on same row, info below */}
                <div className="flex items-start justify-between gap-3 sm:hidden">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {slot.master?.photoUrl && (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: '#E8DCC4' }}>
                        <img
                          src={resolveMediaUrl(slot.master.photoUrl)}
                          alt={slot.master.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg font-light" style={{ color: '#4978BC', fontFamily: 'Georgia' }}>
                          {slot.startTime}
                        </span>
                        <span className="text-xs text-[#9b9b9b]">– {slot.endTime}</span>
                      </div>
                      <div
                        className="text-base truncate"
                        style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
                      >
                        {slot.classType?.titleRu}
                      </div>
                      <div className="text-xs text-[#6b6b6b]">{slot.master?.name}</div>
                      {slot.classType && (
                        <div className="text-xs text-[#9b9b9b] mt-0.5">
                          {tLevels(slot.classType.level as any)} · {slot.classType.durationMinutes} мин
                          {slot.locationLabel && ` · ${slot.locationLabel}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="text-xs text-[#9b9b9b] whitespace-nowrap">{filled}/{slot.capacity}</div>
                    {isBooked ? (
                      <span
                        className="px-3 py-1.5 rounded-full text-xs"
                        style={{ background: '#E8DCC4', color: '#1a1a1a' }}
                      >
                        ✓ {t('booked')}
                      </span>
                    ) : isFull ? (
                      <span
                        className="px-3 py-1.5 rounded-full text-xs"
                        style={{ background: '#f5e8e8', color: '#c00' }}
                      >
                        {t('full')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBook(slot)}
                        disabled={isLoading}
                        className="px-4 py-1.5 rounded-full text-xs text-white transition-colors disabled:opacity-50 min-h-[34px]"
                        style={{ background: '#4978BC' }}
                      >
                        {isLoading ? '...' : t('book')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop layout: horizontal row */}
                <div className="hidden sm:flex sm:items-center gap-4">
                  {/* Time */}
                  <div className="w-28 shrink-0">
                    <div className="text-xl font-light" style={{ color: '#4978BC', fontFamily: 'Georgia' }}>
                      {slot.startTime}
                    </div>
                    <div className="text-sm text-[#9b9b9b]">– {slot.endTime}</div>
                  </div>

                  {/* Photo + Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {slot.master?.photoUrl && (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0" style={{ background: '#E8DCC4' }}>
                        <img
                          src={resolveMediaUrl(slot.master.photoUrl)}
                          alt={slot.master.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div
                        className="text-lg truncate"
                        style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
                      >
                        {slot.classType?.titleRu}
                      </div>
                      <div className="text-sm text-[#6b6b6b]">{slot.master?.name}</div>
                      {slot.classType && (
                        <div className="text-xs text-[#9b9b9b] mt-0.5">
                          {tLevels(slot.classType.level as any)} · {slot.classType.durationMinutes} мин
                          {slot.locationLabel && ` · ${slot.locationLabel}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Capacity + Book */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-sm text-[#6b6b6b]">
                      {filled} / {slot.capacity} мест
                    </div>
                    {isBooked ? (
                      <span
                        className="px-4 py-2 rounded-full text-sm"
                        style={{ background: '#E8DCC4', color: '#1a1a1a' }}
                      >
                        ✓ {t('booked')}
                      </span>
                    ) : isFull ? (
                      <span
                        className="px-4 py-2 rounded-full text-sm"
                        style={{ background: '#f5e8e8', color: '#c00' }}
                      >
                        {t('full')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBook(slot)}
                        disabled={isLoading}
                        className="px-5 py-2 rounded-full text-sm text-white transition-colors disabled:opacity-50 min-h-[40px]"
                        style={{ background: '#4978BC' }}
                      >
                        {isLoading ? '...' : t('book')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
