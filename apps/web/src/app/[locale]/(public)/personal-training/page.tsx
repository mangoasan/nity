'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Check, Clock3, Gem, Sparkles } from 'lucide-react';
import { Alert, Button, Card, TextArea, TextField } from '@/components/ui/nity';
import { ptApi, PTRequestData } from '@/lib/api';

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function PersonalTrainingPage() {
  const t = useTranslations('personalTraining');
  const tCommon = useTranslations('common');
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
    } catch (err: unknown) {
      setError(errorMessage(err, 'Ошибка при отправке'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--warm-bg)] py-8 sm:py-12 lg:py-14">
      <div className="page-shell">
        <section className="mb-10 max-w-3xl lg:mb-14">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {t('formTitle')}
          </div>
          <h1 className="font-display text-4xl leading-[1.02] text-[var(--dark)] sm:text-5xl lg:text-7xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg">
            {t('subtitle')}
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="space-y-5">
            {[
              {
                icon: Gem,
                title: 'Individual approach',
                text: 'A program based on your level, goals, body, and rhythm.',
              },
              {
                icon: Clock3,
                title: 'Flexible time',
                text: 'Practice in the studio or online at a time that fits your week.',
              },
              {
                icon: Sparkles,
                title: 'Expert masters',
                text: 'Work one on one with experienced Nity teachers.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Icon size={21} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl leading-[1.1] text-[var(--dark)]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.text}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-5 sm:p-8">
            {success ? (
              <div className="py-8 text-center">
                <div className="relative mx-auto mb-5 h-24 w-24">
                  <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-20 [animation:nity-ripple_1.4s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
                  <div className="absolute inset-5 rounded-full bg-[var(--accent-soft)]" />
                  <div className="absolute inset-8 flex items-center justify-center rounded-full bg-[var(--accent)] text-white">
                    <Check size={24} />
                  </div>
                </div>
                <h2 className="font-display text-3xl text-[var(--dark)]">{t('success')}</h2>
                <Link href="/" className="mt-6 inline-flex">
                  <Button>
                    {tCommon('back')}
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <h2 className="mb-6 font-display text-3xl text-[var(--dark)]">{t('formTitle')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <Alert tone="error">{error}</Alert>}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label={`${t('name')} *`}
                      type="text"
                      value={form.name}
                      onChange={handleChange('name')}
                      placeholder={t('namePlaceholder')}
                      required
                    />
                    <TextField
                      label={`${t('email')} *`}
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      placeholder={t('emailPlaceholder')}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label={t('phone')}
                      type="tel"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      placeholder={t('phonePlaceholder')}
                    />
                    <TextField
                      label={t('preferredTime')}
                      type="text"
                      value={form.preferredTime}
                      onChange={handleChange('preferredTime')}
                      placeholder={t('preferredTimePlaceholder')}
                    />
                  </div>

                  <TextField
                    label={t('goal')}
                    type="text"
                    value={form.goal}
                    onChange={handleChange('goal')}
                    placeholder={t('goalPlaceholder')}
                  />

                  <TextArea
                    label={t('message')}
                    value={form.message}
                    onChange={handleChange('message')}
                    placeholder={t('messagePlaceholder')}
                    rows={4}
                  />

                  <Button type="submit" full size="lg" disabled={loading}>
                    {loading ? '...' : t('submit')}
                    {!loading && <ArrowRight size={16} />}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
