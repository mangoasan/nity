'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import {
  Button,
  Card,
  CloseButton,
  EmptyState,
  LoadingStack,
  ModalShell,
  Pill,
} from '@/components/ui/nity';
import { mastersApi, Master, resolveMediaUrl } from '@/lib/api';

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function MastersClient() {
  const t = useTranslations('masters');
  const tSchedule = useTranslations('schedule');
  const [masters, setMasters] = useState<Master[]>([]);
  const [selected, setSelected] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    mastersApi
      .getAll(true)
      .then((data) => setMasters(data))
      .catch((err: unknown) => setError(errorMessage(err, 'Error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <LoadingStack count={3} />
      </div>
    );
  }

  if (error) {
    return <EmptyState title="-" text={error} />;
  }

  if (masters.length === 0) {
    return <EmptyState title="-" text={t('subtitle')} />;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {masters.map((master, index) => (
          <MasterCard
            key={master.id}
            master={master}
            flip={index % 2 === 1}
            onClick={() => setSelected(master)}
            readMore={t('readMore')}
          />
        ))}
      </div>

      {selected && (
        <MasterModal
          master={selected}
          onClose={() => setSelected(null)}
          bookLabel={tSchedule('book')}
        />
      )}
    </>
  );
}

function MasterCard({
  master,
  flip,
  readMore,
  onClick,
}: {
  master: Master;
  flip: boolean;
  readMore: string;
  onClick: () => void;
}) {
  const photo = resolveMediaUrl(master.photoUrl);

  return (
    <button
      onClick={onClick}
      type="button"
      className="group text-left"
    >
      <Card
        className={`flex h-full gap-4 overflow-hidden p-3 transition group-hover:-translate-y-1 sm:block sm:p-0 ${
          flip ? 'flex-row-reverse' : ''
        }`}
      >
        <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-2xl bg-[var(--cream)] sm:h-auto sm:w-auto sm:rounded-none sm:aspect-square">
          {photo ? (
            <img
              src={photo}
              alt={master.name}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-6xl text-[var(--accent)]/30">
              {master.name[0]}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(to_top,rgba(24,24,27,0.36),transparent)]" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-2 sm:p-6">
          <div>
            <h3 className="font-display text-2xl leading-[1.08] text-[var(--dark)] sm:text-3xl">
              {master.name}
            </h3>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
              {master.shortBio}
            </p>
          </div>
          <div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {master.specialties.slice(0, 3).map((specialty) => (
                <Pill key={specialty}>{specialty}</Pill>
              ))}
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
              {readMore}
              <ArrowRight size={15} />
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}

function MasterModal({
  master,
  onClose,
  bookLabel,
}: {
  master: Master;
  onClose: () => void;
  bookLabel: string;
}) {
  const photo = resolveMediaUrl(master.photoUrl);

  return (
    <ModalShell onClose={onClose} panelClassName="sm:max-w-4xl">
      <div className="max-h-[88vh] overflow-y-auto">
        <div className="grid sm:grid-cols-[320px_1fr]">
          <div className="relative h-72 bg-[var(--cream)] sm:h-auto sm:min-h-[560px]">
            {photo ? (
              <img src={photo} alt={master.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-8xl text-[var(--accent)]/30">
                {master.name[0]}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(to_top,var(--warm-bg),transparent)] sm:hidden" />
          </div>

          <div className="relative p-5 sm:p-8 lg:p-10">
            <CloseButton onClick={onClose} className="absolute right-4 top-4" />
            <div className="pr-12">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Nity
              </div>
              <h2 className="font-display text-4xl leading-[1.02] text-[var(--dark)] lg:text-5xl">
                {master.name}
              </h2>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {master.specialties.map((specialty) => (
                <Pill key={specialty}>{specialty}</Pill>
              ))}
            </div>

            <p className="mt-6 text-[15px] leading-8 text-[#3F3F46]">
              {master.fullBio || master.shortBio}
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <Stat label="Experience" value="8+" />
              <Stat label="Classes" value="320+" />
              <Stat label="Students" value="540" />
            </div>

            <Link href="/schedule" onClick={onClose} className="mt-8 block">
              <Button full>
                {bookLabel}
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center">
      <div className="font-display text-2xl text-[var(--accent)]">{value}</div>
      <div className="mt-1 text-xs text-[#A8A199]">{label}</div>
    </div>
  );
}
