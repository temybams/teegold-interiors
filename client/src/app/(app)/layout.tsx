'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PageLoader } from '@/components/loader';
import { MobileTabBar, MobileTopBar } from '@/components/mobile-nav';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth-context';

const SIDEBAR_KEY = 'teegold.sidebar.collapsed';

/**
 * Guards every page in this group. The server also rejects unauthenticated
 * requests, so this redirect is for the person using the app, not for security.
 */
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === '1');
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      } catch {
        // ignore storage errors
      }

      return next;
    });
  };

  if (status !== 'authenticated') {
    return <PageLoader label={status === 'loading' ? 'Signing you in' : 'Redirecting'} />;
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileTopBar />
        <div className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </div>
        <MobileTabBar />
      </div>
    </div>
  );
};

export default AppLayout;
