import type { FC, ReactNode } from 'react';

interface ButtonProps {
  children?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
}
export const Button: FC<ButtonProps> = ({ type = 'button', children }) => {
  return (
    <button type={type} className="d-btn d-btn-primary">
      {children}
    </button>
  );
};
