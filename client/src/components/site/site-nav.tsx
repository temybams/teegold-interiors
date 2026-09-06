'use client';

import Link from 'next/link';
import { useState } from 'react';

import { CloseIcon, MenuIcon } from '@/components/icons';
import { Wordmark } from '@/components/wordmark';
import { useAuth } from '@/lib/auth-context';

const sections = [
  { label: 'Services', href: '#services' },
  { label: 'Our work', href: '#work' },
  { label: 'Contact', href: '#contact' },
];

/**
 * Staff sign-in is deliberately a quiet text link: hundreds of customers will see
 * this page against a handful of staff, so the customer's action stays the loud one.
 */
export const SiteNav = () => {
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-10 border-b border-page-hairline bg-page/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="min-w-0" onClick={close}>
          <Wordmark
            markClassName="size-8 shrink-0 text-page-ink sm:size-9"
            textClassName="truncate font-serif text-sm tracking-[0.16em] uppercase sm:text-base sm:tracking-[0.2em]"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="site-nav-link text-sm text-page-ink/70 hover:text-page-ink"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href={signedIn ? '/dashboard' : '/login'}
            className="text-sm text-page-ink/60 underline underline-offset-4 hover:text-page-ink"
          >
            {signedIn ? 'Go to dashboard' : 'Sign in'}
          </Link>
          <a
            href="#contact"
            className="site-cta rounded-card bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Request a quote
          </a>
        </div>

        <button
          type="button"
          className="rounded-card -mr-1 p-2 text-page-ink md:hidden"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-page-hairline px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {sections.map((section) => (
              <a
                key={section.href}
                href={section.href}
                onClick={close}
                className="py-2.5 text-sm"
              >
                {section.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-3 border-t border-page-hairline pt-4">
            <Link
              href={signedIn ? '/dashboard' : '/login'}
              onClick={close}
              className="text-sm underline underline-offset-4"
            >
              {signedIn ? 'Go to dashboard' : 'Sign in'}
            </Link>
            <a
              href="#contact"
              onClick={close}
              className="site-cta rounded-card bg-brand px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              Request a quote
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
