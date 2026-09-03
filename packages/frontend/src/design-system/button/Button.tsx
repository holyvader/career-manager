import type { ComponentPropsWithoutRef } from 'react';
import { cx } from '@ds/utils/cx';

export type ButtonVariant = 'primary' | 'ghost' | 'plain' | 'none';
export type ButtonSize = 'sm' | 'lg';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  circle?: boolean;
}

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'd-btn-primary',
  ghost: 'd-btn-ghost',
  plain: '',
  none: '',
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'd-btn-sm',
  lg: 'd-btn-lg',
};

export function buttonClassNames({
  variant = 'primary',
  size,
  circle,
  className,
}: Pick<ButtonProps, 'variant' | 'size' | 'circle' | 'className'>): string {
  return cx(
    variant !== 'none' && 'd-btn',
    buttonVariantClasses[variant ?? 'primary'],
    size ? buttonSizeClasses[size] : '',
    circle ? 'd-btn-circle' : '',
    className ?? '',
  );
}

export function Button({
  type = 'button',
  variant,
  size,
  circle,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassNames({ variant, size, circle, className })}
      {...props}
    />
  );
}
