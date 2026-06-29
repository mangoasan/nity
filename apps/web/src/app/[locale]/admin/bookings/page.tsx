'use client';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import {
  bookingsApi,
  mastersApi,
  classTypesApi,
  scheduleApi,
  adminApi,
  Booking,
  Master,
  ClassType,
  BookingFilters,
  AdminUser,
  ScheduleSlot,
} from '@/lib/api';
import { toLocalDateString } from '@/lib/schedule-date';

const STATUSES = ['CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW'];
const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const statusColors: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: '#E8F5E9', text: '#2e7d32' },
  CANCELLED: { bg: '#F5F0E8', text: '#9b9b9b' },
  ATTENDED: { bg: '#E3F2FD', text: '#1565c0' },
  NO_SHOW: { bg: '#FDECEA', text: '#c62828' },
};

const jsDayToWeekday = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const emptyFilters: BookingFilters = {
  status: '',
  date: '',
  weekday: '',
  classTypeId: '',
  masterId: '',
  userSearch: '',
};

const makeEmptyManualBooking = () => ({
  userId: '',
  scheduleSlotId: '',
  bookingDate: toLocalDateString(new Date()),
  notes: '',
});

function getWeekdayFromDate(date: string) {
  if (!date) return '';
  return jsDayToWeekday[new Date(`${date}T12:00:00`).getDay()] || '';
}

function hasBookablePass(user: AdminUser) {
  const pass = user.activePass;
  return Boolean(pass && (pass.type === 'unlimited' || (pass.remainingClasses ?? 0) > 0));
}

function isUserFrozenOnDate(user: AdminUser, date: string) {
  if (!date || !user.activePass) return false;
  return user.activePass.freezes.some((freeze) => {
    const start = freeze.startDate.slice(0, 10);
    const end = freeze.endDate.slice(0, 10);
    return start <= date && end >= date;
  });
}

function isSlotCancelledOnDate(slot: ScheduleSlot, date: string) {
  return Boolean(
    date &&
      slot.cancellations?.some((cancellation) => cancellation.cancellationDate.slice(0, 10) === date),
  );
}

