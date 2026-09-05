'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { MoreIcon } from '@/components/icons';
import { Monogram } from '@/components/wordmark';
import { useAuth } from '@/lib/auth-context';
import { mobileTabs, navItems, visibleTo } from '@/lib/nav';

export const MobileTopBar = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-brand-deep px-4 py-3 text-white lg:hidden">
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <Monogram className="size-8 shrink-0 text-white" />
        <span className="truncate font-serif text-sm tracking-[0.16em] uppercase">
          Teegold Interiors
        </span>
      </Link>
      <p className="shrink-0 text-xs text-white/55">{user?.role === 'ADMIN' ? 'Admin' : 'Staff'}</p>
    </header>
  );
};

export const MobileTabBar = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!user) {
    return null;
  }

  const extra = navItems
    .filter(visibleTo(user.role))
    .filter((item) => !mobileTabs.some((tab) => tab.href === item.href));

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-16 rounded-t-lg bg-surface p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs tracking-[0.14em] text-muted uppercase">More</p>
            <nav className="mt-3 space-y-1">
              {extra.map((item) => {
                const Icon = item.icon;

                return item.ready ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 py-2.5 text-sm"
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                ) : (
                  <span
                    key={item.href}
                    className="flex items-center gap-3 py-2.5 text-sm text-muted"
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[10px] tracking-widest uppercase">Soon</span>
                  </span>
                );
              })}
            </nav>
            <Link
              href="/"
              onClick={() => setMoreOpen(false)}
              className="mt-4 block text-sm underline underline-offset-4"
            >
              View website
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-3 text-sm font-bold text-cancelled underline underline-offset-4"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {mobileTabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== '/dashboard' && pathname.startsWith(`${tab.href}/`));
          const Icon = tab.icon;

          if (!tab.ready) {
            return (
              <span
                key={tab.href}
                className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted"
              >
                <Icon className="size-4" />
                {tab.label}
              </span>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 py-2 text-[11px] ${
                active ? 'font-medium text-brand' : 'text-muted'
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className={`flex flex-col items-center gap-1 py-2 text-[11px] ${
            moreOpen ? 'font-medium text-brand' : 'text-muted'
          }`}
        >
          <MoreIcon className="size-4" />
          More
        </button>
      </nav>
    </>
  );
};
