import { Raleway } from 'next/font/google';

const raleway = Raleway({
  variable: '--font-primary',
  subsets: ['latin'],
});

export const themeHtmlProps = {
  className: `${raleway.variable} h-full antialiased`,
};
