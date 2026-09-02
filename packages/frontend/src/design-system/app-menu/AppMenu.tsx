import type { ReactNode } from 'react';
import { AppMenuNavLink } from './AppMenuNavLink';

export interface AppMenuItem {
  label: string;
  href: string;
  icon: ReactNode;
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
        id="my-drawer-4"
        type="checkbox"
        className="d-drawer-toggle inline"
      />
      <div className="d-drawer-content">
        {/* Navbar */}
        <nav className="d-navbar w-full bg-base-100">
          <div className="px-4">{title}</div>
        </nav>
        {/* Page content here */}
        <div className="p-4">{children}</div>
      </div>

      <div className="d-drawer-side d-is-drawer-close:overflow-visible">
        <label
          htmlFor="my-drawer-4"
          aria-label="close sidebar"
          className="d-drawer-overlay"
        ></label>
        <div className="flex min-h-full flex-col items-start bg-base-200 d-is-drawer-close:w-14 d-is-drawer-open:w-64">
          {/* Sidebar content here */}
          <ul className="d-menu w-full grow">
            {items.map((item) => (
              <li key={item.href}>
                <AppMenuNavLink
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              </li>
            ))}

            <li>
              <form action={onLogout}>
                <button
                  type="submit"
                  className="d-is-drawer-close:d-tooltip d-is-drawer-close:d-tooltip-right"
                  data-tip="Log out"
                >
                  {/* Logout icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2"
                    fill="none"
                    stroke="currentColor"
                    className="my-1.5 inline-block size-4"
                    aria-hidden="true"
                  >
                    <path d="M9 12h12l-3 -3"></path>
                    <path d="M18 15l3 -3"></path>
                    <path d="M14 8v-1a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-1"></path>
                  </svg>
                  <span className="d-is-drawer-close:hidden">Log out</span>
                </button>
              </form>
            </li>

            <li>
              <label
                htmlFor="my-drawer-4"
                aria-label="open sidebar"
                className="d-btn d-btn-square d-btn-ghost d-drawer-button"
              >
                {/* Sidebar toggle icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="my-1.5 inline-block size-4"
                  aria-hidden="true"
                >
                  <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                  <path d="M9 4v16"></path>
                  <path d="M14 10l2 2l-2 2"></path>
                </svg>
              </label>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
