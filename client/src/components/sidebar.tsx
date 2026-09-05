'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/schemas';

type NavItem = {
  label: string;
  href: string;
  /** Unbuilt destinations are shown but inert, so the shape of the app is visible. */
  ready: boolean;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', ready: true },
  { label: 'Invoices', href: '/invoices', ready: false },
  { label: 'Quotations', href: '/quotations', ready: false },
  { label: 'Clients', href: '/clients', ready: false },
  { label: 'Catalogue', href: '/catalogue', ready: false, adminOnly: true },
  { label: 'Reports', href: '/reports', ready: false },
  { label: 'Settings', href: '/settings', ready: false, adminOnly: true },
];

const visibleTo = (role: Role) => (item: NavItem) => !item.adminOnly || role === 'ADMIN';

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-brand-deep text-white">
      <div className="px-6 py-7">
        <p className="font-serif text-base leading-tight tracking-[0.18em] uppercase">
          Teegold
          <br />
          Interiors
        </p>
      </div>

      <nav className="flex-1 px-2">
        {navItems.filter(visibleTo(user.role)).map((item) => {
          const active = pathname === item.href;

          if (!item.ready) {
            return (
              <span
                key={item.href}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-white/35"
              >
                {item.label}
                <span className="text-[10px] tracking-[0.1em] uppercase">Soon</span>
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
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-3 text-xs text-white/60 underline underline-offset-4 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
};
