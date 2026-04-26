'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { bookingsApi, Booking } from '@/lib/api';

const STATUSES = ['CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW'];

export default function AdminBookingsPage() {
  const t = useTranslations('admin');
  const tBookings = useTranslations('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () =>
    bookingsApi.getAll().then((d) => { setBookings(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id);
    await bookingsApi.updateStatus(id, status);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as any } : b));
    setUpdating(null);
  };

  const filtered = filter ? bookings.filter(b => b.status === filter) : bookings;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  const statusColors: Record<string, { bg: string; text: string }> = {
    CONFIRMED: { bg: '#E8F5E9', text: '#2e7d32' },
    CANCELLED: { bg: '#F5F0E8', text: '#9b9b9b' },
    ATTENDED: { bg: '#E3F2FD', text: '#1565c0' },
    NO_SHOW: { bg: '#FDECEA', text: '#c62828' },
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>{t('bookings')}</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${!filter ? 'text-white' : 'text-[#6b6b6b] hover:text-[#1a1a1a]'}`}
            style={!filter ? { background: '#4978BC' } : { background: '#F5F0E8' }}
          >
            Все
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter===s ? 'text-white' : 'text-[#6b6b6b]'}`}
              style={filter===s ? { background: '#4978BC' } : { background: '#F5F0E8' }}
            >
              {tBookings(`status.${s}` as any)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 rounded-xl bg-[#e0d8cc] animate-pulse"/>)}</div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[#e0d8cc]" style={{ background: '#fff' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0d8cc]" style={{ background: '#F5F0E8' }}>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('user')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal hidden md:table-cell">{t('classType')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('date')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('status')}</th>
                <th className="px-4 py-3"/>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, idx) => {
                const sc = statusColors[b.status] || { bg: '#F5F0E8', text: '#9b9b9b' };
                return (
                  <tr key={b.id} className="border-b border-[#e0d8cc] last:border-0" style={{ background: idx%2===0?'#fff':'#fdfcfa' }}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{(b as any).user?.name || '—'}</div>
                      <div className="text-xs text-[#9b9b9b]">{(b as any).user?.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div>{b.scheduleSlot?.classType?.titleRu}</div>
                      <div className="text-xs text-[#9b9b9b]">{b.scheduleSlot?.master?.name} · {b.scheduleSlot?.startTime}</div>
                    </td>
                    <td className="px-4 py-3">{formatDate(b.bookingDate)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                        {tBookings(`status.${b.status}` as any)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={b.status}
                        onChange={e => handleStatus(b.id, e.target.value)}
                        disabled={updating === b.id}
                        className="text-xs rounded-lg border border-[#e0d8cc] py-1 px-2 outline-none focus:border-[#4978BC] bg-white disabled:opacity-50"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{tBookings(`status.${s}` as any)}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
