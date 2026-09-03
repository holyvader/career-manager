'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { Button } from '@ds/button/Button';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

// A plain client-side modal - opened/closed purely via the parent's own
// state, no routing involved. Closing (Escape, backdrop click, or the
// explicit button) all funnel through the native <dialog> `onClose` event,
// which fires `onClose` uniformly regardless of which of those triggered it.
export function Modal({ children, onClose }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className="d-modal" onClose={onClose}>
      <div className="d-modal-box">
        <form method="dialog">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            circle
            aria-label="Close"
            className="absolute top-2 right-2"
          >
            ✕
          </Button>
        </form>
        {children}
      </div>
      <form method="dialog" className="d-modal-backdrop">
        <Button type="submit" variant="none">
          close
        </Button>
      </form>
    </dialog>
  );
}
