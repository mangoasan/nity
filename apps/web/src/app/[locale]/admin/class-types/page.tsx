'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { classTypesApi, ClassType } from '@/lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'];
const emptyForm = {
  titleRu: '', titleEn: '', titleKk: '',
  descriptionRu: '', descriptionEn: '', descriptionKk: '',
  durationMinutes: 60, level: 'ALL_LEVELS', isActive: true,
};

export default function AdminClassTypesPage() {
  const t = useTranslations('admin');
  const tLevels = useTranslations('levels');
  const [items, setItems] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClassType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => classTypesApi.getAll().then((d) => { setItems(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (ct: ClassType) => {
    setEditing(ct);
    setForm({
      titleRu: ct.titleRu, titleEn: ct.titleEn, titleKk: ct.titleKk,
      descriptionRu: ct.descriptionRu || '', descriptionEn: ct.descriptionEn || '', descriptionKk: ct.descriptionKk || '',
      durationMinutes: ct.durationMinutes, level: ct.level, isActive: ct.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) await classTypesApi.update(editing.id, form as any);
      else await classTypesApi.create(form as any);
      setShowModal(false);
      load();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    await classTypesApi.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>{t('classTypes')}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm text-white" style={{ background: '#4978BC' }}>
          <Plus size={16} />{t('add')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 rounded-xl bg-[#e0d8cc] animate-pulse"/>)}</div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[#e0d8cc]" style={{ background: '#fff' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0d8cc]" style={{ background: '#F5F0E8' }}>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('titleRu')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal hidden md:table-cell">{t('duration')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal hidden md:table-cell">{t('level')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((ct, idx) => (
                <tr key={ct.id} className="border-b border-[#e0d8cc] last:border-0" style={{ background: idx%2===0?'#fff':'#fdfcfa' }}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{ct.titleRu}</div>
                    <div className="text-xs text-[#9b9b9b]">{ct.titleEn}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{ct.durationMinutes} мин</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#E8DCC4' }}>
                      {tLevels(ct.level as any)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: ct.isActive?'#E8F5E9':'#F5F0E8', color: ct.isActive?'#2e7d32':'#9b9b9b' }}>
                      {ct.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(ct)} className="p-1.5 rounded-lg hover:bg-[#F5F0E8] text-[#6b6b6b]"><Pencil size={14}/></button>
                      <button onClick={() => handleDelete(ct.id)} className="p-1.5 rounded-lg hover:bg-[#FDECEA] text-[#9b9b9b] hover:text-[#c62828]"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-y-auto max-h-[90vh]" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between p-6 border-b border-[#e0d8cc]">
              <h2 className="text-xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>{editing ? t('edit') : t('add')}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-[#9b9b9b]"/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="p-3 rounded-xl text-sm" style={{ background: '#FDECEA', color: '#c62828' }}>{error}</div>}

              {['titleRu','titleEn','titleKk'].map(field => (
                <div key={field}>
                  <label className="block text-sm text-[#6b6b6b] mb-1.5">{t(field as any)}</label>
                  <input type="text" value={(form as any)[field]} onChange={e => setForm(p=>({...p,[field]:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC]"/>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('duration')}</label>
                  <input type="number" value={form.durationMinutes} onChange={e => setForm(p=>({...p,durationMinutes:+e.target.value}))} min={15} required className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC]"/>
                </div>
                <div>
                  <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('level')}</label>
                  <select value={form.level} onChange={e => setForm(p=>({...p,level:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] bg-white">
                    {LEVELS.map(l => <option key={l} value={l}>{tLevels(l as any)}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p=>({...p,isActive:e.target.checked}))} className="rounded"/>
                <span className="text-sm text-[#6b6b6b]">{t('active')}</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-full text-sm border border-[#e0d8cc] text-[#6b6b6b]">{t('cancel')}</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-full text-sm text-white disabled:opacity-50" style={{ background: '#4978BC' }}>{saving ? '...' : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
