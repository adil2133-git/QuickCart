import type { FocusEvent } from "react";

// Shared focus/blur border-highlight behavior for plain (non-Tailwind-only)
// input styling used across the auth pages.
export function useInputFocusStyle() {
  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#C9A97A";
    e.target.style.boxShadow = "0 0 0 2px #C9A97A33";
  };
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#D6C5B0";
    e.target.style.boxShadow = "none";
  };
  return { handleFocus, handleBlur };
}