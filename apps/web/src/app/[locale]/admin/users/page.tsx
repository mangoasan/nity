'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AdminUser, adminApi, ClassPassTemplate } from '@/lib/api';
import { X } from 'lucide-react';

const PASS_TEMPLATES: { value: ClassPassTemplate; labelKey: string }[] = [
  { value: 'TRIAL', labelKey: 'passTrial' },
  { value: 'EIGHT', labelKey: 'passEight' },
  { value: 'TWELVE', labelKey: 'passTwelve' },
  { value: 'UNLIMITED_MONTH', labelKey: 'passUnlimitedMonth' },
];

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [grantTarget, setGrantTarget] = useState<AdminUser | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ClassPassTemplate>('TRIAL');
  const [granting, setGranting] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState('');

  const reload = () =>
    adminApi.getUsers().then((data) => setUsers(data)).catch((err) =>
      setError(err instanceof Error ? err.message : 'Request failed'),
    ).finally(() => setLoading(false));

  useEffect(() => { reload(); }, []);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }),
    [locale],
  );

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.phone || '', u.role, u.authProvider].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [query, users]);

  const roleColors: Record<string, { bg: string; text: string }> = {
    ADMIN: { bg: '#EFF3FB', text: '#4978BC' },
    USER: { bg: '#F5F0E8', text: '#6b6b6b' },
  };

  const handleGrant = async () => {
    if (!grantTarget) return;
    setGranting(true);
    try {
      await adminApi.grantClassPass(grantTarget.id, selectedTemplate);
      setGrantSuccess(t('passGranted'));
      await reload();
      setTimeout(() => {
        setGrantTarget(null);
        setGrantSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to grant pass');
    } finally {
      setGranting(false);
    }
  };

  const passLabel = (user: AdminUser) => {
    if (!user.activePass) return null;
    if (user.activePass.type === 'unlimited') {
      const exp = user.activePass.expiresAt
        ? dateFormatter.format(new Date(user.activePass.expiresAt))
        : '∞';
      return `∞ до ${exp}`;
    }
    return `${user.activePass.remainingClasses} зан.`;
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
          {t('users')}
        </h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchUsers')}
          className="w-full sm:w-72 rounded-lg border border-[#e0d8cc] bg-white px-4 py-2 text-sm outline-none transition-colors focus:border-[#4978BC]"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#e0d8cc] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#e0d8cc] bg-white p-6 text-sm text-[#c62828]">{error}</div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-[#e0d8cc] bg-white p-6 text-sm text-[#6b6b6b]">{t('noUsers')}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e0d8cc] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#e0d8cc] bg-[#F5F0E8]">
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">{t('user')}</th>
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">{t('phone')}</th>
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">{t('role')}</th>
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">{t('passActive')}</th>
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">{t('registeredAt')}</th>
                  <th className="px-4 py-3 text-left font-normal text-[#6b6b6b]">{t('bookingsCount')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const roleColor = roleColors[user.role] || roleColors.USER;
                  const label = passLabel(user);
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
                      <td className="px-4 py-3 text-[#6b6b6b] text-xs">{user.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs"
                          style={{ background: roleColor.bg, color: roleColor.text }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {label ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: '#E8F5E9', color: '#2e7d32' }}
                          >
                            {label}
                          </span>
                        ) : (
                          <span className="text-xs text-[#9b9b9b]">{t('passNone')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#6b6b6b]">
                        {dateFormatter.format(new Date(user.createdAt))}
                      </td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{user._count.bookings}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setGrantTarget(user); setSelectedTemplate('TRIAL'); setGrantSuccess(''); }}
                          className="text-xs px-3 py-1.5 rounded-full text-white whitespace-nowrap"
                          style={{ background: '#4978BC' }}
                        >
                          {t('grantPass')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grant Pass Modal */}
      {grantTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="w-full max-w-sm rounded-2xl" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between p-6 border-b border-[#e0d8cc]">
              <h2 className="text-lg" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
                {t('grantPass')}
              </h2>
              <button onClick={() => setGrantTarget(null)}>
                <X size={20} className="text-[#9b9b9b]" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm font-medium">{grantTarget.name}</div>
                <div className="text-xs text-[#9b9b9b]">{grantTarget.email}</div>
              </div>

              {grantSuccess ? (
                <div className="p-3 rounded-xl text-sm text-center" style={{ background: '#E8F5E9', color: '#2e7d32' }}>
                  {grantSuccess}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm text-[#6b6b6b] mb-1.5">{t('selectPassTemplate')}</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value as ClassPassTemplate)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none focus:border-[#4978BC] bg-white"
                    >
                      {PASS_TEMPLATES.map((pt) => (
                        <option key={pt.value} value={pt.value}>{t(pt.labelKey as any)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setGrantTarget(null)}
                      className="flex-1 py-2.5 rounded-full text-sm border border-[#e0d8cc] text-[#6b6b6b]"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleGrant}
                      disabled={granting}
                      className="flex-1 py-2.5 rounded-full text-sm text-white disabled:opacity-50"
                      style={{ background: '#4978BC' }}
                    >
                      {granting ? '...' : t('save')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
