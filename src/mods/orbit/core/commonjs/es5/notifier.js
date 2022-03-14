"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _main = _interopRequireDefault(require("./main"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var deprecate = _main.default.deprecate;
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

exports.default = Notifier;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vdGlmaWVyLmpzIl0sIm5hbWVzIjpbImRlcHJlY2F0ZSIsIk9yYml0IiwiTm90aWZpZXIiLCJhZGRMaXN0ZW5lciIsImFyZ3VtZW50cyIsInJlbW92ZUxpc3RlbmVyIiwibGlzdGVuZXJzIiwiaSIsImxlbiIsImVtaXQiLCJhcmdzIiwibGlzdGVuZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7OztJQUVFQSxTLEdBQ0VDLGNBREZELFM7QUFFRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBcUJxQkUsUTs7O0FBQ25CLFdBQUEsUUFBQSxHQUFjO0FBQ1osU0FBQSxTQUFBLEdBQUEsRUFBQTtBQUNEO0FBQ0Q7Ozs7Ozs7O1NBTUFDLFcsR0FBQUEsU0FBQUEsV0FBQUEsQ0FBQUEsUUFBQUEsRUFBc0I7QUFDcEIsUUFBSUMsU0FBUyxDQUFUQSxNQUFBQSxHQUFKLENBQUEsRUFBMEI7QUFDeEJKLE1BQUFBLFNBQVMsQ0FBVEEsd0lBQVMsQ0FBVEE7QUFDRDs7QUFFRCxTQUFBLFNBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQTtBQUNEO0FBQ0Q7Ozs7O1NBS0FLLGMsR0FBQUEsU0FBQUEsY0FBQUEsQ0FBQUEsUUFBQUEsRUFBeUI7QUFDdkIsUUFBSUQsU0FBUyxDQUFUQSxNQUFBQSxHQUFKLENBQUEsRUFBMEI7QUFDeEJKLE1BQUFBLFNBQVMsQ0FBVEEsMklBQVMsQ0FBVEE7QUFDRDs7QUFFRCxRQUFNTSxTQUFTLEdBQUcsS0FBbEIsU0FBQTs7QUFFQSxTQUFLLElBQUlDLENBQUMsR0FBTCxDQUFBLEVBQVdDLEdBQUcsR0FBR0YsU0FBUyxDQUEvQixNQUFBLEVBQXdDQyxDQUFDLEdBQXpDLEdBQUEsRUFBaURBLENBQWpELEVBQUEsRUFBc0Q7QUFDcEQsVUFBSUQsU0FBUyxDQUFUQSxDQUFTLENBQVRBLEtBQUosUUFBQSxFQUErQjtBQUM3QkEsUUFBQUEsU0FBUyxDQUFUQSxNQUFBQSxDQUFBQSxDQUFBQSxFQUFBQSxDQUFBQTtBQUNBO0FBQ0Q7QUFDRjtBQUNGO0FBQ0Q7Ozs7O1NBS0FHLEksR0FBQUEsU0FBQUEsSUFBQUEsR0FBYztBQUFBLFNBQUEsSUFBQSxJQUFBLEdBQUEsU0FBQSxDQUFBLE1BQUEsRUFBTkMsSUFBTSxHQUFBLElBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxFQUFBLElBQUEsR0FBQSxDQUFBLEVBQUEsSUFBQSxHQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUFOQSxNQUFBQSxJQUFNLENBQUEsSUFBQSxDQUFOQSxHQUFNLFNBQUEsQ0FBQSxJQUFBLENBQU5BO0FBQU07O0FBQ1osU0FBQSxTQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxPQUFBLENBQWdDLFVBQUEsUUFBQSxFQUFRO0FBQUEsYUFBSUMsUUFBUSxDQUFSQSxLQUFBQSxDQUFBQSxLQUFBQSxDQUFBQSxFQUFKLElBQUlBLENBQUo7QUFBeEMsS0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPcmJpdCBmcm9tICcuL21haW4nO1xuY29uc3Qge1xuICBkZXByZWNhdGVcbn0gPSBPcmJpdDtcbi8qKlxuICogIFRoZSBgTm90aWZpZXJgIGNsYXNzIGNhbiBlbWl0IG1lc3NhZ2VzIHRvIGFuIGFycmF5IG9mIHN1YnNjcmliZWQgbGlzdGVuZXJzLlxuICogSGVyZSdzIGEgc2ltcGxlIGV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IE5vdGlmaWVyIH0gZnJvbSAnQG9yYml0L2NvcmUnO1xuICpcbiAqIGxldCBub3RpZmllciA9IG5ldyBOb3RpZmllcigpO1xuICogbm90aWZpZXIuYWRkTGlzdGVuZXIoKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xuICogICBjb25zb2xlLmxvZyhcIkkgaGVhcmQgXCIgKyBtZXNzYWdlKTtcbiAqIH0pO1xuICogbm90aWZpZXIuYWRkTGlzdGVuZXIoKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xuICogICBjb25zb2xlLmxvZyhcIkkgYWxzbyBoZWFyZCBcIiArIG1lc3NhZ2UpO1xuICogfSk7XG4gKlxuICogbm90aWZpZXIuZW1pdCgnaGVsbG8nKTsgLy8gbG9ncyBcIkkgaGVhcmQgaGVsbG9cIiBhbmQgXCJJIGFsc28gaGVhcmQgaGVsbG9cIlxuICogYGBgXG4gKlxuICogQ2FsbHMgdG8gYGVtaXRgIHdpbGwgc2VuZCBhbG9uZyBhbGwgb2YgdGhlaXIgYXJndW1lbnRzLlxuICovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5vdGlmaWVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbiAgfVxuICAvKipcbiAgICogQWRkIGEgY2FsbGJhY2sgYXMgYSBsaXN0ZW5lciwgd2hpY2ggd2lsbCBiZSB0cmlnZ2VyZWQgd2hlbiBzZW5kaW5nXG4gICAqIG5vdGlmaWNhdGlvbnMuXG4gICAqL1xuXG5cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGRlcHJlY2F0ZSgnYGJpbmRpbmdgIGFyZ3VtZW50IGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgZm9yIGluZGl2aWR1YWwgYE5vdGlmaWVyYCBsaXN0ZW5lcnMuIFBsZWFzZSBwcmUtYmluZCBsaXN0ZW5lcnMgYmVmb3JlIGNhbGxpbmcgYGFkZExpc3RlbmVyYC4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgfVxuICAvKipcbiAgICogUmVtb3ZlIGEgbGlzdGVuZXIgc28gdGhhdCBpdCB3aWxsIG5vIGxvbmdlciByZWNlaXZlIG5vdGlmaWNhdGlvbnMuXG4gICAqL1xuXG5cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGRlcHJlY2F0ZSgnYGJpbmRpbmdgIGFyZ3VtZW50IGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgZm9yIGluZGl2aWR1YWwgYE5vdGlmaWVyYCBsaXN0ZW5lcnMuIFBsZWFzZSBwcmUtYmluZCBsaXN0ZW5lcnMgYmVmb3JlIGNhbGxpbmcgYHJlbW92ZUxpc3RlbmVyYC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycztcblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0gPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIE5vdGlmeSByZWdpc3RlcmVkIGxpc3RlbmVycy5cbiAgICovXG5cblxuICBlbWl0KC4uLmFyZ3MpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5zbGljZSgwKS5mb3JFYWNoKGxpc3RlbmVyID0+IGxpc3RlbmVyKC4uLmFyZ3MpKTtcbiAgfVxuXG59Il19