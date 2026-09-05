import type { Role } from './schemas';

export type NavItem = {
  label: string;
  href: string;
  ready: boolean;
  adminOnly?: boolean;
};

export const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', ready: true },
  { label: 'Invoices', href: '/invoices', ready: false },
  { label: 'Quotations', href: '/quotations', ready: false },
  { label: 'Clients', href: '/clients', ready: false },
  { label: 'Catalogue', href: '/catalogue', ready: false, adminOnly: true },
  { label: 'Reports', href: '/reports', ready: false },
  { label: 'Staff', href: '/staff', ready: true, adminOnly: true },
  { label: 'Settings', href: '/settings', ready: false, adminOnly: true },
];

export const mobileTabs: NavItem[] = [
  { label: 'Overview', href: '/dashboard', ready: true },
  { label: 'Invoices', href: '/invoices', ready: false },
  { label: 'Clients', href: '/clients', ready: false },
];

export const visibleTo = (role: Role) => (item: NavItem) => !item.adminOnly || role === 'ADMIN';
