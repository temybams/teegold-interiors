'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PanelLeftIcon } from '@/components/icons';
import { Monogram } from '@/components/wordmark';
import { useAuth } from '@/lib/auth-context';
import { navItems, visibleTo } from '@/lib/nav';

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-brand-deep text-white lg:flex ${
        collapsed ? 'w-[4.5rem]' : 'w-64'
      }`}
    >
      <div className={`flex items-start gap-3 py-7 ${collapsed ? 'justify-center px-2' : 'px-6'}`}>
        <Link
          href="/"
          className={`flex items-center hover:text-white/80 ${collapsed ? '' : 'gap-3'}`}
          title="Teegold Interiors"
        >
          <Monogram className="size-9 shrink-0 text-white" />
          {!collapsed && (
            <span className="font-serif text-sm leading-tight tracking-[0.18em] uppercase">
              Teegold
              <br />
              Interiors
            </span>
          )}
        </Link>
      </div>

      <div className={`px-2 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="rounded-card flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white"
        >
          <PanelLeftIcon className="size-4 shrink-0" />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-4">
        {navItems.filter(visibleTo(user.role)).map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

          const Icon = item.icon;

          if (!item.ready) {
            return (
              <span
                key={item.href}
                title={item.label}
                className={`flex items-center gap-3 py-2.5 text-sm text-white/35 ${
                  collapsed ? 'justify-center px-2' : 'px-4'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[10px] tracking-widest uppercase">Soon</span>
                  </>
                )}
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`relative flex items-center gap-3 py-2.5 text-sm ${
                collapsed ? 'justify-center px-2' : 'px-4'
              } ${active ? 'text-white' : 'text-white/70 hover:text-white'}`}
            >
              {active && <span className="absolute top-0 left-0 h-full w-0.5 bg-brand" />}
              <Icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className={`border-t border-white/10 py-5 ${collapsed ? 'px-2 text-center' : 'px-6'}`}>
        {!collapsed ? (
          <>
            <p className="truncate text-sm">{user.name}</p>
            <p className="truncate text-xs text-white/50">
              {user.role === 'ADMIN' ? 'Admin' : 'Staff'} · {user.email}
            </p>
            <Link
              href="/"
              className="mt-3 block text-sm text-white/70 underline underline-offset-4 hover:text-white"
            >
              View website
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-2 text-sm font-medium text-white underline underline-offset-4 hover:text-white/80"
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void signOut()}
            title="Sign out"
            className="mx-auto block text-[10px] font-bold tracking-widest text-white/70 uppercase hover:text-white"
          >
            Out
          </button>
        )}
      </div>
    </aside>
  );
};
