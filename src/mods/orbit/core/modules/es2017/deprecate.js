/**
 * Display a deprecation warning with the provided message if the
 * provided `test` evaluates to a falsy value (or is missing).
 */
export function deprecate(message, test) {
  if (typeof test === 'function') {
    if (test()) {
      return;
    }
  } else {
    if (test) {
      return;
    }
  }

  console.warn(message);
}