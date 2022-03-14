import Orbit from './main';
var deprecate = Orbit.deprecate;
/**
 *  The `Notifier` class can emit messages to an array of subscribed listeners.
 * Here's a simple example:
 *
 * ```ts
 * import { Notifier } from '@orbit/core';
 *
 * let notifier = new Notifier();
 * notifier.addListener((message: string) => {
 *   console.log("I heard " + message);
 * });
 * notifier.addListener((message: string) => {
 *   console.log("I also heard " + message);
 * });
 *
 * notifier.emit('hello'); // logs "I heard hello" and "I also heard hello"
 * ```
 *
 * Calls to `emit` will send along all of their arguments.
 */

var Notifier =
/*#__PURE__*/
function () {
  function Notifier() {
    this.listeners = [];
  }
  /**
   * Add a callback as a listener, which will be triggered when sending
   * notifications.
   */


  var _proto = Notifier.prototype;

  _proto.addListener = function addListener(listener) {
    if (arguments.length > 1) {
      deprecate('`binding` argument is no longer supported for individual `Notifier` listeners. Please pre-bind listeners before calling `addListener`.');
    }

    this.listeners.push(listener);
  }
  /**
   * Remove a listener so that it will no longer receive notifications.
   */
  ;

  _proto.removeListener = function removeListener(listener) {
    if (arguments.length > 1) {
      deprecate('`binding` argument is no longer supported for individual `Notifier` listeners. Please pre-bind listeners before calling `removeListener`.');
    }

    var listeners = this.listeners;

    for (var i = 0, len = listeners.length; i < len; i++) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        return;
      }
    }
  }
  /**
   * Notify registered listeners.
   */
  ;

  _proto.emit = function emit() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    this.listeners.slice(0).forEach(function (listener) {
      return listener.apply(void 0, args);
    });
  };

  return Notifier;
}();

