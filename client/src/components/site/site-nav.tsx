'use client';

import Link from 'next/link';

import { Monogram } from '@/components/wordmark';
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

  return (
    <header className="sticky top-0 z-10 border-b border-page-hairline bg-page/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Monogram className="size-9 text-page-ink" />
          <span className="font-serif text-base tracking-[0.2em] uppercase">Teegold Interiors</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="text-sm text-page-ink/70 hover:text-page-ink"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href={signedIn ? '/dashboard' : '/login'}
            className="text-sm text-page-ink/60 underline underline-offset-4 hover:text-page-ink"
          >
            {signedIn ? 'Go to dashboard' : 'Sign in'}
          </Link>
          <a
            href="#contact"
            className="rounded-card bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Request a quote
          </a>
        </div>
      </div>
    </header>
  );
};
