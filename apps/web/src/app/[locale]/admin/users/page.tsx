'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AdminUser, adminApi, ClassPassTemplate } from '@/lib/api';
import { X, Plus } from 'lucide-react';

const PASS_TEMPLATES: { value: ClassPassTemplate; labelKey: string }[] = [
  { value: 'TRIAL', labelKey: 'passTrial' },
  { value: 'EIGHT', labelKey: 'passEight' },
  { value: 'TWELVE', labelKey: 'passTwelve' },
  { value: 'UNLIMITED_MONTH', labelKey: 'passUnlimitedMonth' },
  { value: 'CUSTOM', labelKey: 'passCustom' },
];

const ROLES: { value: 'USER' | 'ADMIN'; label: string }[] = [
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
];

interface CreateUserForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'USER' | 'ADMIN';
}

const EMPTY_FORM: CreateUserForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'USER',
};

const inputClass =
  'w-full px-3 py-2.5 rounded-xl border border-[#e0d8cc] text-sm outline-none transition-colors focus:border-[#4978BC] bg-white';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  // Grant pass state
  const [grantTarget, setGrantTarget] = useState<AdminUser | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ClassPassTemplate>('TRIAL');
  const [customCount, setCustomCount] = useState('');
  const [customCountError, setCustomCountError] = useState('');
  const [granting, setGranting] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState('');

  // Create user state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>(EMPTY_FORM);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

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
      [u.name, u.email ?? '', u.phone || '', u.role, u.authProvider].some((v) =>
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
    setCustomCountError('');

    if (selectedTemplate === 'CUSTOM') {
      const n = parseInt(customCount, 10);
      if (!customCount || isNaN(n) || n < 1 || n > 200 || !Number.isInteger(n)) {
        setCustomCountError(t('customClassCountPlaceholder' as any));
        return;
      }
    }

    setGranting(true);
    try {
      const count = selectedTemplate === 'CUSTOM' ? parseInt(customCount, 10) : undefined;
      await adminApi.grantClassPass(grantTarget.id, selectedTemplate, count);
      setGrantSuccess(t('passGranted'));
      await reload();
      setTimeout(() => {
        setGrantTarget(null);
        setGrantSuccess('');
        setCustomCount('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to grant pass');
    } finally {
      setGranting(false);
    }
  };

  const openGrant = (user: AdminUser) => {
    setGrantTarget(user);
    setSelectedTemplate('TRIAL');
    setCustomCount('');
    setCustomCountError('');
    setGrantSuccess('');
  };

  const handleCreateSubmit = async () => {
    setCreateError('');
    if (!createForm.name.trim()) {
      setCreateError(t('name') + ' — ' + t('emailOrPhoneRequired').toLowerCase());
      return;
    }
    if (!createForm.email.trim() && !createForm.phone.trim()) {
      setCreateError(t('emailOrPhoneRequired'));
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError(t('passwordMin'));
      return;
    }
    setCreating(true);
    try {
      await adminApi.createUser({
        name: createForm.name.trim(),
        email: createForm.email.trim() || undefined,
        phone: createForm.phone.trim() || undefined,
        password: createForm.password,
        role: createForm.role,
      });
      setCreateSuccess(true);
      await reload();
      setTimeout(() => {
        setShowCreate(false);
        setCreateForm(EMPTY_FORM);
        setCreateSuccess(false);
      }, 1500);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchUsers')}
            className="w-full sm:w-64 rounded-lg border border-[#e0d8cc] bg-white px-4 py-2 text-sm outline-none transition-colors focus:border-[#4978BC]"
          />
          <button
            onClick={() => { setShowCreate(true); setCreateForm(EMPTY_FORM); setCreateError(''); setCreateSuccess(false); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-white whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ background: '#4978BC' }}
          >
            <Plus size={15} />
            {t('createUser')}
          </button>
        </div>
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
                        <div className="text-xs text-[#9b9b9b]">{user.email || '—'}</div>
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
                          onClick={() => openGrant(user)}
                          className="text-xs px-3 py-1.5 rounded-full text-white whitespace-nowrap transition-opacity hover:opacity-90"
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
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setGrantTarget(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl shadow-xl" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0d8cc]">
              <h2 className="text-lg" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
                {t('grantPass')}
              </h2>
              <button
                onClick={() => setGrantTarget(null)}
                className="p-1 rounded-lg hover:bg-[#f5f0e8] transition-colors"
              >
                <X size={18} className="text-[#9b9b9b]" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* User info */}
              <div className="p-3 rounded-xl" style={{ background: '#F5F0E8' }}>
                <div className="text-sm font-medium text-[#1a1a1a]">{grantTarget.name}</div>
                <div className="text-xs text-[#6b6b6b] mt-0.5">{grantTarget.email || grantTarget.phone || '—'}</div>
              </div>

              {grantSuccess ? (
                <div className="p-3 rounded-xl text-sm text-center" style={{ background: '#E8F5E9', color: '#2e7d32' }}>
                  ✓ {grantSuccess}
                </div>
              ) : (
                <>
                  {/* Template selector */}
                  <div>
                    <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">
                      {t('selectPassTemplate')}
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => {
                        setSelectedTemplate(e.target.value as ClassPassTemplate);
                        setCustomCount('');
                        setCustomCountError('');
                      }}
                      className={inputClass}
                    >
                      {PASS_TEMPLATES.map((pt) => (
                        <option key={pt.value} value={pt.value}>{t(pt.labelKey as any)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom count input */}
                  {selectedTemplate === 'CUSTOM' && (
                    <div>
                      <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">
                        {t('customClassCount' as any)}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={customCount}
                        onChange={(e) => { setCustomCount(e.target.value); setCustomCountError(''); }}
                        placeholder={t('customClassCountPlaceholder' as any)}
                        className={`${inputClass} ${customCountError ? 'border-[#c62828]' : ''}`}
                      />
                      {customCountError && (
                        <p className="text-xs text-[#c62828] mt-1">{customCountError}</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setGrantTarget(null)}
                      className="flex-1 py-2.5 rounded-full text-sm border border-[#e0d8cc] text-[#6b6b6b] hover:bg-[#f5f0e8] transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleGrant}
                      disabled={granting}
                      className="flex-1 py-2.5 rounded-full text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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

      {/* Create User Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl shadow-xl" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0d8cc]">
              <h2 className="text-lg" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
                {t('createUserTitle')}
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg hover:bg-[#f5f0e8] transition-colors"
              >
                <X size={18} className="text-[#9b9b9b]" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {createSuccess ? (
                <div className="p-3 rounded-xl text-sm text-center" style={{ background: '#E8F5E9', color: '#2e7d32' }}>
                  ✓ {t('userCreated')}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#6b6b6b] mb-1">{t('name')} *</label>
                    <input
                      value={createForm.name}
                      onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6b6b6b] mb-1">{t('emailOptional')}</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                      className={inputClass}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6b6b6b] mb-1">{t('phoneOptional')}</label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                      className={inputClass}
                      placeholder="+7 777 000 00 00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6b6b6b] mb-1">{t('password')} *</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                      className={inputClass}
                      placeholder={t('passwordMin')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6b6b6b] mb-1">{t('role')}</label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as 'USER' | 'ADMIN' }))}
                      className={inputClass}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {createError && (
                    <div className="text-xs text-[#c62828] px-1">{createError}</div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setShowCreate(false)}
                      className="flex-1 py-2.5 rounded-full text-sm border border-[#e0d8cc] text-[#6b6b6b] hover:bg-[#f5f0e8] transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleCreateSubmit}
                      disabled={creating}
                      className="flex-1 py-2.5 rounded-full text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: '#4978BC' }}
                    >
                      {creating ? '...' : t('save')}
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
