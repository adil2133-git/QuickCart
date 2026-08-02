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

// Words that indicate developer/internal technical jargon
const TECHNICAL_DEV_PATTERNS = [
  "refresh token",
  "access token",
  "jwt",
  "token expired",
  "invalid token",
  "malformed token",
  "request failed with status code",
  "unauthorized",
];

// Extracts and sanitizes human backend error messages to prevent dev jargon leaks
export function getApiErrorMessage(err: unknown, fallback: string = "Something went wrong. Please try again."): string {
  const apiErr = err as ApiErrorShape;
  const backendMessage = apiErr?.response?.data?.message;

  if (typeof backendMessage === "string" && backendMessage.trim().length > 0) {
    const lowerMsg = backendMessage.toLowerCase();
    // Block any technical developer jargon from reaching the user
    const isTechnical = TECHNICAL_DEV_PATTERNS.some((pattern) => lowerMsg.includes(pattern));
    
    if (!isTechnical) {
      return backendMessage;
    }
  }

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