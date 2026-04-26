'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AdminUser, adminApi } from '@/lib/api';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    adminApi
      .getUsers()
      .then((data) => setUsers(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
      .finally(() => setLoading(false));
  }, []);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [locale],
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;

    return users.filter((user) =>
      [user.name, user.email, user.role, user.authProvider].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [query, users]);

  const roleColors: Record<string, { bg: string; text: string }> = {
    ADMIN: { bg: '#EFF3FB', text: '#4978BC' },
    USER: { bg: '#F5F0E8', text: '#6b6b6b' },
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl sm:text-3xl"
          style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
        >
          {t('users')}
        </h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchUsers')}
          className="w-full sm:w-72 rounded-lg border border-[#e0d8cc] bg-white px-4 py-2 text-sm outline-none transition-colors focus:border-[#4978BC]"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-16 rounded-xl bg-[#e0d8cc] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#e0d8cc] bg-white p-6 text-sm text-[#c62828]">
          {error}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-[#e0d8cc] bg-white p-6 text-sm text-[#6b6b6b]">
          {t('noUsers')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e0d8cc] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#e0d8cc] bg-[#F5F0E8]">
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">
                    {t('user')}
                  </th>
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">
                    {t('role')}
                  </th>
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">
                    {t('authProvider')}
                  </th>
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">
                    {t('registeredAt')}
                  </th>
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">
                    {t('bookingsCount')}
                  </th>
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">
                    {t('ptRequestsCount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const roleColor = roleColors[user.role] || roleColors.USER;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[#e0d8cc] last:border-0"
                      style={{ background: index % 2 === 0 ? '#fff' : '#fdfcfa' }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1a1a1a]">{user.name}</div>
                        <div className="text-xs text-[#9b9b9b]">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs"
                          style={{ background: roleColor.bg, color: roleColor.text }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{user.authProvider}</td>
                      <td className="px-4 py-3 text-[#6b6b6b]">
                        {dateFormatter.format(new Date(user.createdAt))}
                      </td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{user._count.bookings}</td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{user._count.ptRequests}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
