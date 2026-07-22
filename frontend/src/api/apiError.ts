// Shared shape for extracting a user-facing message out of an axios error.
// Every API call in the app was hand-rolling this same cast + optional-chain
// (`(err as any)?.response?.data?.message ?? fallback`) — this is the one
// place it's defined now.
type ApiErrorShape = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      [key: string]: unknown;
    };
  };
  message?: string;
};

// Extracts a backend-provided error message, falling back to a caller-
// supplied default. Safe to call on anything caught in a try/catch (err is
// `unknown` there), since it never assumes the shape actually matches.
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const apiErr = err as ApiErrorShape;
  return apiErr?.response?.data?.message ?? fallback;
}

// Same extraction, but also hands back the full response.data object for
// call sites that need another field off it too (e.g. useCheckout's
// paymentCapturedButOrderFailed flag) instead of just the message.
export function getApiErrorData(err: unknown): Record<string, unknown> | undefined {
  const apiErr = err as ApiErrorShape;
  return apiErr?.response?.data;
}

// HTTP status code off a caught error, when call sites need to branch on it
// (e.g. skip toasting on 401s, which the axios interceptor already handles).
export function getApiErrorStatus(err: unknown): number | undefined {
  const apiErr = err as ApiErrorShape;
  return apiErr?.response?.status;
}