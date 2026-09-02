import { themeHtmlProps } from '@ds';
import type { Metadata } from 'next';
import '@ds/theme/css/globals.css';

export const metadata: Metadata = {
  title: 'Career Manager',
  description:
    'Your partner in career management, helping you track your job applications and interviews with ease.',
  keywords: [
    'career',
    'job applications',
    'interviews',
    'career management',
    'job search',
    'career tracking',
  ],
  authors: [{ name: 'Bartlomiej Turek', url: 'https://bturek.pl' }],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" {...themeHtmlProps}>
      <body className="min-h-full flex flex-col bg-mint-cream-950 text-celadon-100">
        {children}
      </body>
    </html>
  );
}