export default function AdminBookingsPage() {
  const t = useTranslations('admin');
  const tBookings = useTranslations('bookings');
  const tWeekdays = useTranslations('weekdays');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BookingFilters>(emptyFilters);
  const [updating, setUpdating] = useState<string | null>(null);
  const [manualBooking, setManualBooking] = useState(makeEmptyManualBooking);
  const [manualBookingError, setManualBookingError] = useState('');
  const [manualBookingSuccess, setManualBookingSuccess] = useState('');
  const [creatingManualBooking, setCreatingManualBooking] = useState(false);

  const load = async (f: BookingFilters = filters) => {
    setLoading(true);
    const active: BookingFilters = Object.fromEntries(
      Object.entries(f).filter(([, v]) => v),
    );
    try {
      const d = await bookingsApi.getAll(active);
      setBookings(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      mastersApi.getAll(),
      classTypesApi.getAll(),
      scheduleApi.getAll(true),
      adminApi.getUsers(),
    ]).then(([m, ct, scheduleData, usersData]) => {
      setMasters(m);
      setClassTypes(ct);
      setScheduleSlots(
        Object.values(scheduleData)
          .flat()
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      );
      setUsers(usersData);
    });
    void load(emptyFilters);
  }, []);

  const bookableUsers = useMemo(() => users.filter(hasBookablePass), [users]);
  const availableUsersForSelectedDate = useMemo(
    () => bookableUsers.filter((user) => !isUserFrozenOnDate(user, manualBooking.bookingDate)),
    [bookableUsers, manualBooking.bookingDate],
  );
  const selectedWeekday = getWeekdayFromDate(manualBooking.bookingDate);
  const slotsForSelectedDate = useMemo(
    () => scheduleSlots.filter((slot) => slot.weekday === selectedWeekday),
    [scheduleSlots, selectedWeekday],
  );
  const availableSlotsForSelectedDate = useMemo(
    () => slotsForSelectedDate.filter((slot) => !isSlotCancelledOnDate(slot, manualBooking.bookingDate)),
    [manualBooking.bookingDate, slotsForSelectedDate],
  );

  useEffect(() => {
    setManualBooking((prev) => {
      const nextSlotId = availableSlotsForSelectedDate.some((slot) => slot.id === prev.scheduleSlotId)
        ? prev.scheduleSlotId
        : availableSlotsForSelectedDate[0]?.id || '';
      const nextUserId =
        availableUsersForSelectedDate.some((user) => user.id === prev.userId)
          ? prev.userId
          : availableUsersForSelectedDate[0]?.id || '';

      if (nextSlotId === prev.scheduleSlotId && nextUserId === prev.userId) {
        return prev;
      }

      return { ...prev, scheduleSlotId: nextSlotId, userId: nextUserId };
    });
  }, [availableSlotsForSelectedDate, availableUsersForSelectedDate]);

  const getPassLabel = (user: AdminUser) => {
    const pass = user.activePass;
    if (!pass) return t('passNone');
    if (pass.type === 'unlimited') return t('passUnlimitedShort');
    return t('passClassesCount', { count: pass.remainingClasses ?? 0 });
  };

  const getSlotLabel = (slot: ScheduleSlot) => {
    const title = slot.classType?.titleRu || t('classType');
    const master = slot.master?.name ? ` · ${slot.master.name}` : '';
    return `${slot.startTime} - ${slot.endTime} · ${title}${master}`;
  };

  const handleManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualBookingError('');
    setManualBookingSuccess('');

    const selectedUser = bookableUsers.find((user) => user.id === manualBooking.userId);
    if (!manualBooking.bookingDate || !manualBooking.scheduleSlotId || !selectedUser) {
      setManualBookingError(t('adminBookingRequired'));
      return;
    }

    if (isUserFrozenOnDate(selectedUser, manualBooking.bookingDate)) {
      setManualBookingError(t('adminBookingFrozenError'));
      return;
    }

    setCreatingManualBooking(true);
    try {
      await bookingsApi.bookForUser({
        userId: manualBooking.userId,
        scheduleSlotId: manualBooking.scheduleSlotId,
        bookingDate: manualBooking.bookingDate,
        notes: manualBooking.notes.trim() || undefined,
      });
      const active: BookingFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v),
      );
      const [updatedBookings, updatedUsers] = await Promise.all([
        bookingsApi.getAll(active),
        adminApi.getUsers(),
      ]);
      setBookings(updatedBookings);
      setUsers(updatedUsers);
      setManualBooking((prev) => ({ ...prev, notes: '' }));
      setManualBookingSuccess(t('adminBookingCreated'));
    } catch (err: any) {
      setManualBookingError(err.message);
    } finally {
      setCreatingManualBooking(false);
    }
  };

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id);
    await bookingsApi.updateStatus(id, status);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: status as any } : b)));
    setUpdating(null);
  };

  const setFilter = (key: keyof BookingFilters, val: string) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    void load(next);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    void load(emptyFilters);
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

      <form
        onSubmit={handleManualBooking}
        className="mb-6 rounded-xl border border-[#e0d8cc] bg-white p-4 sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
            {t('adminCreateBooking')}
          </h2>
          {manualBookingSuccess && (
            <span className="text-xs text-[#2e7d32]">{manualBookingSuccess}</span>
          )}
        </div>

        {manualBookingError && (
          <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: '#FDECEA', color: '#c62828' }}>
            {manualBookingError}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-[150px_minmax(220px,1fr)_minmax(220px,1fr)]">
          <div>
            <label className="mb-1.5 block text-sm text-[#6b6b6b]">{t('date')}</label>
            <input
              type="date"
              required
              min={toLocalDateString(new Date())}
              value={manualBooking.bookingDate}
              onChange={(e) => {
                setManualBooking((prev) => ({ ...prev, bookingDate: e.target.value }));
                setManualBookingError('');
                setManualBookingSuccess('');
              }}
              className="w-full rounded-xl border border-[#e0d8cc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4978BC]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[#6b6b6b]">{t('adminBookingSlot')}</label>
            <select
              required
              value={manualBooking.scheduleSlotId}
              onChange={(e) => {
                setManualBooking((prev) => ({ ...prev, scheduleSlotId: e.target.value }));
                setManualBookingError('');
                setManualBookingSuccess('');
              }}
              className="w-full rounded-xl border border-[#e0d8cc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4978BC]"
            >
              {availableSlotsForSelectedDate.length === 0 && (
                <option value="">{t('noClassesForDate')}</option>
              )}
              {slotsForSelectedDate.map((slot) => {
                const cancelled = isSlotCancelledOnDate(slot, manualBooking.bookingDate);
                return (
                  <option key={slot.id} value={slot.id} disabled={cancelled}>
                    {getSlotLabel(slot)}
                    {cancelled ? ` (${t('bookingCancelled')})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[#6b6b6b]">{t('adminBookingClient')}</label>
            <select
              required
              value={manualBooking.userId}
              onChange={(e) => {
                setManualBooking((prev) => ({ ...prev, userId: e.target.value }));
                setManualBookingError('');
                setManualBookingSuccess('');
              }}
              className="w-full rounded-xl border border-[#e0d8cc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4978BC]"
            >
              {availableUsersForSelectedDate.length === 0 && (
                <option value="">{t('noUsersWithPass')}</option>
              )}
              {bookableUsers.map((user) => {
                const frozen = isUserFrozenOnDate(user, manualBooking.bookingDate);
                const contact = user.phone || user.email;
                return (
                  <option key={user.id} value={user.id} disabled={frozen}>
                    {user.name}
                    {contact ? ` · ${contact}` : ''} · {getPassLabel(user)}
                    {frozen ? ` (${t('adminBookingFrozen')})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-sm text-[#6b6b6b]">{t('notes')}</label>
            <input
              type="text"
              value={manualBooking.notes}
              onChange={(e) => setManualBooking((prev) => ({ ...prev, notes: e.target.value }))}
              maxLength={300}
              placeholder={t('adminBookingNotesPlaceholder')}
              className="w-full rounded-xl border border-[#e0d8cc] px-3 py-2.5 text-sm outline-none focus:border-[#4978BC]"
            />
          </div>
          <button
            type="submit"
            disabled={
              creatingManualBooking ||
              !manualBooking.userId ||
              !manualBooking.scheduleSlotId ||
              availableUsersForSelectedDate.length === 0 ||
              availableSlotsForSelectedDate.length === 0
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm text-white disabled:opacity-50 md:w-auto"
            style={{ background: '#4978BC' }}
          >
            <CalendarPlus size={16} />
            <span>{creatingManualBooking ? '...' : t('adminBookingSubmit')}</span>
          </button>
        </div>
      </form>

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
