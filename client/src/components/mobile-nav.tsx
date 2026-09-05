'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { mobileTabs, navItems, visibleTo } from '@/lib/nav';

export const MobileTopBar = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-brand-deep px-4 py-3 text-white lg:hidden">
      <Link href="/" className="font-serif text-sm tracking-[0.18em] uppercase">
        Teegold Interiors
      </Link>
      <p className="text-xs text-white/55">{user?.role === 'ADMIN' ? 'Admin' : 'Staff'}</p>
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
              {extra.map((item) =>
                item.ready ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="block py-2.5 text-sm"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span key={item.href} className="flex justify-between py-2.5 text-sm text-muted">
                    {item.label}
                    <span className="text-[10px] tracking-[0.1em] uppercase">Soon</span>
                  </span>
                ),
              )}
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

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-hairline bg-surface lg:hidden">
        {mobileTabs.map((tab) => {
          const active = pathname === tab.href;

          if (!tab.ready) {
            return (
              <span key={tab.href} className="py-3 text-center text-[11px] text-muted">
                {tab.label}
              </span>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-3 text-center text-[11px] ${active ? 'font-medium text-brand' : 'text-muted'}`}
            >
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className={`py-3 text-[11px] ${moreOpen ? 'font-medium text-brand' : 'text-muted'}`}
        >
          More
        </button>
      </nav>
    </>
  );
};
