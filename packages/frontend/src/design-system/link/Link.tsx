import {
  type ButtonColor,
  type ButtonSize,
  type ButtonVariant,
  buttonClassNames,
} from '@ds/button/Button';
import type { Route } from 'next';
import NextLink from 'next/link';
import type { ComponentProps } from 'react';

export interface LinkProps<T extends string = string>
  extends Omit<ComponentProps<typeof NextLink>, 'href'> {
  href: Route<T>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
}

export function Link<T extends string>({
  href,
  variant,
  size,
  color,
  className,
  ...props
}: LinkProps<T>) {
  return (
    <NextLink
      href={href}
      className={
        variant
          ? buttonClassNames({ variant, size, color, className })
          : className
      }
      {...props}
    />
  );
}
