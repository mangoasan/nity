'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi } from '@/lib/api';

interface DashboardData {
  totalUsers: number;
  totalMasters: number;
  totalBookings: number;
  pendingPTRequests: number;
  confirmedBookings: number;
}

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const cards = data
    ? [
        { label: t('totalUsers'), value: data.totalUsers, color: '#4978BC' },
        { label: t('totalMasters'), value: data.totalMasters, color: '#4978BC' },
        { label: t('totalBookings'), value: data.totalBookings, color: '#4978BC' },
        { label: t('pendingRequests'), value: data.pendingPTRequests, color: '#e67e22' },
      ]
    : [];

  return (
    <div>
      <h1
        className="text-2xl sm:text-3xl mb-6 sm:mb-8"
        style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
      >
        {t('dashboard')}
      </h1>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-[#e0d8cc] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-6"
              style={{ background: '#fff', border: '1px solid #e0d8cc' }}
            >
              <div
                className="text-4xl font-light mb-2"
                style={{ color: card.color, fontFamily: 'Georgia' }}
              >
                {card.value}
              </div>
              <div className="text-sm text-[#6b6b6b]">{card.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
