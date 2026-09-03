import type { Route } from 'next';
import NextLink from 'next/link';
import type { ComponentProps } from 'react';
import {
  type ButtonSize,
  type ButtonVariant,
  buttonClassNames,
} from '@ds/button/Button';

export interface LinkProps<T extends string = string>
  extends Omit<ComponentProps<typeof NextLink>, 'href'> {
  href: Route<T>;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Link<T extends string>({
  href,
  variant,
  size,
  className,
  ...props
}: LinkProps<T>) {
  return (
    <NextLink
      href={href}
      className={variant ? buttonClassNames({ variant, size, className }) : className}
      {...props}
    />
  );
}
