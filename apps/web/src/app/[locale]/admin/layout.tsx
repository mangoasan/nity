'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import { LayoutDashboard, Users, Calendar, BookOpen, Dumbbell, Home, LogOut, Menu, X } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin');
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, loading]);

  // Close sidebar on route change (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#6b6b6b]">Загрузка...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const navItems = [
    { href: '/admin', label: t('dashboard'), icon: LayoutDashboard, exact: true },
    { href: '/admin/users', label: t('users'), icon: Users },
    { href: '/admin/masters', label: t('masters'), icon: Users },
    { href: '/admin/class-types', label: t('classTypes'), icon: BookOpen },
    { href: '/admin/schedule', label: t('schedule'), icon: Calendar },
    { href: '/admin/bookings', label: t('bookings'), icon: BookOpen },
    { href: '/admin/personal-training', label: t('personalTraining'), icon: Dumbbell },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f8f7f5' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, inline on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-200 ease-in-out lg:relative lg:inset-auto lg:z-auto lg:w-60 lg:shrink-0 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ background: '#fff', borderColor: '#e0d8cc' }}
      >
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#e0d8cc' }}>
          <Link href="/" onClick={() => setSidebarOpen(false)}>
            <span
              className="text-2xl font-light tracking-[0.15em]"
              style={{ color: '#4978BC', fontFamily: 'Georgia, serif' }}
            >
              NITY
            </span>
            <div className="text-xs text-[#9b9b9b] mt-1">Admin Panel</div>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg text-[#9b9b9b] hover:bg-[#F5F0E8]"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === '/admin'
              : pathname.startsWith(item.href) && item.href !== '/admin';
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'text-[#4978BC]' : 'text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#F5F0E8]'
                }`}
                style={isActive ? { background: '#EFF3FB' } : {}}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: '#e0d8cc' }}>
          <div className="text-xs text-[#9b9b9b] mb-2 px-3 truncate">{user?.name}</div>
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="mb-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#F5F0E8] w-full transition-colors"
          >
            <Home size={16} />
            {t('backToSite')}
          </Link>
          <button
            onClick={() => { handleLogout(); setSidebarOpen(false); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#F5F0E8] w-full transition-colors"
          >
            <LogOut size={16} />
            {t('signOut')}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-30"
          style={{ background: '#fff', borderColor: '#e0d8cc' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[#6b6b6b] hover:bg-[#F5F0E8] -ml-1"
          >
            <Menu size={20} />
          </button>
          <span
            className="text-lg font-light tracking-[0.15em]"
            style={{ color: '#4978BC', fontFamily: 'Georgia, serif' }}
          >
            NITY Admin
          </span>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
