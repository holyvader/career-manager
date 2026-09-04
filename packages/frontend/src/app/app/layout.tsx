import { AppMenu, type AppMenuItem, HomeIcon, PlusIcon } from '@ds';
import type { ReactNode } from 'react';
import { logout } from '@/lib/actions';

const items: AppMenuItem[] = [
  {
    label: 'Job Offers',
    href: '/app',
    icon: <HomeIcon className="my-1.5 inline-block size-4" />,
  },
  {
    label: 'Add Job Offer',
    href: '/app/offer/new',
    className: 'mt-8',
    icon: <PlusIcon className="my-1.5 inline-block size-4" />,
  },
];

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppMenu title="CVentually" items={items} onLogout={logout}>
      {children}
    </AppMenu>
  );
}
