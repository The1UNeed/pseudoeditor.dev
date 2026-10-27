"use client";

import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type DialogProps = {
  labelledBy: string;
  onClose: () => void;
  className?: string;
  /** Where focus goes on close when the element that opened the dialog is gone (a closed menu, for example). */
  returnFocusTo?: () => HTMLElement | null;
  children: ReactNode;
};

/**
 * Modal built on the native <dialog> element, so focus is trapped and the rest of the page is inert.
 * Escape and backdrop clicks call onClose; the parent owns the open state by mounting or unmounting this.
 * The element marked `data-autofocus` (else the first focusable one) receives focus, and focus returns to the
 * opener (or returnFocusTo) on close.
 */
export function Dialog({ labelledBy, onClose, className = "", returnFocusTo, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const returnFocusToRef = useRef(returnFocusTo);

  useEffect(() => {
    onCloseRef.current = onClose;
    returnFocusToRef.current = returnFocusTo;
  }, [onClose, returnFocusTo]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    // Same order as native showModal(): an explicit autofocus target, else the first focusable element.
    const initialFocus =
      dialog.querySelector<HTMLElement>("[data-autofocus]") ?? dialog.querySelector<HTMLElement>(FOCUSABLE) ?? dialog;
    initialFocus.focus();

    return () => {
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      const target = opener?.isConnected && opener !== document.body ? opener : returnFocusToRef.current?.();
      target?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        onCloseRef.current();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
      className={`m-auto max-h-[calc(100%-2rem)] outline-none backdrop:bg-[var(--overlay)] ${className}`}
    >
      {children}
    </dialog>
  );
}
