// A few backend routes still return a bare string (e.g. 'Bad req') instead
// of `{ message }` on error - handle both shapes rather than assuming one.
export function edenErrorMessage(
  errorValue: unknown,
  fallback: string,
): string {
  if (typeof errorValue === 'string') {
    return errorValue;
  }
  if (
    errorValue &&
    typeof errorValue === 'object' &&
    'message' in errorValue &&
    typeof errorValue.message === 'string'
  ) {
    return errorValue.message;
  }
  return fallback;
}
