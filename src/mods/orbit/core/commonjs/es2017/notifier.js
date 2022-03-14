"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _main = _interopRequireDefault(require("./main"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  deprecate
} = _main.default;
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

class Notifier {
  constructor() {
    this.listeners = [];
  }
  /**
   * Add a callback as a listener, which will be triggered when sending
   * notifications.
   */


  addListener(listener) {
    if (arguments.length > 1) {
      deprecate('`binding` argument is no longer supported for individual `Notifier` listeners. Please pre-bind listeners before calling `addListener`.');
    }

    this.listeners.push(listener);
  }
  /**
   * Remove a listener so that it will no longer receive notifications.
   */


  removeListener(listener) {
    if (arguments.length > 1) {
      deprecate('`binding` argument is no longer supported for individual `Notifier` listeners. Please pre-bind listeners before calling `removeListener`.');
    }

    const listeners = this.listeners;

    for (let i = 0, len = listeners.length; i < len; i++) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        return;
      }
    }
  }
  /**
   * Notify registered listeners.
   */


  emit(...args) {
    this.listeners.slice(0).forEach(listener => listener(...args));
  }

}

exports.default = Notifier;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vdGlmaWVyLmpzIl0sIm5hbWVzIjpbImRlcHJlY2F0ZSIsIk9yYml0IiwiTm90aWZpZXIiLCJjb25zdHJ1Y3RvciIsImxpc3RlbmVycyIsImFkZExpc3RlbmVyIiwibGlzdGVuZXIiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJwdXNoIiwicmVtb3ZlTGlzdGVuZXIiLCJpIiwibGVuIiwic3BsaWNlIiwiZW1pdCIsImFyZ3MiLCJzbGljZSIsImZvckVhY2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7OztBQUNBLE1BQU07QUFDSkEsRUFBQUE7QUFESSxJQUVGQyxhQUZKO0FBR0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCZSxNQUFNQyxRQUFOLENBQWU7QUFDNUJDLEVBQUFBLFdBQVcsR0FBRztBQUNaLFNBQUtDLFNBQUwsR0FBaUIsRUFBakI7QUFDRDtBQUNEOzs7Ozs7QUFNQUMsRUFBQUEsV0FBVyxDQUFDQyxRQUFELEVBQVc7QUFDcEIsUUFBSUMsU0FBUyxDQUFDQyxNQUFWLEdBQW1CLENBQXZCLEVBQTBCO0FBQ3hCUixNQUFBQSxTQUFTLENBQUMsd0lBQUQsQ0FBVDtBQUNEOztBQUVELFNBQUtJLFNBQUwsQ0FBZUssSUFBZixDQUFvQkgsUUFBcEI7QUFDRDtBQUNEOzs7OztBQUtBSSxFQUFBQSxjQUFjLENBQUNKLFFBQUQsRUFBVztBQUN2QixRQUFJQyxTQUFTLENBQUNDLE1BQVYsR0FBbUIsQ0FBdkIsRUFBMEI7QUFDeEJSLE1BQUFBLFNBQVMsQ0FBQywySUFBRCxDQUFUO0FBQ0Q7O0FBRUQsVUFBTUksU0FBUyxHQUFHLEtBQUtBLFNBQXZCOztBQUVBLFNBQUssSUFBSU8sQ0FBQyxHQUFHLENBQVIsRUFBV0MsR0FBRyxHQUFHUixTQUFTLENBQUNJLE1BQWhDLEVBQXdDRyxDQUFDLEdBQUdDLEdBQTVDLEVBQWlERCxDQUFDLEVBQWxELEVBQXNEO0FBQ3BELFVBQUlQLFNBQVMsQ0FBQ08sQ0FBRCxDQUFULEtBQWlCTCxRQUFyQixFQUErQjtBQUM3QkYsUUFBQUEsU0FBUyxDQUFDUyxNQUFWLENBQWlCRixDQUFqQixFQUFvQixDQUFwQjtBQUNBO0FBQ0Q7QUFDRjtBQUNGO0FBQ0Q7Ozs7O0FBS0FHLEVBQUFBLElBQUksQ0FBQyxHQUFHQyxJQUFKLEVBQVU7QUFDWixTQUFLWCxTQUFMLENBQWVZLEtBQWYsQ0FBcUIsQ0FBckIsRUFBd0JDLE9BQXhCLENBQWdDWCxRQUFRLElBQUlBLFFBQVEsQ0FBQyxHQUFHUyxJQUFKLENBQXBEO0FBQ0Q7O0FBM0MyQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPcmJpdCBmcm9tICcuL21haW4nO1xuY29uc3Qge1xuICBkZXByZWNhdGVcbn0gPSBPcmJpdDtcbi8qKlxuICogIFRoZSBgTm90aWZpZXJgIGNsYXNzIGNhbiBlbWl0IG1lc3NhZ2VzIHRvIGFuIGFycmF5IG9mIHN1YnNjcmliZWQgbGlzdGVuZXJzLlxuICogSGVyZSdzIGEgc2ltcGxlIGV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IE5vdGlmaWVyIH0gZnJvbSAnQG9yYml0L2NvcmUnO1xuICpcbiAqIGxldCBub3RpZmllciA9IG5ldyBOb3RpZmllcigpO1xuICogbm90aWZpZXIuYWRkTGlzdGVuZXIoKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xuICogICBjb25zb2xlLmxvZyhcIkkgaGVhcmQgXCIgKyBtZXNzYWdlKTtcbiAqIH0pO1xuICogbm90aWZpZXIuYWRkTGlzdGVuZXIoKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xuICogICBjb25zb2xlLmxvZyhcIkkgYWxzbyBoZWFyZCBcIiArIG1lc3NhZ2UpO1xuICogfSk7XG4gKlxuICogbm90aWZpZXIuZW1pdCgnaGVsbG8nKTsgLy8gbG9ncyBcIkkgaGVhcmQgaGVsbG9cIiBhbmQgXCJJIGFsc28gaGVhcmQgaGVsbG9cIlxuICogYGBgXG4gKlxuICogQ2FsbHMgdG8gYGVtaXRgIHdpbGwgc2VuZCBhbG9uZyBhbGwgb2YgdGhlaXIgYXJndW1lbnRzLlxuICovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5vdGlmaWVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbiAgfVxuICAvKipcbiAgICogQWRkIGEgY2FsbGJhY2sgYXMgYSBsaXN0ZW5lciwgd2hpY2ggd2lsbCBiZSB0cmlnZ2VyZWQgd2hlbiBzZW5kaW5nXG4gICAqIG5vdGlmaWNhdGlvbnMuXG4gICAqL1xuXG5cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGRlcHJlY2F0ZSgnYGJpbmRpbmdgIGFyZ3VtZW50IGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgZm9yIGluZGl2aWR1YWwgYE5vdGlmaWVyYCBsaXN0ZW5lcnMuIFBsZWFzZSBwcmUtYmluZCBsaXN0ZW5lcnMgYmVmb3JlIGNhbGxpbmcgYGFkZExpc3RlbmVyYC4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgfVxuICAvKipcbiAgICogUmVtb3ZlIGEgbGlzdGVuZXIgc28gdGhhdCBpdCB3aWxsIG5vIGxvbmdlciByZWNlaXZlIG5vdGlmaWNhdGlvbnMuXG4gICAqL1xuXG5cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGRlcHJlY2F0ZSgnYGJpbmRpbmdgIGFyZ3VtZW50IGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgZm9yIGluZGl2aWR1YWwgYE5vdGlmaWVyYCBsaXN0ZW5lcnMuIFBsZWFzZSBwcmUtYmluZCBsaXN0ZW5lcnMgYmVmb3JlIGNhbGxpbmcgYHJlbW92ZUxpc3RlbmVyYC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycztcblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0gPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIE5vdGlmeSByZWdpc3RlcmVkIGxpc3RlbmVycy5cbiAgICovXG5cblxuICBlbWl0KC4uLmFyZ3MpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5zbGljZSgwKS5mb3JFYWNoKGxpc3RlbmVyID0+IGxpc3RlbmVyKC4uLmFyZ3MpKTtcbiAgfVxuXG59Il19