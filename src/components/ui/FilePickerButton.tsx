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
 * The reliable HTML pattern: <label> wraps <input type="file">. Tapping
 * anywhere on the label activates the input — no JS, no .click(), no
 * z-index tricks. Works on every browser, every OS, every PWA mode.
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
    <label
      className={`select-none ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"} ${className}`}
      style={style}
    >
      {children}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
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
    </label>
  );
}
