/**
 * Base exception class.
 */
export declare class Exception {
    message: string;
    error: Error;
    stack: string;
    constructor(message: string);
}
/**
 * Exception raised when an item does not exist in a log.
 */
export declare class NotLoggedException extends Exception {
    id: string;
    constructor(id: string);
}
/**
 * Exception raised when a value is outside an allowed range.
 */
export declare class OutOfRangeException extends Exception {
    value: number;
    constructor(value: number);
}
