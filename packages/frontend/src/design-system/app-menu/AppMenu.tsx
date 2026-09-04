import { Button, buttonClassNames } from '@ds/button/Button';
import { ChevronLeftIcon, ChevronRightIcon, PowerIcon } from '@ds/icon';
import { Link } from '@ds/link/Link';
import type { Route } from 'next';
import Image from 'next/image';
import { type ReactNode, Suspense } from 'react';
import { AppMenuNavLink } from './AppMenuNavLink';

export interface AppMenuItem {
  label: string;
  href: Route;
  icon: ReactNode;
  className?: string;
}

interface AppMenuProps {
  title: ReactNode;
  items: AppMenuItem[];
  onLogout: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}

export const AppMenu = ({ title, items, onLogout, children }: AppMenuProps) => {
  return (
    <div className="d-drawer lg:d-drawer-open">
      <input
        id="app-menu-drawer"
        type="checkbox"
        className="d-drawer-toggle inline"
        defaultChecked
      />
      <div className="d-drawer-content">
        {/* Navbar */}
        <nav className="d-navbar bg-base-200 text-primary-content w-full">
          <div className="flex-1">
            <label
              htmlFor="app-menu-drawer"
              aria-label="open sidebar"
              className={buttonClassNames({
                variant: 'ghost',
                color: 'secondary',
                className: 'd-drawer-button lg:hidden',
              })}
            >
              {/* Sidebar toggle icon */}
              <ChevronRightIcon className="my-1.5 size-4" />
              <ChevronLeftIcon className="my-1.5 size-4" />
            </label>
            <Link variant="link" className="pl-0" href="/app">
              <Image
                src="/cventually-logo.svg"
                alt="Cventually"
                width={145}
                height={40}
                loading="eager"
              />
            </Link>
          </div>
          <div className="flex-none">
            <form action={onLogout}>
              <ul className="d-menu d-menu-horizontal px-1">
                <li>
                  <Link variant="contained" href="/app/profile">
                    Profile
                  </Link>
                </li>
                <li>
                  <Button
                    type="submit"
                    className="ml-2"
                    variant="ghost"
                    data-tip="Log out"
                    leftIcon={<PowerIcon />}
                  />
                </li>
              </ul>
            </form>
          </div>
        </nav>
        {/* Page content here */}
        <div className="p-4">{children}</div>
      </div>

      <div className="d-drawer-side d-is-drawer-close:overflow-visible">
        <label
          htmlFor="app-menu-drawer"
          aria-label="close sidebar"
          className="d-drawer-overlay"
        ></label>
        <div className="flex min-h-full flex-col items-start bg-base-200 d-is-drawer-close:w-14 d-is-drawer-open:w-64">
          {/* Sidebar content here */}
          <span className="lg:mb-1 lg:mt-5 ml-2 max-lg:hidden">
            <label
              htmlFor="app-menu-drawer"
              aria-label="open sidebar"
              className={buttonClassNames({
                variant: 'ghost',
                className: 'px-3',
              })}
            >
              {/* Sidebar toggle icon */}
              <ChevronRightIcon className="my-1.5 size-4 d-is-drawer-open:hidden" />
              <ChevronLeftIcon className="my-1.5 size-4 d-is-drawer-close:hidden" />
            </label>
          </span>
          <ul className="d-menu w-full grow">
            <Suspense fallback={null}>
              {items.map((item) => (
                <li key={item.href}>
                  <AppMenuNavLink {...item} />
                </li>
              ))}
            </Suspense>
          </ul>
        </div>
      </div>
    </div>
  );
};
