'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { mastersApi, Master, resolveMediaUrl } from '@/lib/api';

export default function MastersPreview() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mastersApi.getAll(true).then((data) => {
      setMasters(data.slice(0, 3));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden">
            <div className="aspect-[3/4] bg-[#e0d8cc] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {masters.map((master) => {
        const photoSrc = resolveMediaUrl(master.photoUrl);

        return (
          <Link
            key={master.id}
            href="/masters"
            className="group block rounded-2xl overflow-hidden border border-[#e0d8cc] hover:border-[#4978BC] transition-colors"
          >
            <div className="relative aspect-[3/4] overflow-hidden" style={{ background: '#E8DCC4' }}>
              {master.photoUrl ? (
                <img
                  src={photoSrc}
                  alt={master.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl text-[#4978BC] opacity-30" style={{ fontFamily: 'Georgia' }}>
                    {master.name[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="p-5">
              <h3
                className="text-xl mb-1"
                style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
              >
                {master.name}
              </h3>
              <p className="text-sm text-[#6b6b6b] mb-3 line-clamp-2">{master.shortBio}</p>
              <div className="flex flex-wrap gap-1">
                {master.specialties.slice(0, 2).map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#E8DCC4', color: '#1a1a1a' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
