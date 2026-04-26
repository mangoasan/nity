'use client';

import { ChangeEvent, ClipboardEvent as ReactClipboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { mastersApi, Master, resolveMediaUrl } from '@/lib/api';
import { ImagePlus, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';

type FormData = {
  slug: string;
  name: string;
  photoUrl: string;
  shortBio: string;
  fullBio: string;
  specialties: string;
  isActive: boolean;
};

type TextField = 'name' | 'slug' | 'shortBio' | 'specialties';

const emptyForm: FormData = {
  slug: '', name: '', photoUrl: '', shortBio: '', fullBio: '', specialties: '', isActive: true,
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminMastersPage() {
  const t = useTranslations('admin');
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Master | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = () =>
    mastersApi.getAll().then((data) => { setMasters(data); setLoading(false); });

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!showModal) return;

    const handlePaste = (event: ClipboardEvent) => {
      const imageItem = Array.from(event.clipboardData?.items || []).find(
        (item) => item.type === 'image/png',
      );

      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (!file) return;

      event.preventDefault();
      void uploadPhoto(file);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showModal]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (m: Master) => {
    setEditing(m);
    setForm({
      slug: m.slug,
      name: m.name,
      photoUrl: m.photoUrl || '',
      shortBio: m.shortBio || '',
      fullBio: m.fullBio || '',
      specialties: m.specialties.join(', '),
      isActive: m.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const uploadPhoto = async (file: File) => {
    if (file.type !== 'image/png') {
      setError('Можно загрузить только PNG-файл.');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      const { url } = await mastersApi.uploadPhoto(file);
      setForm((prev) => ({ ...prev, photoUrl: url }));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Не удалось загрузить изображение.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadPhoto(file);
    e.target.value = '';
  };

  const handlePhotoPaste = async (e: ReactClipboardEvent<HTMLDivElement>) => {
    const file = Array.from(e.clipboardData.items)
      .find((item) => item.type === 'image/png')
      ?.getAsFile();

    if (!file) return;

    e.preventDefault();
    await uploadPhoto(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const data = {
      ...form,
      specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        await mastersApi.update(editing.id, data);
      } else {
        await mastersApi.create(data);
      }
      setShowModal(false);
      load();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Не удалось сохранить мастера.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    await mastersApi.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
          {t('masters')}
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm text-white"
          style={{ background: '#4978BC' }}
        >
          <Plus size={16} />
          {t('add')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-[#e0d8cc] animate-pulse" />)}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[#e0d8cc]" style={{ background: '#fff' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0d8cc]" style={{ background: '#F5F0E8' }}>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">Фото</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('name')}</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal hidden md:table-cell">Специализации</th>
                <th className="text-left px-4 py-3 text-[#6b6b6b] font-normal">{t('status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {masters.map((m, idx) => (
                <tr
                  key={m.id}
                  className="border-b border-[#e0d8cc] last:border-0"
                  style={{ background: idx % 2 === 0 ? '#fff' : '#fdfcfa' }}
                >
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: '#E8DCC4' }}>
                      {m.photoUrl && (
                        <img
                          src={resolveMediaUrl(m.photoUrl)}
                          alt={m.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-[#9b9b9b]">{m.slug}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {m.specialties.slice(0, 2).map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#E8DCC4' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: m.isActive ? '#E8F5E9' : '#F5F0E8', color: m.isActive ? '#2e7d32' : '#9b9b9b' }}
                    >
                      {m.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-[#F5F0E8] transition-colors text-[#6b6b6b]">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-[#FDECEA] transition-colors text-[#9b9b9b] hover:text-[#c62828]">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-y-auto max-h-[90vh]" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between p-6 border-b border-[#e0d8cc]">
              <h2 className="text-xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
                {editing ? t('edit') : t('add')} мастера
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#9b9b9b] hover:text-[#1a1a1a]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="p-3 rounded-xl text-sm" style={{ background: '#FDECEA', color: '#c62828' }}>{error}</div>}

              {([
                { label: t('name'), field: 'name', required: true },
                { label: t('slug'), field: 'slug', required: true },
                { label: t('shortBio'), field: 'shortBio' },
                { label: t('specialties'), field: 'specialties' },
              ] as Array<{ label: string; field: TextField; required?: boolean }>).map(({ label, field, required }) => (
                <div key={field}>
                  <label className="block text-sm text-[#6b6b6b] mb-1.5">{label}</label>
                  <input
                    type="text"
                    value={form[field]}
                    onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                    required={required}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] transition-colors"
                  />
                </div>
              ))}

              <div className="space-y-3">
                <label className="block text-sm text-[#6b6b6b]">{t('photo')}</label>
                <div
                  onPaste={handlePhotoPaste}
                  className="rounded-2xl border border-dashed border-[#d7c9b5] p-4"
                  style={{ background: '#fcfaf6' }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div
                      className="relative h-28 w-28 overflow-hidden rounded-2xl border border-[#e0d8cc]"
                      style={{ background: '#E8DCC4' }}
                    >
                      {form.photoUrl ? (
                        <img
                          src={resolveMediaUrl(form.photoUrl)}
                          alt={form.name || 'Фото мастера'}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#8f7f6a]">
                          <ImagePlus size={28} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white disabled:opacity-50"
                          style={{ background: '#4978BC' }}
                        >
                          <Upload size={15} />
                          {uploadingPhoto ? 'Загрузка...' : 'Выбрать PNG'}
                        </button>

                        {form.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, photoUrl: '' }))}
                            className="rounded-full border border-[#e0d8cc] px-4 py-2 text-sm text-[#6b6b6b]"
                          >
                            Убрать фото
                          </button>
                        )}
                      </div>

                      <p className="text-sm text-[#6b6b6b]">
                        Можно выбрать PNG-файл или просто вставить картинку из буфера через Ctrl+V.
                      </p>

                      <input
                        type="text"
                        value={form.photoUrl}
                        onChange={(e) => setForm((p) => ({ ...p, photoUrl: e.target.value }))}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-[#e0d8cc] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#4978BC]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('fullBio')}</label>
                <textarea
                  value={form.fullBio}
                  onChange={(e) => setForm((p) => ({ ...p, fullBio: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] transition-colors resize-none"
                />
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
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-full text-sm border border-[#e0d8cc] text-[#6b6b6b] hover:border-[#4978BC]">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-full text-sm text-white disabled:opacity-50" style={{ background: '#4978BC' }}>
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
