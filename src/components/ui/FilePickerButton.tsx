"use client";
import { CSSProperties, ReactNode } from "react";

interface Props {
  onPick: (file: File) => void;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * A file picker that's bulletproof on mobile: the <input> is positioned
 * on top of the visible content with opacity 0, so the user's tap lands
 * directly on the input. No .click() calls, no <label htmlFor>, no
 * synthetic events — the browser opens the picker because the user
 * actually tapped the input.
 */
export function FilePickerButton({
  onPick,
  disabled,
  multiple,
  accept = "image/*",
  className = "",
  style,
  children,
}: Props) {
  return (
    <div className={`relative ${disabled ? "opacity-50" : ""} ${className}`} style={style}>
      <span className="pointer-events-none relative z-0 inline-flex items-center justify-center gap-2 w-full">
        {children}
      </span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (multiple) {
            files.forEach(onPick);
          } else if (files[0]) {
            onPick(files[0]);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}
