'use client';

import { cx } from '@ds';
import { Link } from '@ds/link/Link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface AppMenuNavLinkProps {
  href: Route;
  label: string;
  icon: ReactNode;
  className?: string;
}

// The only part of AppMenu that needs to be a Client Component: knowing the
// current route to highlight the active link requires usePathname().
export const AppMenuNavLink = ({
  href,
  label,
  icon,
  className,
}: AppMenuNavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cx(
        'd-is-drawer-close:d-tooltip d-is-drawer-close:d-tooltip-right whitespace-nowrap',
        isActive && 'd-menu-active',
        className,
      )}
      data-tip={label}
    >
      {icon}
      <span className="d-is-drawer-close:hidden">{label}</span>
    </Link>
  );
};
