import type { FocusEvent } from "react";

type FocusTheme = "gold" | "muted";

const THEMES: Record<FocusTheme, { focus: string; shadow: string; blur: string }> = {
  gold:  { focus: "#145C43", shadow: "0 0 0 2px rgba(20,92,67,0.18)", blur: "#E3E7E1" },
  muted: { focus: "#145C43", shadow: "0 0 0 2px rgba(20,92,67,0.18)", blur: "#E3E7E1" },
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