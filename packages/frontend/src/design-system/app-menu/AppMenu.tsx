import Link from 'next/link';
import type { ReactNode } from 'react';

interface AppMenuProps {
  title: ReactNode;
  children: ReactNode;
}
export const AppMenu = ({ title, children }: AppMenuProps) => {
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
            >
              <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
              <path d="M9 4v16"></path>
              <path d="M14 10l2 2l-2 2"></path>
            </svg>
          </label>
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
            {/* List item */}
            <li>
              <Link
                className="d-is-drawer-close:d-tooltip d-is-drawer-close:d-tooltip-right"
                data-tip="Homepage"
                href="/"
              >
                {/* Home icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="my-1.5 inline-block size-4"
                >
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                <span className="d-is-drawer-close:hidden">Homepage</span>
              </Link>
            </li>

            {/* List item */}
            <li>
              <button
                className="d-is-drawer-close:d-tooltip d-is-drawer-close:d-tooltip-right"
                data-tip="Settings"
              >
                {/* Settings icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="my-1.5 inline-block size-4"
                >
                  <path d="M20 7h-9"></path>
                  <path d="M14 17H5"></path>
                  <circle cx="17" cy="17" r="3"></circle>
                  <circle cx="7" cy="7" r="3"></circle>
                </svg>
                <span className="d-is-drawer-close:hidden">Settings</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
