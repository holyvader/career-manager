import { AppMenu } from '@ds';

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <AppMenu title={<h1 className="text-xl font-bold">Career Manager</h1>}>
      {children}
    </AppMenu>
  );
}
