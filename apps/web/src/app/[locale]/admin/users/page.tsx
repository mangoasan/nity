'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AdminUser, adminApi } from '@/lib/api';
import { X, Plus, Snowflake, Trash2 } from 'lucide-react';

type PassOption = {
  durationMonths: number;
  classCount?: number;
  isUnlimited: boolean;
};

const PASS_OPTIONS: PassOption[] = [
  { durationMonths: 1, classCount: 8, isUnlimited: false },
  { durationMonths: 1, classCount: 12, isUnlimited: false },
  { durationMonths: 1, isUnlimited: true },
  { durationMonths: 3, classCount: 24, isUnlimited: false },
  { durationMonths: 3, classCount: 36, isUnlimited: false },
  { durationMonths: 3, isUnlimited: true },
  { durationMonths: 6, classCount: 48, isUnlimited: false },
  { durationMonths: 6, classCount: 72, isUnlimited: false },
  { durationMonths: 6, isUnlimited: true },
  { durationMonths: 12, classCount: 96, isUnlimited: false },
  { durationMonths: 12, classCount: 144, isUnlimited: false },
  { durationMonths: 12, isUnlimited: true },
];
const CUSTOM_PASS_INDEX = String(PASS_OPTIONS.length);

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

type TranslationValues = Record<string, string | number | Date>;

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function inclusiveDays(start: string, end: string) {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
}

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const tr = t as unknown as (key: string, values?: TranslationValues) => string;
  const locale = useLocale();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  // Grant pass state
  const [grantTarget, setGrantTarget] = useState<AdminUser | null>(null);
  const [selectedPassIndex, setSelectedPassIndex] = useState('0');
  const [customDurationMonths, setCustomDurationMonths] = useState('1');
  const [customClassCount, setCustomClassCount] = useState('8');
  const [customUnlimited, setCustomUnlimited] = useState(false);
  const [customPassError, setCustomPassError] = useState('');
  const [granting, setGranting] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState('');

  // Freeze pass state
  const [freezeTarget, setFreezeTarget] = useState<AdminUser | null>(null);
  const [freezeStart, setFreezeStart] = useState('');
  const [freezeEnd, setFreezeEnd] = useState('');
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeError, setFreezeError] = useState('');
  const [freezing, setFreezing] = useState(false);
  const [freezeSuccess, setFreezeSuccess] = useState('');

  // Delete user state
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const passOptionLabel = (option: (typeof PASS_OPTIONS)[number]) => {
    const duration = tr(`passDuration${option.durationMonths}`);
    const access = option.isUnlimited
      ? tr('passUnlimitedShort')
      : tr('passClassesCount', { count: option.classCount ?? 0 });
    return `${duration}: ${access}`;
  };

  const roleColors: Record<string, { bg: string; text: string }> = {
    ADMIN: { bg: '#EFF3FB', text: '#4978BC' },
    USER: { bg: '#F5F0E8', text: '#6b6b6b' },
  };

  const handleGrant = async () => {
    if (!grantTarget) return;

    setCustomPassError('');
    const selectedOption =
      selectedPassIndex === CUSTOM_PASS_INDEX
        ? {
            durationMonths: parseInt(customDurationMonths, 10),
            classCount: customUnlimited ? undefined : parseInt(customClassCount, 10),
            isUnlimited: customUnlimited,
          }
        : PASS_OPTIONS[Number(selectedPassIndex)];

    if (
      !selectedOption ||
      !Number.isInteger(selectedOption.durationMonths) ||
      selectedOption.durationMonths < 1 ||
      selectedOption.durationMonths > 120 ||
      (!selectedOption.isUnlimited &&
        (!selectedOption.classCount ||
          !Number.isInteger(selectedOption.classCount) ||
          selectedOption.classCount < 1 ||
          selectedOption.classCount > 1000))
    ) {
      setCustomPassError(tr('customPassInvalid'));
      return;
    }

    setGranting(true);
    try {
      await adminApi.grantClassPass(grantTarget.id, selectedOption);
      setGrantSuccess(t('passGranted'));
      await reload();
      setTimeout(() => {
        setGrantTarget(null);
        setGrantSuccess('');
      }, 1500);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to grant pass'));
    } finally {
      setGranting(false);
    }
  };

  const openGrant = (user: AdminUser) => {
    setGrantTarget(user);
    setSelectedPassIndex('0');
    setCustomDurationMonths('1');
    setCustomClassCount('8');
    setCustomUnlimited(false);
    setCustomPassError('');
    setGrantSuccess('');
  };

  const freezeDaysLeft = (user: AdminUser | null) => {
    if (!user?.activePass) return 0;
    return Math.max(0, user.activePass.freezeDaysTotal - user.activePass.freezeDaysUsed);
  };

  const openFreeze = (user: AdminUser) => {
    const today = dateKey(new Date());
    setFreezeTarget(user);
    setFreezeStart(today);
    setFreezeEnd(today);
    setFreezeReason('');
    setFreezeError('');
    setFreezeSuccess('');
  };

  const handleFreeze = async () => {
    if (!freezeTarget) return;

    const days = inclusiveDays(freezeStart, freezeEnd);
    const daysLeft = freezeDaysLeft(freezeTarget);
    setFreezeError('');

    if (!freezeTarget.activePass) {
      setFreezeError(tr('freezeNoPass'));
      return;
    }
    if (!Number.isFinite(days) || days < 1) {
      setFreezeError(tr('freezeInvalidDates'));
      return;
    }
    if (days > daysLeft) {
      setFreezeError(tr('freezeNotEnoughDays'));
      return;
    }

    setFreezing(true);
    try {
      await adminApi.freezeClassPass(freezeTarget.id, {
        startDate: freezeStart,
        endDate: freezeEnd,
        reason: freezeReason.trim() || undefined,
      });
      setFreezeSuccess(tr('freezeCreated'));
      await reload();
      setTimeout(() => {
        setFreezeTarget(null);
        setFreezeSuccess('');
      }, 1500);
    } catch (err: unknown) {
      setFreezeError(errorMessage(err, 'Failed to freeze pass'));
    } finally {
      setFreezing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      await reload();
      setDeleteTarget(null);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to delete user'));
    } finally {
      setDeleting(false);
    }
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
    } catch (err: unknown) {
      setCreateError(errorMessage(err, 'Failed to create user'));
    } finally {
      setCreating(false);
    }
  };

  const passLabel = (user: AdminUser) => {
    if (!user.activePass) return null;
    const exp = user.activePass.expiresAt
      ? dateFormatter.format(new Date(user.activePass.expiresAt))
      : '∞';
    const freezeLeft = Math.max(
      0,
      user.activePass.freezeDaysTotal - user.activePass.freezeDaysUsed,
    );

    if (user.activePass.type === 'unlimited') {
      return `∞ · ${tr('passUntil', { date: exp })} · ${tr('freezeDaysLeft', { count: freezeLeft })}`;
    }
    const total = user.activePass.totalClasses || user.activePass.remainingClasses || 0;
    return `${user.activePass.remainingClasses} / ${total} · ${tr('passUntil', { date: exp })} · ${tr('freezeDaysLeft', { count: freezeLeft })}`;
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
            <table className="w-full min-w-[920px] text-sm">
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openGrant(user)}
                            className="text-xs px-3 py-1.5 rounded-full text-white whitespace-nowrap transition-opacity hover:opacity-90"
                            style={{ background: '#4978BC' }}
                          >
                            {t('grantPass')}
                          </button>
                          <button
                            onClick={() => openFreeze(user)}
                            disabled={!user.activePass || freezeDaysLeft(user) <= 0}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors disabled:opacity-45"
                            style={{ background: '#EFF3FB', color: '#4978BC' }}
                          >
                            <Snowflake size={13} />
                            {tr('freezePass')}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
                            style={{ background: '#FDECEA', color: '#c62828' }}
                          >
                            <Trash2 size={13} />
                            {t('delete')}
                          </button>
                        </div>
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
                  {/* Pass selector */}
                  <div>
                    <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">
                      {t('selectPassTemplate')}
                    </label>
                    <select
                      value={selectedPassIndex}
                      onChange={(e) => {
                        setSelectedPassIndex(e.target.value);
                      }}
                      className={inputClass}
                    >
                      {PASS_OPTIONS.map((option, index) => (
                        <option key={`${option.durationMonths}-${option.classCount || 'unlimited'}`} value={index}>
                          {passOptionLabel(option)}
                        </option>
                      ))}
                      <option value={CUSTOM_PASS_INDEX}>{tr('passCustom')}</option>
                    </select>
                  </div>

                  {selectedPassIndex === CUSTOM_PASS_INDEX && (
                    <div className="space-y-3 rounded-xl border border-[#e0d8cc] bg-[#FDFBFA] p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">
                            {tr('passCustomDuration')}
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={customDurationMonths}
                            onChange={(e) => {
                              setCustomDurationMonths(e.target.value);
                              setCustomPassError('');
                            }}
                            className={inputClass}
                            placeholder={tr('passCustomDurationPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">
                            {tr('customClassCount')}
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={1000}
                            value={customClassCount}
                            onChange={(e) => {
                              setCustomClassCount(e.target.value);
                              setCustomPassError('');
                            }}
                            disabled={customUnlimited}
                            className={inputClass}
                            placeholder={tr('customClassCountPlaceholder')}
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-[#6b6b6b]">
                        <input
                          type="checkbox"
                          checked={customUnlimited}
                          onChange={(e) => {
                            setCustomUnlimited(e.target.checked);
                            setCustomPassError('');
                          }}
                          className="h-4 w-4 rounded border-[#e0d8cc]"
                        />
                        {tr('passCustomUnlimited')}
                      </label>
                      {customPassError && (
                        <div className="text-xs text-[#c62828]">{customPassError}</div>
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

      {/* Freeze Pass Modal */}
      {freezeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setFreezeTarget(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl shadow-xl" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0d8cc]">
              <h2 className="text-lg" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
                {tr('freezePass')}
              </h2>
              <button
                onClick={() => setFreezeTarget(null)}
                className="p-1 rounded-lg hover:bg-[#f5f0e8] transition-colors"
              >
                <X size={18} className="text-[#9b9b9b]" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="p-3 rounded-xl" style={{ background: '#F5F0E8' }}>
                <div className="text-sm font-medium text-[#1a1a1a]">{freezeTarget.name}</div>
                <div className="text-xs text-[#6b6b6b] mt-0.5">
                  {freezeTarget.activePass
                    ? tr('freezeDaysLeft', { count: freezeDaysLeft(freezeTarget) })
                    : tr('freezeNoPass')}
                </div>
              </div>

              {freezeSuccess ? (
                <div className="p-3 rounded-xl text-sm text-center" style={{ background: '#E8F5E9', color: '#2e7d32' }}>
                  {freezeSuccess}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">
                        {tr('freezeStart')}
                      </label>
                      <input
                        type="date"
                        value={freezeStart}
                        onChange={(e) => { setFreezeStart(e.target.value); setFreezeError(''); }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">
                        {tr('freezeEnd')}
                      </label>
                      <input
                        type="date"
                        value={freezeEnd}
                        onChange={(e) => { setFreezeEnd(e.target.value); setFreezeError(''); }}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">
                      {tr('freezeReason')}
                    </label>
                    <input
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="text-xs text-[#6b6b6b]">
                    {tr('freezeSelectedDays', {
                      count: Math.max(
                        0,
                        Number.isFinite(inclusiveDays(freezeStart, freezeEnd))
                          ? inclusiveDays(freezeStart, freezeEnd)
                          : 0,
                      ),
                    })}
                  </div>

                  {freezeError && (
                    <div className="text-xs text-[#c62828] px-1">{freezeError}</div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setFreezeTarget(null)}
                      className="flex-1 py-2.5 rounded-full text-sm border border-[#e0d8cc] text-[#6b6b6b] hover:bg-[#f5f0e8] transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleFreeze}
                      disabled={freezing || !freezeTarget.activePass}
                      className="flex-1 py-2.5 rounded-full text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: '#4978BC' }}
                    >
                      {freezing ? '...' : t('save')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl shadow-xl" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0d8cc]">
              <h2 className="text-lg" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
                {tr('deleteUser')}
              </h2>
              <button
                onClick={() => setDeleteTarget(null)}
                className="p-1 rounded-lg hover:bg-[#f5f0e8] transition-colors"
              >
                <X size={18} className="text-[#9b9b9b]" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="p-3 rounded-xl" style={{ background: '#FDECEA', color: '#c62828' }}>
                <div className="text-sm font-medium">{deleteTarget.name}</div>
                <div className="text-xs mt-1">{tr('deleteUserConfirm')}</div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-full text-sm border border-[#e0d8cc] text-[#6b6b6b] hover:bg-[#f5f0e8] transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-full text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#c62828' }}
                >
                  {deleting ? '...' : t('confirmDelete')}
                </button>
              </div>
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
