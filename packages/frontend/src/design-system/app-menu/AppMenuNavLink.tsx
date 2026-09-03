'use client';

import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Link } from '@ds/link/Link';

interface AppMenuNavLinkProps {
  href: Route;
  label: string;
  icon: ReactNode;
}

// The only part of AppMenu that needs to be a Client Component: knowing the
// current route to highlight the active link requires usePathname().
export const AppMenuNavLink = ({ href, label, icon }: AppMenuNavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`d-is-drawer-close:d-tooltip d-is-drawer-close:d-tooltip-right ${
        isActive ? 'd-menu-active' : ''
      }`}
      data-tip={label}
    >
      {icon}
      <span className="d-is-drawer-close:hidden">{label}</span>
    </Link>
  );
};
