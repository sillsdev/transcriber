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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlcHJlY2F0ZS5qcyJdLCJuYW1lcyI6WyJkZXByZWNhdGUiLCJtZXNzYWdlIiwidGVzdCIsImNvbnNvbGUiLCJ3YXJuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7QUFJTyxTQUFTQSxTQUFULENBQW1CQyxPQUFuQixFQUE0QkMsSUFBNUIsRUFBa0M7QUFDdkMsTUFBSSxPQUFPQSxJQUFQLEtBQWdCLFVBQXBCLEVBQWdDO0FBQzlCLFFBQUlBLElBQUksRUFBUixFQUFZO0FBQ1Y7QUFDRDtBQUNGLEdBSkQsTUFJTztBQUNMLFFBQUlBLElBQUosRUFBVTtBQUNSO0FBQ0Q7QUFDRjs7QUFFREMsRUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWFILE9BQWI7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRGlzcGxheSBhIGRlcHJlY2F0aW9uIHdhcm5pbmcgd2l0aCB0aGUgcHJvdmlkZWQgbWVzc2FnZSBpZiB0aGVcbiAqIHByb3ZpZGVkIGB0ZXN0YCBldmFsdWF0ZXMgdG8gYSBmYWxzeSB2YWx1ZSAob3IgaXMgbWlzc2luZykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXByZWNhdGUobWVzc2FnZSwgdGVzdCkge1xuICBpZiAodHlwZW9mIHRlc3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAodGVzdCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICh0ZXN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xufSJdfQ==