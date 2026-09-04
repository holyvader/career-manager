import { cx } from '@ds/utils/cx';

export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg';

export interface LoaderProps {
  size?: LoaderSize;
  className?: string;
  label?: string;
}

const loaderSizeClasses: Record<LoaderSize, string> = {
  xs: 'd-loading-xs',
  sm: 'd-loading-sm',
  md: 'd-loading-md',
  lg: 'd-loading-lg',
};

export function Loader({ size, className, label = 'Loading' }: LoaderProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cx(
        'd-loading d-loading-spinner',
        size ? loaderSizeClasses[size] : '',
        className ?? '',
      )}
    />
  );
}
