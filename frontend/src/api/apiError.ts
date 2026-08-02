type ApiErrorShape = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      title?: string;
      [key: string]: unknown;
    };
  };
  message?: string;
};

// Patterns that indicate internal developer/technical jargon
const TECHNICAL_DEV_PATTERNS = [
  "refresh token",
  "access token",
  "jwt",
  "token expired",
  "invalid token",
  "malformed token",
  "request failed with status code",
  "unauthorized",
  "network error",
  "econnrefused",
  "mongodb",
  "mongoose",
  "cast to objectid",
  "validationerror",
  "syntaxerror",
  "typeerror",
  "referenceerror",
  "internal server error",
  "status code 500",
  "status code 404",
  "status code 401",
  "status code 403",
  "status code 400",
  "status code 409",
  "status code 429",
];

/**
 * Global Error Sanitizer for QuickCart
 * - Logs raw technical error details to browser console for developer debugging.
 * - Guarantees zero dev jargon, status codes, or token strings leak to UI banners/toasts.
 */
export function getApiErrorMessage(err: unknown, fallback: string = "Something went wrong. Please try again."): string {
  // Always log raw error to console for developer diagnostics
  if (import.meta.env.DEV || import.meta.env.MODE === "development") {
    console.error("[QuickKart Debug Error]:", err);
  }

  const apiErr = err as ApiErrorShape;
  const backendMessage = apiErr?.response?.data?.message;

  if (typeof backendMessage === "string" && backendMessage.trim().length > 0) {
    const lowerMsg = backendMessage.toLowerCase();
    const isTechnical = TECHNICAL_DEV_PATTERNS.some((pattern) => lowerMsg.includes(pattern));
    
    if (!isTechnical) {
      return backendMessage;
    }
  }

  // Fall back to clean human-friendly copy for UI display
  return fallback;
}

export function getApiErrorTitle(err: unknown): string | undefined {
  const apiErr = err as ApiErrorShape;
  const title = apiErr?.response?.data?.title;
  if (typeof title === "string" && title.trim().length > 0) {
    const lowerTitle = title.toLowerCase();
    if (!TECHNICAL_DEV_PATTERNS.some((pattern) => lowerTitle.includes(pattern))) {
      return title;
    }
  }
  return undefined;
}

export function getApiErrorData(err: unknown): Record<string, unknown> | undefined {
  const apiErr = err as ApiErrorShape;
  return apiErr?.response?.data;
}

export function getApiErrorStatus(err: unknown): number | undefined {
  const apiErr = err as ApiErrorShape;
  return apiErr?.response?.status;
}