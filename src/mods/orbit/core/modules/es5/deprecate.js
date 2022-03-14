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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlcHJlY2F0ZS5qcyJdLCJuYW1lcyI6WyJkZXByZWNhdGUiLCJtZXNzYWdlIiwidGVzdCIsImNvbnNvbGUiLCJ3YXJuIl0sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLE9BQU8sU0FBU0EsU0FBVCxDQUFtQkMsT0FBbkIsRUFBNEJDLElBQTVCLEVBQWtDO0FBQ3ZDLE1BQUksT0FBT0EsSUFBUCxLQUFnQixVQUFwQixFQUFnQztBQUM5QixRQUFJQSxJQUFJLEVBQVIsRUFBWTtBQUNWO0FBQ0Q7QUFDRixHQUpELE1BSU87QUFDTCxRQUFJQSxJQUFKLEVBQVU7QUFDUjtBQUNEO0FBQ0Y7O0FBRURDLEVBQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhSCxPQUFiO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIERpc3BsYXkgYSBkZXByZWNhdGlvbiB3YXJuaW5nIHdpdGggdGhlIHByb3ZpZGVkIG1lc3NhZ2UgaWYgdGhlXG4gKiBwcm92aWRlZCBgdGVzdGAgZXZhbHVhdGVzIHRvIGEgZmFsc3kgdmFsdWUgKG9yIGlzIG1pc3NpbmcpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVwcmVjYXRlKG1lc3NhZ2UsIHRlc3QpIHtcbiAgaWYgKHR5cGVvZiB0ZXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKHRlc3QoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAodGVzdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbn0iXX0=