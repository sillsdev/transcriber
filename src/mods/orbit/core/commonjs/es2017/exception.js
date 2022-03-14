"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OutOfRangeException = exports.NotLoggedException = exports.Exception = void 0;

/**
 * Base exception class.
 */
class Exception {
  constructor(message) {
    this.message = message;
    this.error = new Error(this.message);
    this.stack = this.error.stack;
  }

}
/**
 * Exception raised when an item does not exist in a log.
 */


exports.Exception = Exception;

class NotLoggedException extends Exception {
  constructor(id) {
    super(`Action not logged: ${id}`);
    this.id = id;
  }

}
/**
 * Exception raised when a value is outside an allowed range.
 */


exports.NotLoggedException = NotLoggedException;

class OutOfRangeException extends Exception {
  constructor(value) {
    super(`Out of range: ${value}`);
    this.value = value;
  }

}

exports.OutOfRangeException = OutOfRangeException;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV4Y2VwdGlvbi5qcyJdLCJuYW1lcyI6WyJFeGNlcHRpb24iLCJjb25zdHJ1Y3RvciIsIm1lc3NhZ2UiLCJlcnJvciIsIkVycm9yIiwic3RhY2siLCJOb3RMb2dnZWRFeGNlcHRpb24iLCJpZCIsIk91dE9mUmFuZ2VFeGNlcHRpb24iLCJ2YWx1ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7QUFHTyxNQUFNQSxTQUFOLENBQWdCO0FBQ3JCQyxFQUFBQSxXQUFXLENBQUNDLE9BQUQsRUFBVTtBQUNuQixTQUFLQSxPQUFMLEdBQWVBLE9BQWY7QUFDQSxTQUFLQyxLQUFMLEdBQWEsSUFBSUMsS0FBSixDQUFVLEtBQUtGLE9BQWYsQ0FBYjtBQUNBLFNBQUtHLEtBQUwsR0FBYSxLQUFLRixLQUFMLENBQVdFLEtBQXhCO0FBQ0Q7O0FBTG9CO0FBUXZCOzs7Ozs7O0FBSU8sTUFBTUMsa0JBQU4sU0FBaUNOLFNBQWpDLENBQTJDO0FBQ2hEQyxFQUFBQSxXQUFXLENBQUNNLEVBQUQsRUFBSztBQUNkLFVBQU8sc0JBQXFCQSxFQUFHLEVBQS9CO0FBQ0EsU0FBS0EsRUFBTCxHQUFVQSxFQUFWO0FBQ0Q7O0FBSitDO0FBT2xEOzs7Ozs7O0FBSU8sTUFBTUMsbUJBQU4sU0FBa0NSLFNBQWxDLENBQTRDO0FBQ2pEQyxFQUFBQSxXQUFXLENBQUNRLEtBQUQsRUFBUTtBQUNqQixVQUFPLGlCQUFnQkEsS0FBTSxFQUE3QjtBQUNBLFNBQUtBLEtBQUwsR0FBYUEsS0FBYjtBQUNEOztBQUpnRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQmFzZSBleGNlcHRpb24gY2xhc3MuXG4gKi9cbmV4cG9ydCBjbGFzcyBFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB0aGlzLmVycm9yID0gbmV3IEVycm9yKHRoaXMubWVzc2FnZSk7XG4gICAgdGhpcy5zdGFjayA9IHRoaXMuZXJyb3Iuc3RhY2s7XG4gIH1cblxufVxuLyoqXG4gKiBFeGNlcHRpb24gcmFpc2VkIHdoZW4gYW4gaXRlbSBkb2VzIG5vdCBleGlzdCBpbiBhIGxvZy5cbiAqL1xuXG5leHBvcnQgY2xhc3MgTm90TG9nZ2VkRXhjZXB0aW9uIGV4dGVuZHMgRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoaWQpIHtcbiAgICBzdXBlcihgQWN0aW9uIG5vdCBsb2dnZWQ6ICR7aWR9YCk7XG4gICAgdGhpcy5pZCA9IGlkO1xuICB9XG5cbn1cbi8qKlxuICogRXhjZXB0aW9uIHJhaXNlZCB3aGVuIGEgdmFsdWUgaXMgb3V0c2lkZSBhbiBhbGxvd2VkIHJhbmdlLlxuICovXG5cbmV4cG9ydCBjbGFzcyBPdXRPZlJhbmdlRXhjZXB0aW9uIGV4dGVuZHMgRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IodmFsdWUpIHtcbiAgICBzdXBlcihgT3V0IG9mIHJhbmdlOiAke3ZhbHVlfWApO1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG59Il19