"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deprecate = deprecate;

/**
 * Display a deprecation warning with the provided message if the
 * provided `test` evaluates to a falsy value (or is missing).
 */
function deprecate(message, test) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlcHJlY2F0ZS5qcyJdLCJuYW1lcyI6WyJ0ZXN0IiwiY29uc29sZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7O0FBSU8sU0FBQSxTQUFBLENBQUEsT0FBQSxFQUFBLElBQUEsRUFBa0M7QUFDdkMsTUFBSSxPQUFBLElBQUEsS0FBSixVQUFBLEVBQWdDO0FBQzlCLFFBQUlBLElBQUosRUFBQSxFQUFZO0FBQ1Y7QUFDRDtBQUhILEdBQUEsTUFJTztBQUNMLFFBQUEsSUFBQSxFQUFVO0FBQ1I7QUFDRDtBQUNGOztBQUVEQyxFQUFBQSxPQUFPLENBQVBBLElBQUFBLENBQUFBLE9BQUFBO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIERpc3BsYXkgYSBkZXByZWNhdGlvbiB3YXJuaW5nIHdpdGggdGhlIHByb3ZpZGVkIG1lc3NhZ2UgaWYgdGhlXG4gKiBwcm92aWRlZCBgdGVzdGAgZXZhbHVhdGVzIHRvIGEgZmFsc3kgdmFsdWUgKG9yIGlzIG1pc3NpbmcpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVwcmVjYXRlKG1lc3NhZ2UsIHRlc3QpIHtcbiAgaWYgKHR5cGVvZiB0ZXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKHRlc3QoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAodGVzdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbn0iXX0=