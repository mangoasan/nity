'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ptApi, PTRequestData } from '@/lib/api';

export default function PersonalTrainingPage() {
  const t = useTranslations('personalTraining');
  const [form, setForm] = useState<PTRequestData>({
    name: '',
    email: '',
    phone: '',
    preferredTime: '',
    goal: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: keyof PTRequestData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await ptApi.submit(form);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', preferredTime: '', goal: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 md:mb-16 max-w-2xl">
          <div
            className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{ color: '#4978BC' }}
          >
            Индивидуально
          </div>
          <h1
            className="text-4xl md:text-5xl mb-4"
            style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
          >
            {t('title')}
          </h1>
          <p className="text-[#6b6b6b] text-base sm:text-lg leading-relaxed">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Info */}
          <div>
            <div className="space-y-8">
              {[
                {
                  icon: '◇',
                  title: 'Индивидуальный подход',
                  text: 'Программа строится исходя из вашего уровня подготовки, целей и потребностей тела.',
                },
                {
                  icon: '◈',
                  title: 'Гибкое расписание',
                  text: 'Выбирайте удобное время для занятий. Работаем как в студии, так и онлайн.',
                },
                {
                  icon: '◆',
                  title: 'Опытные мастера',
                  text: 'Все наши преподаватели имеют сертификаты международного уровня и многолетний опыт.',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg"
                    style={{ background: '#E8DCC4', color: '#4978BC' }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3
                      className="text-lg mb-1"
                      style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[#6b6b6b] text-sm leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div
            className="rounded-2xl p-5 sm:p-8"
            style={{ background: '#F5F0E8' }}
          >
            <h2
              className="text-2xl mb-6"
              style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
            >
              {t('formTitle')}
            </h2>

            {success ? (
              <div
                className="p-6 rounded-xl text-center"
                style={{ background: '#E8DCC4' }}
              >
                <div className="text-2xl mb-3">✓</div>
                <p className="text-[#1a1a1a]">{t('success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div
                    className="p-3 rounded-xl text-sm"
                    style={{ background: '#FDECEA', color: '#c62828' }}
                  >
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('name')} *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleChange('name')}
                      placeholder={t('namePlaceholder')}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] bg-white text-sm outline-none focus:border-[#4978BC] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('email')} *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      placeholder={t('emailPlaceholder')}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] bg-white text-sm outline-none focus:border-[#4978BC] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('phone')}</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      placeholder={t('phonePlaceholder')}
                      className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] bg-white text-sm outline-none focus:border-[#4978BC] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('preferredTime')}</label>
                    <input
                      type="text"
                      value={form.preferredTime}
                      onChange={handleChange('preferredTime')}
                      placeholder={t('preferredTimePlaceholder')}
                      className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] bg-white text-sm outline-none focus:border-[#4978BC] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('goal')}</label>
                  <input
                    type="text"
                    value={form.goal}
                    onChange={handleChange('goal')}
                    placeholder={t('goalPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] bg-white text-sm outline-none focus:border-[#4978BC] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('message')}</label>
                  <textarea
                    value={form.message}
                    onChange={handleChange('message')}
                    placeholder={t('messagePlaceholder')}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#e0d8cc] bg-white text-sm outline-none focus:border-[#4978BC] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full text-sm text-white transition-colors disabled:opacity-50"
                  style={{ background: '#4978BC' }}
                >
                  {loading ? '...' : t('submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
