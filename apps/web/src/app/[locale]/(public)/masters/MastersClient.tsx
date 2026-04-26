'use client';

import { useEffect, useState } from 'react';
import { mastersApi, Master, resolveMediaUrl } from '@/lib/api';

export default function MastersClient() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [selected, setSelected] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mastersApi.getAll(true).then((data) => {
      setMasters(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-[3/4] bg-[#e0d8cc]" />
            <div className="p-6 space-y-2">
              <div className="h-6 bg-[#e0d8cc] rounded" />
              <div className="h-4 bg-[#e0d8cc] rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
        {masters.map((master) => (
          <div
            key={master.id}
            className="group cursor-pointer rounded-2xl overflow-hidden border border-[#e0d8cc] hover:border-[#4978BC] transition-all hover:shadow-lg"
            onClick={() => setSelected(master)}
          >
            <div
              className="relative aspect-[3/4] overflow-hidden"
              style={{ background: '#E8DCC4' }}
            >
              {master.photoUrl ? (
                <img
                  src={resolveMediaUrl(master.photoUrl)}
                  alt={master.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span
                    className="text-6xl"
                    style={{ color: '#4978BC', opacity: 0.3, fontFamily: 'Georgia' }}
                  >
                    {master.name[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="p-6">
              <h3
                className="text-2xl mb-2"
                style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
              >
                {master.name}
              </h3>
              <p className="text-sm text-[#6b6b6b] mb-4 line-clamp-3 leading-relaxed">
                {master.shortBio}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {master.specialties.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: '#F5F0E8', color: '#4a4a4a' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-4 text-sm" style={{ color: '#4978BC' }}>
                Читать подробнее →
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: '#fff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
              style={{ background: '#F5F0E8' }}
            >
              ×
            </button>
            <div className="flex flex-col sm:flex-row">
              <div
                className="relative w-full sm:w-52 sm:shrink-0 h-48 sm:h-auto sm:min-h-[360px]"
                style={{ background: '#E8DCC4' }}
              >
                {selected.photoUrl && (
                  <img
                    src={resolveMediaUrl(selected.photoUrl)}
                    alt={selected.name}
                    className="absolute inset-0 h-full w-full rounded-t-2xl object-cover sm:rounded-l-2xl sm:rounded-t-none"
                  />
                )}
              </div>
              <div className="p-5 sm:p-8">
                <h2
                  className="text-2xl sm:text-3xl mb-3"
                  style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
                >
                  {selected.name}
                </h2>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {selected.specialties.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: '#E8DCC4', color: '#1a1a1a' }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-[#4a4a4a] leading-relaxed text-sm">
                  {selected.fullBio || selected.shortBio}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
