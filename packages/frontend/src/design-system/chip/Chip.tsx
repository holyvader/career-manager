import type { ReactNode } from 'react';
import { cx } from '@ds/utils/cx';

export type ChipVariant = 'neutral' | 'info' | 'success' | 'error' | 'warning';

export interface ChipProps {
  variant?: ChipVariant;
  children: ReactNode;
  className?: string;
}

export const chipVariantClasses: Record<ChipVariant, string> = {
  neutral: 'd-badge-neutral',
  info: 'd-badge-info',
  success: 'd-badge-success',
  error: 'd-badge-error',
  warning: 'd-badge-warning',
};

export function Chip({ variant = 'neutral', className, children }: ChipProps) {
  return (
    <span className={cx('d-badge', chipVariantClasses[variant], className ?? '')}>
      {children}
    </span>
  );
}
