/**
 * Display a deprecation warning with the provided message if the
 * provided `test` evaluates to a falsy value (or is missing).
 */
export declare function deprecate(message: string, test?: boolean | (() => boolean)): void;
