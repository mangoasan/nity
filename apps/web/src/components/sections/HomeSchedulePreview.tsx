'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { scheduleApi, ScheduleSlot } from '@/lib/api';

const WEEKDAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const TODAY_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function HomeSchedulePreview() {
  const t = useTranslations('schedule');
  const tWeekdays = useTranslations('weekdays');
  const tLevels = useTranslations('levels');
  const [schedule, setSchedule] = useState<Record<string, ScheduleSlot[]>>({});
  const [activeDay, setActiveDay] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scheduleApi.getAll(true).then((data) => {
      setSchedule(data);
      const todayIdx = new Date().getDay();
      const today = TODAY_DAYS[todayIdx];
      const firstDayWithSlots = WEEKDAYS_ORDER.find((d) => (data[d] || []).length > 0) || 'MONDAY';
      setActiveDay((data[today] || []).length > 0 ? today : firstDayWithSlots);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl h-32 w-48 shrink-0" style={{ background: '#e0d8cc', animation: 'pulse 2s infinite' }} />
        ))}
      </div>
    );
  }

  const activeDaySlots = schedule[activeDay] || [];

  return (
    <div>
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        {WEEKDAYS_ORDER.filter((d) => (schedule[d] || []).length > 0).map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm transition-colors ${
              activeDay === day
                ? 'text-white'
                : 'text-[#6b6b6b] hover:text-[#1a1a1a]'
            }`}
            style={activeDay === day ? { background: '#4978BC' } : { background: '#e8dcc4' }}
          >
            {tWeekdays(day as any)}
          </button>
        ))}
      </div>

      {/* Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeDaySlots.map((slot) => {
          const filled = slot._count?.bookings ?? 0;
          const spotsLeft = slot.capacity - filled;
          return (
            <Link
              key={slot.id}
              href={`/schedule`}
              className="block rounded-xl p-5 border border-[#e0d8cc] hover:border-[#4978BC] transition-colors"
              style={{ background: '#fff' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: '#4978BC' }}>
                  {slot.startTime} – {slot.endTime}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: spotsLeft > 0 ? '#E8DCC4' : '#f5e8e8',
                    color: spotsLeft > 0 ? '#1a1a1a' : '#c00',
                  }}
                >
                  {spotsLeft > 0 ? `${spotsLeft} мест` : 'Полный'}
                </span>
              </div>
              <div
                className="text-lg mb-1"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {slot.classType?.titleRu}
              </div>
              <div className="text-sm text-[#6b6b6b]">{slot.master?.name}</div>
              {slot.locationLabel && (
                <div className="text-xs text-[#9b9b9b] mt-2">{slot.locationLabel}</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
