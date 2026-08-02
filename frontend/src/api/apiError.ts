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

/**
 * Extracts a human-friendly backend error message.
 * Sanitizes technical Axios messages ("Request failed with status code 401", "Network Error")
 * to ensure zero raw HTTP codes or dev-speak ever leak into the UI.
 */
export function getApiErrorMessage(err: unknown, fallback: string = "Something went wrong. Please try again."): string {
  const apiErr = err as ApiErrorShape;
  const backendMessage = apiErr?.response?.data?.message;

  if (typeof backendMessage === "string" && backendMessage.trim().length > 0) {
    // Ensure no raw HTTP status code messages leak
    if (!backendMessage.toLowerCase().startsWith("request failed with status code")) {
      return backendMessage;
    }
  }

  return fallback;
}

export function getApiErrorTitle(err: unknown): string | undefined {
  const apiErr = err as ApiErrorShape;
  return apiErr?.response?.data?.title;
}

export function getApiErrorData(err: unknown): Record<string, unknown> | undefined {
  const apiErr = err as ApiErrorShape;
  return apiErr?.response?.data;
}

export function getApiErrorStatus(err: unknown): number | undefined {
  const apiErr = err as ApiErrorShape;
  return apiErr?.response?.status;
}