/**
 * Base exception class.
 */
export class Exception {
  constructor(message) {
    this.message = message;
    this.error = new Error(this.message);
    this.stack = this.error.stack;
  }

}
/**
 * Exception raised when an item does not exist in a log.
 */

export class NotLoggedException extends Exception {
  constructor(id) {
    super(`Action not logged: ${id}`);
    this.id = id;
  }

}
/**
 * Exception raised when a value is outside an allowed range.
 */

export class OutOfRangeException extends Exception {
  constructor(value) {
    super(`Out of range: ${value}`);
    this.value = value;
  }

}