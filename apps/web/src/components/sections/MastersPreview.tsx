'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { Card, Pill } from '@/components/ui/nity';
import { mastersApi, Master, resolveMediaUrl } from '@/lib/api';

export default function MastersPreview() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mastersApi
      .getAll(true)
      .then((data) => setMasters(data.slice(0, 4)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-80 w-64 shrink-0 animate-pulse rounded-[22px] bg-[#EFE7D8] lg:w-auto" />
        ))}
      </div>
    );
  }

  return (
    <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
      {masters.map((master) => {
        const photoSrc = resolveMediaUrl(master.photoUrl);

        return (
          <Link
            key={master.id}
            href="/masters"
            className="group block w-64 shrink-0 lg:w-auto"
          >
            <Card padded={false} className="h-full overflow-hidden transition group-hover:-translate-y-1">
              <div className="relative aspect-[4/5] overflow-hidden bg-[var(--cream)]">
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt={master.name}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-7xl text-[var(--accent)]/30">
                    {master.name[0]}
                  </div>
                )}
                {master.specialties[0] && (
                  <div className="absolute right-3 top-3">
                    <Pill tone="white">{master.specialties[0]}</Pill>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display text-2xl leading-[1.08] text-[var(--dark)]">
                  {master.name}
                </h3>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                  {master.shortBio}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-[var(--accent)]">
                  <span className="truncate">{master.specialties.slice(0, 2).join(' · ')}</span>
                  <ArrowRight size={16} className="shrink-0" />
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
