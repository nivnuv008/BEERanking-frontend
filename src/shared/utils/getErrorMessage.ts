export function getErrorMessage(
  error: unknown,
  fallback = "Request failed",
): string {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  if (error instanceof Error) return error.message || fallback;

  if (typeof error === "object") {
    try {
      const obj = error as Record<string, unknown>;
      if (typeof obj.message === "string") return obj.message;
      if (typeof obj.error === "string") return obj.error;
      if (Array.isArray(obj.errors) && obj.errors.length > 0) {
        return obj.errors
          .map((e) => (typeof e === "string" ? e : JSON.stringify(e)))
          .join("; ");
      }
      return JSON.stringify(obj);
    } catch {
      return fallback;
    }
  }

  return String(error) || fallback;
}
