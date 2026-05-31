"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxImage = { src: string; alt?: string };

type Ctx = {
  open: (images: LightboxImage[], startIndex?: number) => void;
};

const LightboxContext = createContext<Ctx | null>(null);

export function useImageLightbox(): Ctx {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error("useImageLightbox must be used inside <ImageLightboxProvider>");
  return ctx;
}

export function ImageLightboxProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<LightboxImage[] | null>(null);
  const [index, setIndex] = useState(0);

  const open = useCallback((imgs: LightboxImage[], startIndex = 0) => {
    if (!imgs.length) return;
    setImages(imgs);
    setIndex(Math.min(Math.max(startIndex, 0), imgs.length - 1));
  }, []);

  const close = useCallback(() => setImages(null), []);

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
      {images && (
        <Lightbox
          images={images}
          index={index}
          setIndex={setIndex}
          onClose={close}
        />
      )}
    </LightboxContext.Provider>
  );
}

function Lightbox({
  images,
  index,
  setIndex,
  onClose,
}: {
  images: LightboxImage[];
  index: number;
  setIndex: (n: number) => void;
  onClose: () => void;
}) {
  const total = images.length;
  const hasMany = total > 1;
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goPrev = useCallback(() => setIndex((index - 1 + total) % total), [index, total, setIndex]);
  const goNext = useCallback(() => setIndex((index + 1) % total), [index, total, setIndex]);

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasMany) goPrev();
      else if (e.key === "ArrowRight" && hasMany) goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext, hasMany]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absY > 80 && absY > absX) {
      onClose();
      return;
    }
    if (hasMany && absX > 60 && absX > absY) {
      if (dx > 0) goPrev();
      else goNext();
    }
  }

  const current = images[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm anim-fade-in"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-stone-100 backdrop-blur-md transition hover:bg-white/20"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <X size={20} />
      </button>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous image"
            className="absolute left-2 sm:left-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-stone-100 backdrop-blur-md transition hover:bg-white/20"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next image"
            className="absolute right-2 sm:right-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-stone-100 backdrop-blur-md transition hover:bg-white/20"
          >
            <ChevronRight size={22} />
          </button>
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/10 px-3 py-1 text-xs text-stone-200 backdrop-blur-md"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
          >
            {index + 1} / {total}
          </div>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current.src}
        src={current.src}
        alt={current.alt ?? ""}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-[94vw] object-contain anim-scale-in select-none"
        draggable={false}
      />
    </div>
  );
}
