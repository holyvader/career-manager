import { cx } from '@ds/utils/cx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  circle?: boolean;
  active?: boolean;
  disabled?: boolean;
  block?: boolean;
  wide?: boolean;
}

export const buttonSizeClasses = {
  xs: 'd-btn-xs',
  sm: 'd-btn-sm',
  md: '',
  lg: 'd-btn-lg',
  xl: 'd-btn-xl',
};

export const buttonVariantClasses = {
  outline: 'd-btn-outline',
  ghost: 'd-btn-ghost',
  link: 'd-btn-link',
  contained: '',
};
export const buttonColorClasses = {
  primary: 'd-btn-primary',
  secondary: 'd-btn-secondary',
};

export type ButtonVariant = keyof typeof buttonVariantClasses;
export type ButtonSize = keyof typeof buttonSizeClasses;
export type ButtonColor = keyof typeof buttonColorClasses;

export function buttonClassNames({
  variant,
  size,
  color,
  circle,
  className,
  active,
  wide,
  block,
}: Pick<
  ButtonProps,
  | 'variant'
  | 'size'
  | 'circle'
  | 'className'
  | 'active'
  | 'color'
  | 'wide'
  | 'block'
>): string {
  return cx(
    'd-btn cursor-pointer',
    variant && buttonVariantClasses[variant],
    color && buttonColorClasses[color],
    size && buttonSizeClasses[size],
    wide && 'd-btn-wide',
    block && 'd-btn-block',
    circle && 'd-btn-circle',
    active && 'd-btn-active',
    className,
  );
}

export function Button({
  type = 'button',
  variant,
  size,
  circle,
  className,
  active,
  children,
  leftIcon,
  rightIcon,
  color,
  wide,
  block,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassNames({
        variant,
        size,
        circle,
        className,
        active,
        color,
        wide,
        block,
      })}
      {...props}
    >
      {leftIcon && (
        <span className={cx('inline-block size-4', !!children && 'mr-1.5')}>
          {leftIcon}
        </span>
      )}
      {circle ? (
        <span className="inline-block size-4">{children}</span>
      ) : (
        children
      )}
      {rightIcon && (
        <span className={cx('inline-block size-4', !!children && 'ml-1.5')}>
          {rightIcon}
        </span>
      )}
    </button>
  );
}
