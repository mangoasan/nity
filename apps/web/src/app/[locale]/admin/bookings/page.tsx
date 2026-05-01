'use client';
ё
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { bookingsApi, mastersApi, classTypesApi, Booking, Master, ClassType, BookingFilters } from '@/lib/api';

const STATUSES = ['CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW'];
const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const statusColors: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: '#E8F5E9', text: '#2e7d32' },
  CANCELLED: { bg: '#F5F0E8', text: '#9b9b9b' },
  ATTENDED: { bg: '#E3F2FD', text: '#1565c0' },
  NO_SHOW: { bg: '#FDECEA', text: '#c62828' },
};

const emptyFilters: BookingFilters = {
  status: '',
  date: '',
  weekday: '',
  classTypeId: '',
  masterId: '',
  userSearch: '',
};

export default function AdminBookingsPage() {
  const t = useTranslations('admin');
  const tBookings = useTranslations('bookings');
  const tWeekdays = useTranslations('weekdays');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BookingFilters>(emptyFilters);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = (f: BookingFilters = filters) => {
    setLoading(true);
    const active: BookingFilters = Object.fromEntries(
      Object.entries(f).filter(([, v]) => v),
    );
    bookingsApi.getAll(active).then((d) => {
      setBookings(d);
      setLoading(false);
    });
  };

  useEffect(() => {
    Promise.all([mastersApi.getAll(), classTypesApi.getAll()]).then(([m, ct]) => {
      setMasters(m);
      setClassTypes(ct);
    });
    load(emptyFilters);
  }, []);

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id);
    await bookingsApi.updateStatus(id, status);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: status as any } : b)));
    setUpdating(null);
  };

  const setFilter = (key: keyof BookingFilters, val: string) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    load(next);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    load(emptyFilters);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
          {t('bookings')}
        </h1>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-[#4978BC] hover:underline self-start sm:self-auto"
          >
            {t('resetFilters')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Status */}
        <select
          value={filters.status || ''}
          onChange={(e) => setFilter('status', e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] bg-white"
        >
          <option value="">{t('filterAll')} — {t('status')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{tBookings(`status.${s}` as any)}</option>
          ))}
        </select>

        {/* Date */}
        <input
          type="date"
          value={filters.date || ''}
          onChange={(e) => setFilter('date', e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] bg-white"
          placeholder={t('filterDate')}
        />

        {/* Weekday */}
        <select
          value={filters.weekday || ''}
          onChange={(e) => setFilter('weekday', e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] bg-white"
        >
          <option value="">{t('filterAll')} — {t('filterWeekday')}</option>
          {WEEKDAYS.map((d) => (
            <option key={d} value={d}>{tWeekdays(d as any)}</option>
          ))}
        </select>

        {/* Class type */}
        <select
          value={filters.classTypeId || ''}
          onChange={(e) => setFilter('classTypeId', e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] bg-white"
        >
          <option value="">{t('filterAll')} — {t('classType')}</option>
          {classTypes.map((ct) => (
            <option key={ct.id} value={ct.id}>{ct.titleRu}</option>
          ))}
        </select>

        {/* Master */}
        <select
          value={filters.masterId || ''}
          onChange={(e) => setFilter('masterId', e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] bg-white"
        >
          <option value="">{t('filterAll')} — {t('master')}</option>
          {masters.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        {/* User search */}
        <input
          type="text"
          value={filters.userSearch || ''}
          onChange={(e) => setFilter('userSearch', e.target.value)}
          placeholder={t('filterUser')}
          className="px-3 py-2 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] bg-white"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#e0d8cc] animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-[#e0d8cc] bg-white p-8 text-center text-sm text-[#6b6b6b]">
          Нет бронирований
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {bookings.map((b) => {
              const sc = statusColors[b.status] || { bg: '#F5F0E8', text: '#9b9b9b' };
              return (
                <div
                  key={b.id}
                  className="rounded-xl border border-[#e0d8cc] bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{(b as any).user?.name || '—'}</div>
                      <div className="text-xs text-[#9b9b9b]">{(b as any).user?.email}</div>
                      {(b as any).user?.phone && (
                        <div className="text-xs text-[#9b9b9b]">{(b as any).user.phone}</div>
                      )}
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {tBookings(`status.${b.status}` as any)}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">{b.scheduleSlot?.classType?.titleRu}</span>
                    {b.scheduleSlot?.master && (
                      <span className="text-[#6b6b6b]"> · {b.scheduleSlot.master.name}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#6b6b6b]">
                    <span>{formatDate(b.bookingDate)}</span>
                    <span>{b.scheduleSlot?.startTime} – {b.scheduleSlot?.endTime}</span>
                  </div>

                  <select
                    value={b.status}
                    onChange={(e) => handleStatus(b.id, e.target.value)}
                    disabled={updating === b.id}
                    className="w-full text-xs rounded-lg border border-[#e0d8cc] py-1.5 px-2 outline-none focus:border-[#4978BC] bg-white disabled:opacity-50"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{tBookings(`status.${s}` as any)}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl overflow-hidden border border-[#e0d8cc] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0d8cc]" style={{ background: '#F5F0E8' }}>
                  <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('user')}</th>
                  <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('classType')}</th>
                  <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('date')}</th>
                  <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('status')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, idx) => {
                  const sc = statusColors[b.status] || { bg: '#F5F0E8', text: '#9b9b9b' };
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-[#e0d8cc] last:border-0"
                      style={{ background: idx % 2 === 0 ? '#fff' : '#fdfcfa' }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{(b as any).user?.name || '—'}</div>
                        <div className="text-xs text-[#9b9b9b]">{(b as any).user?.email}</div>
                        {(b as any).user?.phone && (
                          <div className="text-xs text-[#9b9b9b]">{(b as any).user.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>{b.scheduleSlot?.classType?.titleRu}</div>
                        <div className="text-xs text-[#9b9b9b]">
                          {b.scheduleSlot?.master?.name} · {b.scheduleSlot?.startTime} – {b.scheduleSlot?.endTime}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(b.bookingDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          {tBookings(`status.${b.status}` as any)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={b.status}
                          onChange={(e) => handleStatus(b.id, e.target.value)}
                          disabled={updating === b.id}
                          className="text-xs rounded-lg border border-[#e0d8cc] py-1 px-2 outline-none focus:border-[#4978BC] bg-white disabled:opacity-50"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{tBookings(`status.${s}` as any)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
