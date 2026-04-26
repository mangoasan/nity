'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ptApi, PTRequest } from '@/lib/api';

const STATUSES = ['NEW', 'CONTACTED', 'CLOSED'];

const statusColors: Record<string, { bg: string; text: string }> = {
  NEW: { bg: '#FFF3E0', text: '#e65100' },
  CONTACTED: { bg: '#E3F2FD', text: '#1565c0' },
  CLOSED: { bg: '#F5F0E8', text: '#9b9b9b' },
};
const statusLabels: Record<string, string> = { NEW: 'Новая', CONTACTED: 'В работе', CLOSED: 'Закрыта' };

export default function AdminPTPage() {
  const t = useTranslations('admin');
  const [requests, setRequests] = useState<PTRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<PTRequest | null>(null);

  const load = () => ptApi.getAll().then(d => { setRequests(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id);
    await ptApi.updateStatus(id, status);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: status as any } : null);
    setUpdating(null);
  };

  const filtered = filter ? requests.filter(r => r.status === filter) : requests;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>{t('personalTraining')}</h1>
        <div className="flex gap-2">
          {['', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter===s ? 'text-white' : 'text-[#6b6b6b]'}`}
              style={filter===s ? { background: '#4978BC' } : { background: '#F5F0E8' }}
            >
              {s ? statusLabels[s] : 'Все'}
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
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('name')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal hidden md:table-cell">{t('phone')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal hidden lg:table-cell">{t('goal')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('status')}</th>
                <th className="px-4 py-3"/>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const sc = statusColors[r.status] || { bg: '#F5F0E8', text: '#9b9b9b' };
                return (
                  <tr key={r.id} className="border-b border-[#e0d8cc] last:border-0 cursor-pointer hover:bg-[#fafaf8]" style={{ background: idx%2===0?'#fff':'#fdfcfa' }}
                    onClick={() => setSelected(r)}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-[#9b9b9b]">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{r.phone || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-xs truncate">{r.goal || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                        {statusLabels[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select
                        value={r.status}
                        onChange={e => handleStatus(r.id, e.target.value)}
                        disabled={updating === r.id}
                        className="text-xs rounded-lg border border-[#e0d8cc] py-1 px-2 outline-none bg-white"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>Заявка</h2>
              <button onClick={() => setSelected(null)} className="text-[#9b9b9b] hover:text-[#1a1a1a]">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Имя', selected.name],
                ['Email', selected.email],
                ['Телефон', selected.phone || '—'],
                ['Удобное время', selected.preferredTime || '—'],
                ['Цель', selected.goal || '—'],
                ['Сообщение', selected.message || '—'],
                ['Дата', formatDate(selected.createdAt)],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-xs text-[#9b9b9b] mb-0.5">{label}</div>
                  <div className="text-[#1a1a1a]">{val}</div>
                </div>
              ))}
              <div>
                <div className="text-xs text-[#9b9b9b] mb-0.5">Статус</div>
                <select
                  value={selected.status}
                  onChange={e => handleStatus(selected.id, e.target.value)}
                  className="text-sm rounded-xl border border-[#e0d8cc] py-2 px-3 outline-none bg-white"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
