'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';
import { navItems, visibleTo } from '@/lib/nav';

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-brand-deep text-white lg:flex">
      <div className="px-6 py-7">
        <Link
          href="/"
          className="font-serif text-base leading-tight tracking-[0.18em] uppercase hover:text-white/80"
        >
          Teegold
          <br />
          Interiors
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-2">
        {navItems.filter(visibleTo(user.role)).map((item) => {
          const active = pathname === item.href;

          if (!item.ready) {
            return (
              <span
                key={item.href}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-white/35"
              >
                {item.label}
                <span className="text-[10px] tracking-widest uppercase">Soon</span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative block px-4 py-2.5 text-sm ${
                active ? 'text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              {active && <span className="absolute top-0 left-0 h-full w-0.5 bg-brand" />}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-5">
        <p className="text-sm">{user.name}</p>
        <p className="text-xs text-white/50">
          {user.role === 'ADMIN' ? 'Admin' : 'Staff'} · {user.email}
        </p>
        <Link
          href="/"
          className="mt-3 block text-xs text-white/60 underline underline-offset-4 hover:text-white"
        >
          View website
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-2 text-xs font-bold text-white underline underline-offset-4 hover:text-white/80"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
};
