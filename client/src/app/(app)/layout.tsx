'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { PageLoader } from '@/components/loader';
import { MobileTabBar, MobileTopBar } from '@/components/mobile-nav';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth-context';

/**
 * Guards every page in this group. The server also rejects unauthenticated
 * requests, so this redirect is for the person using the app, not for security.
 */
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return <PageLoader label={status === 'loading' ? 'Signing you in' : 'Redirecting'} />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <div className="flex-1 pb-16 lg:pb-0">{children}</div>
        <MobileTabBar />
      </div>
    </div>
  );
};

export default AppLayout;
