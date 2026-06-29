import type { FocusEvent } from "react";

type FocusTheme = "gold" | "muted";

const THEMES: Record<FocusTheme, { focus: string; shadow: string; blur: string }> = {
  gold:  { focus: "#C9A97A", shadow: "0 0 0 2px #C9A97A33",          blur: "#D6C5B0" },
  muted: { focus: "#c2a383", shadow: "0 0 0 2px rgba(194,163,131,0.2)", blur: "#d2c4b9" },
};

export function useInputFocusStyle(theme: FocusTheme = "gold") {
  const { focus, shadow, blur } = THEMES[theme];
  const handleFocus = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = focus;
    e.target.style.boxShadow = shadow;
  };
  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = blur;
    e.target.style.boxShadow = "none";
  };
  return { handleFocus, handleBlur };
}