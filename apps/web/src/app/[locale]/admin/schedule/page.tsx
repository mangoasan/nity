'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { scheduleApi, mastersApi, classTypesApi, ScheduleSlot, Master, ClassType } from '@/lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const makeEmptyForm = (weekday: string) => ({
  masterId: '', classTypeId: '', weekday,
  startTime: '09:00', endTime: '10:00', capacity: 12, locationLabel: '', isActive: true,
});

export default function AdminSchedulePage() {
  const t = useTranslations('admin');
  const tWeekdays = useTranslations('weekdays');
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>('MONDAY');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ScheduleSlot | null>(null);
  const [form, setForm] = useState(makeEmptyForm('MONDAY'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [scheduleData, mastersData, typesData] = await Promise.all([
      scheduleApi.getAll(),
      mastersApi.getAll(),
      classTypesApi.getAll(),
    ]);
    const allSlots = Object.values(scheduleData).flat();
    setSlots(allSlots);
    setMasters(mastersData);
    setClassTypes(typesData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...makeEmptyForm(activeDay),
      masterId: masters[0]?.id || '',
      classTypeId: classTypes[0]?.id || '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (s: ScheduleSlot) => {
    setEditing(s);
    setForm({
      masterId: s.masterId, classTypeId: s.classTypeId, weekday: s.weekday,
      startTime: s.startTime, endTime: s.endTime, capacity: s.capacity,
      locationLabel: s.locationLabel || '', isActive: s.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) await scheduleApi.update(editing.id, form as any);
      else await scheduleApi.create(form as any);
      setShowModal(false);
      load();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    await scheduleApi.delete(id);
    load();
  };

  const field = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const daySlots = slots.filter((s) => s.weekday === activeDay);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
          {t('schedule')}
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-full text-sm text-white shrink-0"
          style={{ background: '#4978BC' }}
        >
          <Plus size={16} /><span>{t('add')}</span>
        </button>
      </div>

      {/* Weekday tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        {WEEKDAYS.map((day) => {
          const count = slots.filter((s) => s.weekday === day).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${
                activeDay === day ? 'text-white' : 'text-[#6b6b6b] hover:text-[#1a1a1a]'
              }`}
              style={activeDay === day ? { background: '#4978BC' } : { background: '#F5F0E8' }}
            >
              {tWeekdays(day as any)}
              {count > 0 && (
                <span className={`ml-1.5 text-xs ${activeDay === day ? 'opacity-80' : 'text-[#9b9b9b]'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#e0d8cc] animate-pulse" />
          ))}
        </div>
      ) : daySlots.length === 0 ? (
        <div className="rounded-xl border border-[#e0d8cc] bg-white p-8 text-center text-sm text-[#6b6b6b]">
          Нет слотов для этого дня
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[#e0d8cc]" style={{ background: '#fff' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0d8cc]" style={{ background: '#F5F0E8' }}>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('startTime')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('classType')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal hidden sm:table-cell">{t('master')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('capacity')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {daySlots.map((s, idx) => (
                <tr
                  key={s.id}
                  className="border-b border-[#e0d8cc] last:border-0"
                  style={{ background: idx % 2 === 0 ? '#fff' : '#fdfcfa' }}
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {s.startTime} – {s.endTime}
                  </td>
                  <td className="px-4 py-3">{s.classType?.titleRu}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[#6b6b6b]">{s.master?.name}</td>
                  <td className="px-4 py-3">{s.capacity}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg hover:bg-[#F5F0E8] text-[#6b6b6b]"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-lg hover:bg-[#FDECEA] text-[#9b9b9b] hover:text-[#c62828]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="w-full max-w-lg rounded-2xl overflow-y-auto max-h-[90vh]" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between p-6 border-b border-[#e0d8cc]">
              <h2 className="text-xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
                {editing ? t('edit') : t('add')} слот
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-[#9b9b9b]" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl text-sm" style={{ background: '#FDECEA', color: '#c62828' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('master')}</label>
                <select
                  value={form.masterId}
                  onChange={field('masterId')}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] bg-white"
                >
                  {masters.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('classType')}</label>
                <select
                  value={form.classTypeId}
                  onChange={field('classTypeId')}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] bg-white"
                >
                  {classTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.titleRu}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('weekday')}</label>
                <select
                  value={form.weekday}
                  onChange={field('weekday')}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] bg-white"
                >
                  {WEEKDAYS.map((d) => <option key={d} value={d}>{tWeekdays(d as any)}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('startTime')}</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={field('startTime')}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('endTime')}</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={field('endTime')}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('capacity')}</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm((p) => ({ ...p, capacity: +e.target.value }))}
                    min={1}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('location')}</label>
                  <input
                    type="text"
                    value={form.locationLabel}
                    onChange={field('locationLabel')}
                    placeholder="Зал 1"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-[#6b6b6b]">{t('active')}</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-full text-sm border border-[#e0d8cc] text-[#6b6b6b]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-full text-sm text-white disabled:opacity-50"
                  style={{ background: '#4978BC' }}
                >
                  {saving ? '...' : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