export { Notifier as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vdGlmaWVyLmpzIl0sIm5hbWVzIjpbIk9yYml0IiwiZGVwcmVjYXRlIiwiTm90aWZpZXIiLCJsaXN0ZW5lcnMiLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwicHVzaCIsInJlbW92ZUxpc3RlbmVyIiwiaSIsImxlbiIsInNwbGljZSIsImVtaXQiLCJhcmdzIiwic2xpY2UiLCJmb3JFYWNoIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPQSxLQUFQLE1BQWtCLFFBQWxCO0lBRUVDLFMsR0FDRUQsSyxDQURGQyxTO0FBRUY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXFCcUJDLFE7OztBQUNuQixzQkFBYztBQUNaLFNBQUtDLFNBQUwsR0FBaUIsRUFBakI7QUFDRDtBQUNEOzs7Ozs7OztTQU1BQyxXLEdBQUEscUJBQVlDLFFBQVosRUFBc0I7QUFDcEIsUUFBSUMsU0FBUyxDQUFDQyxNQUFWLEdBQW1CLENBQXZCLEVBQTBCO0FBQ3hCTixNQUFBQSxTQUFTLENBQUMsd0lBQUQsQ0FBVDtBQUNEOztBQUVELFNBQUtFLFNBQUwsQ0FBZUssSUFBZixDQUFvQkgsUUFBcEI7QUFDRDtBQUNEOzs7OztTQUtBSSxjLEdBQUEsd0JBQWVKLFFBQWYsRUFBeUI7QUFDdkIsUUFBSUMsU0FBUyxDQUFDQyxNQUFWLEdBQW1CLENBQXZCLEVBQTBCO0FBQ3hCTixNQUFBQSxTQUFTLENBQUMsMklBQUQsQ0FBVDtBQUNEOztBQUVELFFBQU1FLFNBQVMsR0FBRyxLQUFLQSxTQUF2Qjs7QUFFQSxTQUFLLElBQUlPLENBQUMsR0FBRyxDQUFSLEVBQVdDLEdBQUcsR0FBR1IsU0FBUyxDQUFDSSxNQUFoQyxFQUF3Q0csQ0FBQyxHQUFHQyxHQUE1QyxFQUFpREQsQ0FBQyxFQUFsRCxFQUFzRDtBQUNwRCxVQUFJUCxTQUFTLENBQUNPLENBQUQsQ0FBVCxLQUFpQkwsUUFBckIsRUFBK0I7QUFDN0JGLFFBQUFBLFNBQVMsQ0FBQ1MsTUFBVixDQUFpQkYsQ0FBakIsRUFBb0IsQ0FBcEI7QUFDQTtBQUNEO0FBQ0Y7QUFDRjtBQUNEOzs7OztTQUtBRyxJLEdBQUEsZ0JBQWM7QUFBQSxzQ0FBTkMsSUFBTTtBQUFOQSxNQUFBQSxJQUFNO0FBQUE7O0FBQ1osU0FBS1gsU0FBTCxDQUFlWSxLQUFmLENBQXFCLENBQXJCLEVBQXdCQyxPQUF4QixDQUFnQyxVQUFBWCxRQUFRO0FBQUEsYUFBSUEsUUFBUSxNQUFSLFNBQVlTLElBQVosQ0FBSjtBQUFBLEtBQXhDO0FBQ0QsRzs7Ozs7U0EzQ2tCWixRIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9yYml0IGZyb20gJy4vbWFpbic7XG5jb25zdCB7XG4gIGRlcHJlY2F0ZVxufSA9IE9yYml0O1xuLyoqXG4gKiAgVGhlIGBOb3RpZmllcmAgY2xhc3MgY2FuIGVtaXQgbWVzc2FnZXMgdG8gYW4gYXJyYXkgb2Ygc3Vic2NyaWJlZCBsaXN0ZW5lcnMuXG4gKiBIZXJlJ3MgYSBzaW1wbGUgZXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgTm90aWZpZXIgfSBmcm9tICdAb3JiaXQvY29yZSc7XG4gKlxuICogbGV0IG5vdGlmaWVyID0gbmV3IE5vdGlmaWVyKCk7XG4gKiBub3RpZmllci5hZGRMaXN0ZW5lcigobWVzc2FnZTogc3RyaW5nKSA9PiB7XG4gKiAgIGNvbnNvbGUubG9nKFwiSSBoZWFyZCBcIiArIG1lc3NhZ2UpO1xuICogfSk7XG4gKiBub3RpZmllci5hZGRMaXN0ZW5lcigobWVzc2FnZTogc3RyaW5nKSA9PiB7XG4gKiAgIGNvbnNvbGUubG9nKFwiSSBhbHNvIGhlYXJkIFwiICsgbWVzc2FnZSk7XG4gKiB9KTtcbiAqXG4gKiBub3RpZmllci5lbWl0KCdoZWxsbycpOyAvLyBsb2dzIFwiSSBoZWFyZCBoZWxsb1wiIGFuZCBcIkkgYWxzbyBoZWFyZCBoZWxsb1wiXG4gKiBgYGBcbiAqXG4gKiBDYWxscyB0byBgZW1pdGAgd2lsbCBzZW5kIGFsb25nIGFsbCBvZiB0aGVpciBhcmd1bWVudHMuXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTm90aWZpZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xuICB9XG4gIC8qKlxuICAgKiBBZGQgYSBjYWxsYmFjayBhcyBhIGxpc3RlbmVyLCB3aGljaCB3aWxsIGJlIHRyaWdnZXJlZCB3aGVuIHNlbmRpbmdcbiAgICogbm90aWZpY2F0aW9ucy5cbiAgICovXG5cblxuICBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgZGVwcmVjYXRlKCdgYmluZGluZ2AgYXJndW1lbnQgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCBmb3IgaW5kaXZpZHVhbCBgTm90aWZpZXJgIGxpc3RlbmVycy4gUGxlYXNlIHByZS1iaW5kIGxpc3RlbmVycyBiZWZvcmUgY2FsbGluZyBgYWRkTGlzdGVuZXJgLicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICB9XG4gIC8qKlxuICAgKiBSZW1vdmUgYSBsaXN0ZW5lciBzbyB0aGF0IGl0IHdpbGwgbm8gbG9uZ2VyIHJlY2VpdmUgbm90aWZpY2F0aW9ucy5cbiAgICovXG5cblxuICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgZGVwcmVjYXRlKCdgYmluZGluZ2AgYXJndW1lbnQgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCBmb3IgaW5kaXZpZHVhbCBgTm90aWZpZXJgIGxpc3RlbmVycy4gUGxlYXNlIHByZS1iaW5kIGxpc3RlbmVycyBiZWZvcmUgY2FsbGluZyBgcmVtb3ZlTGlzdGVuZXJgLicpO1xuICAgIH1cblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogTm90aWZ5IHJlZ2lzdGVyZWQgbGlzdGVuZXJzLlxuICAgKi9cblxuXG4gIGVtaXQoLi4uYXJncykge1xuICAgIHRoaXMubGlzdGVuZXJzLnNsaWNlKDApLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIoLi4uYXJncykpO1xuICB9XG5cbn0iXX0=