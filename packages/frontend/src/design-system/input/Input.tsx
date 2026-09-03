import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from '@ds/utils/cx';

export type InputKind = 'text' | 'email' | 'password' | 'url' | 'checkbox';

export interface InputProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'size' | 'type'> {
  type?: InputKind;
  label?: ReactNode;
  size?: 'sm';
}

const inputBaseClasses: Record<InputKind, string> = {
  text: 'd-input',
  email: 'd-input',
  password: 'd-input',
  url: 'd-input',
  checkbox: 'd-checkbox',
};

const inputSizeClasses: Record<InputKind, string> = {
  text: 'd-input-sm',
  email: 'd-input-sm',
  password: 'd-input-sm',
  url: 'd-input-sm',
  checkbox: 'd-checkbox-xs',
};

export function Input({ type = 'text', label, size, className, ...props }: InputProps) {
  const field = (
    <input
      type={type}
      className={cx(inputBaseClasses[type], size ? inputSizeClasses[type] : '', className ?? '')}
      {...props}
    />
  );

  if (!label) {
    return field;
  }

  return (
    <label className="d-fieldset-label flex flex-col items-start gap-1">
      {label}
      {field}
    </label>
  );
}
