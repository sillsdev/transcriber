"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assert = assert;

/**
 * Throw an exception if `test` is not truthy.
 */
function assert(description, test) {
  if (!test) {
    throw new Error('Assertion failed: ' + description);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2VydC5qcyJdLCJuYW1lcyI6WyJhc3NlcnQiLCJkZXNjcmlwdGlvbiIsInRlc3QiLCJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7QUFHTyxTQUFTQSxNQUFULENBQWdCQyxXQUFoQixFQUE2QkMsSUFBN0IsRUFBbUM7QUFDeEMsTUFBSSxDQUFDQSxJQUFMLEVBQVc7QUFDVCxVQUFNLElBQUlDLEtBQUosQ0FBVSx1QkFBdUJGLFdBQWpDLENBQU47QUFDRDtBQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUaHJvdyBhbiBleGNlcHRpb24gaWYgYHRlc3RgIGlzIG5vdCB0cnV0aHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnQoZGVzY3JpcHRpb24sIHRlc3QpIHtcbiAgaWYgKCF0ZXN0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBc3NlcnRpb24gZmFpbGVkOiAnICsgZGVzY3JpcHRpb24pO1xuICB9XG59Il19