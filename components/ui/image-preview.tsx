"use client";

import { useEffect, useId, useRef, useState } from "react";

export function ImagePreview({
  src,
  alt,
  className = "",
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }

    if (!wasOpen.current) {
      return;
    }

    wasOpen.current = false;
    triggerRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`View ${alt}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className={className}
      >
        {children ?? (
          // eslint-disable-next-line @next/next/no-img-element -- preview uses the existing public image URL
          <img src={src} alt={alt} className="h-full w-full object-contain" />
        )}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#120818]/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-h-[90vh] max-w-[min(100%,56rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="sr-only">
              {alt}
            </h2>
            <button
              ref={closeRef}
              type="button"
              aria-label="Close image preview"
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white text-lg text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- preview uses the existing public image URL */}
            <img
              src={src}
              alt={alt}
              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
