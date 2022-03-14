/**
 * Throw an exception if `test` is not truthy.
 */
export function assert(description, test) {
  if (!test) {
    throw new Error('Assertion failed: ' + description);
  }
}