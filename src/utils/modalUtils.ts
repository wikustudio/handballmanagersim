import { useEffect, useRef } from 'react';

// Reference-counted body scroll lock so multiple stacked modals do not prematurely release the lock
let activeModalCount = 0;

export function resetModalScrollLock() {
  activeModalCount = 0;
  dismissStack.length = 0;
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.overflow = '';
  }
}

export function useModalScrollLock(isOpen: boolean = true) {
  useEffect(() => {
    if (!isOpen) {
      if (activeModalCount === 0 && document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
      }
      return;
    }

    activeModalCount++;
    if (activeModalCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);
      if (activeModalCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);
}

const dismissStack: Array<() => void> = [];

export function useModalDismiss(onClose?: () => void, isOpen: boolean = true) {
  useModalScrollLock(isOpen);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const hasOnClose = Boolean(onClose);

  useEffect(() => {
    if (!isOpen || !hasOnClose) return;

    const entry = () => {
      onCloseRef.current?.();
    };
    dismissStack.push(entry);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (dismissStack[dismissStack.length - 1] === entry) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          entry();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      const idx = dismissStack.lastIndexOf(entry);
      if (idx !== -1) {
        dismissStack.splice(idx, 1);
      }
    };
  }, [isOpen, hasOnClose]);
}

