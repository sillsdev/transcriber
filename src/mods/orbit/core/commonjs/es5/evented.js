"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isEvented = isEvented;
exports.default = evented;
exports.settleInSeries = settleInSeries;
exports.fulfillInSeries = fulfillInSeries;
exports.EVENTED = void 0;

var _main = _interopRequireDefault(require("./main"));

var _notifier = _interopRequireDefault(require("./notifier"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var deprecate = _main.default.deprecate;
var EVENTED = '__evented__';
/**
 * Has a class been decorated as `@evented`?
 */

exports.EVENTED = EVENTED;

function isEvented(obj) {
  return !!obj[EVENTED];
}
/**
 * Marks a class as evented.
 *
 * An evented class should also implement the `Evented` interface.
 *
 * ```ts
 * import { evented, Evented } from '@orbit/core';
 *
 * @evented
 * class Source implements Evented {
 *   ...
 * }
 * ```
 *
 * Listeners can then register themselves for particular events with `on`:
 *
 * ```ts
 * let source = new Source();
 *
 * function listener1(message: string) {
 *   console.log('listener1 heard ' + message);
 * };
 * function listener2(message: string) {
 *   console.log('listener2 heard ' + message);
 * };
 *
 * source.on('greeting', listener1);
 * source.on('greeting', listener2);
 *
 * evented.emit('greeting', 'hello'); // logs "listener1 heard hello" and
 *                                    //      "listener2 heard hello"
 * ```
 *
 * Listeners can be unregistered from events at any time with `off`:
 *
 * ```ts
 * source.off('greeting', listener2);
 * ```
 */


function evented(Klass) {
  var proto = Klass.prototype;

  if (isEvented(proto)) {
    return;
  }

  proto[EVENTED] = true;

  proto.on = function (eventName, listener) {
    if (arguments.length > 2) {
      deprecate('`binding` argument is no longer supported when configuring `Evented` listeners. Please pre-bind listeners before calling `on`.');
    }

    notifierForEvent(this, eventName, true).addListener(listener);
  };

  proto.off = function (eventName, listener) {
    if (arguments.length > 2) {
      deprecate('`binding` argument is no longer supported when configuring `Evented` listeners. Please pre-bind listeners before calling `off`.');
    }

    var notifier = notifierForEvent(this, eventName);

    if (notifier) {
      if (listener) {
        notifier.removeListener(listener);
      } else {
        removeNotifierForEvent(this, eventName);
      }
    }
  };

  proto.one = function (eventName, listener) {
    if (arguments.length > 2) {
      deprecate('`binding` argument is no longer supported when configuring `Evented` listeners. Please pre-bind listeners before calling `off`.');
    }

    var notifier = notifierForEvent(this, eventName, true);

    var callOnce = function () {
      listener.apply(void 0, arguments);
      notifier.removeListener(callOnce);
    };

    notifier.addListener(callOnce);
  };

  proto.emit = function (eventName) {
    var notifier = notifierForEvent(this, eventName);

    if (notifier) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      notifier.emit.apply(notifier, args);
    }
  };

  proto.listeners = function (eventName) {
    var notifier = notifierForEvent(this, eventName);
    return notifier ? notifier.listeners : [];
  };
}
/**
 * Settle any promises returned by event listeners in series.
 *
 * If any errors are encountered during processing, they will be ignored.
 */


function settleInSeries(obj, eventName) {
  for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
    args[_key2 - 2] = arguments[_key2];
  }

  var listeners = obj.listeners(eventName);
  return listeners.reduce(function (chain, listener) {
    return chain.then(function () {
      return listener.apply(void 0, args);
    }).catch(function () {});
  }, Promise.resolve());
}
/**
 * Fulfill any promises returned by event listeners in series.
 *
 * Processing will stop if an error is encountered and the returned promise will
 * be rejected.
 */


function fulfillInSeries(obj, eventName) {
  for (var _len3 = arguments.length, args = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
    args[_key3 - 2] = arguments[_key3];
  }

  var listeners = obj.listeners(eventName);
  return new Promise(function (resolve, reject) {
    fulfillEach(listeners, args, resolve, reject);
  });
}

function notifierForEvent(object, eventName) {
  var createIfUndefined = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  if (object._eventedNotifiers === undefined) {
    object._eventedNotifiers = {};
  }

  var notifier = object._eventedNotifiers[eventName];

  if (!notifier && createIfUndefined) {
    notifier = object._eventedNotifiers[eventName] = new _notifier.default();
  }

  return notifier;
}

function removeNotifierForEvent(object, eventName) {
  if (object._eventedNotifiers && object._eventedNotifiers[eventName]) {
    delete object._eventedNotifiers[eventName];
  }
}

function fulfillEach(listeners, args, resolve, reject) {
  if (listeners.length === 0) {
    resolve();
  } else {
    var listener;
    var _listeners = listeners;
    listener = _listeners[0];
    listeners = _listeners.slice(1);
    var response = listener.apply(void 0, args);

    if (response) {
      return Promise.resolve(response).then(function () {
        return fulfillEach(listeners, args, resolve, reject);
      }).catch(function (error) {
        return reject(error);
      });
    } else {
      fulfillEach(listeners, args, resolve, reject);
    }
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50ZWQuanMiXSwibmFtZXMiOlsiZGVwcmVjYXRlIiwiT3JiaXQiLCJFVkVOVEVEIiwib2JqIiwicHJvdG8iLCJLbGFzcyIsImlzRXZlbnRlZCIsImFyZ3VtZW50cyIsIm5vdGlmaWVyRm9yRXZlbnQiLCJub3RpZmllciIsInJlbW92ZU5vdGlmaWVyRm9yRXZlbnQiLCJjYWxsT25jZSIsImxpc3RlbmVyIiwiYXJncyIsImxpc3RlbmVycyIsIlByb21pc2UiLCJmdWxmaWxsRWFjaCIsImNyZWF0ZUlmVW5kZWZpbmVkIiwib2JqZWN0IiwicmVzb2x2ZSIsInJlc3BvbnNlIiwicmVqZWN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0lBRUVBLFMsR0FDRUMsY0FERkQsUztBQUVLLElBQU1FLE9BQU8sR0FBYixhQUFBO0FBQ1A7Ozs7OztBQUlPLFNBQUEsU0FBQSxDQUFBLEdBQUEsRUFBd0I7QUFDN0IsU0FBTyxDQUFDLENBQUNDLEdBQUcsQ0FBWixPQUFZLENBQVo7QUFDRDtBQUNEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdDZSxTQUFBLE9BQUEsQ0FBQSxLQUFBLEVBQXdCO0FBQ3JDLE1BQUlDLEtBQUssR0FBR0MsS0FBSyxDQUFqQixTQUFBOztBQUVBLE1BQUlDLFNBQVMsQ0FBYixLQUFhLENBQWIsRUFBc0I7QUFDcEI7QUFDRDs7QUFFREYsRUFBQUEsS0FBSyxDQUFMQSxPQUFLLENBQUxBLEdBQUFBLElBQUFBOztBQUVBQSxFQUFBQSxLQUFLLENBQUxBLEVBQUFBLEdBQVcsVUFBQSxTQUFBLEVBQUEsUUFBQSxFQUErQjtBQUN4QyxRQUFJRyxTQUFTLENBQVRBLE1BQUFBLEdBQUosQ0FBQSxFQUEwQjtBQUN4QlAsTUFBQUEsU0FBUyxDQUFUQSxnSUFBUyxDQUFUQTtBQUNEOztBQUVEUSxJQUFBQSxnQkFBZ0IsQ0FBQSxJQUFBLEVBQUEsU0FBQSxFQUFoQkEsSUFBZ0IsQ0FBaEJBLENBQUFB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T0FBTyxDQUFQLE9BQUEsQ0FBQSxRQUFBLEVBQUEsSUFBQSxDQUErQixZQUFBO0FBQUEsZUFBTUksV0FBVyxDQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsT0FBQSxFQUFqQixNQUFpQixDQUFqQjtBQUEvQixPQUFBLEVBQUEsS0FBQSxDQUEwRixVQUFBLEtBQUEsRUFBSztBQUFBLGVBQUlLLE1BQU0sQ0FBVixLQUFVLENBQVY7QUFBdEcsT0FBTyxDQUFQO0FBREYsS0FBQSxNQUVPO0FBQ0xMLE1BQUFBLFdBQVcsQ0FBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLE9BQUEsRUFBWEEsTUFBVyxDQUFYQTtBQUNEO0FBQ0Y7QUFDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPcmJpdCBmcm9tICcuL21haW4nO1xuaW1wb3J0IE5vdGlmaWVyIGZyb20gJy4vbm90aWZpZXInO1xuY29uc3Qge1xuICBkZXByZWNhdGVcbn0gPSBPcmJpdDtcbmV4cG9ydCBjb25zdCBFVkVOVEVEID0gJ19fZXZlbnRlZF9fJztcbi8qKlxuICogSGFzIGEgY2xhc3MgYmVlbiBkZWNvcmF0ZWQgYXMgYEBldmVudGVkYD9cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gaXNFdmVudGVkKG9iaikge1xuICByZXR1cm4gISFvYmpbRVZFTlRFRF07XG59XG4vKipcbiAqIE1hcmtzIGEgY2xhc3MgYXMgZXZlbnRlZC5cbiAqXG4gKiBBbiBldmVudGVkIGNsYXNzIHNob3VsZCBhbHNvIGltcGxlbWVudCB0aGUgYEV2ZW50ZWRgIGludGVyZmFjZS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXZlbnRlZCwgRXZlbnRlZCB9IGZyb20gJ0BvcmJpdC9jb3JlJztcbiAqXG4gKiBAZXZlbnRlZFxuICogY2xhc3MgU291cmNlIGltcGxlbWVudHMgRXZlbnRlZCB7XG4gKiAgIC4uLlxuICogfVxuICogYGBgXG4gKlxuICogTGlzdGVuZXJzIGNhbiB0aGVuIHJlZ2lzdGVyIHRoZW1zZWx2ZXMgZm9yIHBhcnRpY3VsYXIgZXZlbnRzIHdpdGggYG9uYDpcbiAqXG4gKiBgYGB0c1xuICogbGV0IHNvdXJjZSA9IG5ldyBTb3VyY2UoKTtcbiAqXG4gKiBmdW5jdGlvbiBsaXN0ZW5lcjEobWVzc2FnZTogc3RyaW5nKSB7XG4gKiAgIGNvbnNvbGUubG9nKCdsaXN0ZW5lcjEgaGVhcmQgJyArIG1lc3NhZ2UpO1xuICogfTtcbiAqIGZ1bmN0aW9uIGxpc3RlbmVyMihtZXNzYWdlOiBzdHJpbmcpIHtcbiAqICAgY29uc29sZS5sb2coJ2xpc3RlbmVyMiBoZWFyZCAnICsgbWVzc2FnZSk7XG4gKiB9O1xuICpcbiAqIHNvdXJjZS5vbignZ3JlZXRpbmcnLCBsaXN0ZW5lcjEpO1xuICogc291cmNlLm9uKCdncmVldGluZycsIGxpc3RlbmVyMik7XG4gKlxuICogZXZlbnRlZC5lbWl0KCdncmVldGluZycsICdoZWxsbycpOyAvLyBsb2dzIFwibGlzdGVuZXIxIGhlYXJkIGhlbGxvXCIgYW5kXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgXCJsaXN0ZW5lcjIgaGVhcmQgaGVsbG9cIlxuICogYGBgXG4gKlxuICogTGlzdGVuZXJzIGNhbiBiZSB1bnJlZ2lzdGVyZWQgZnJvbSBldmVudHMgYXQgYW55IHRpbWUgd2l0aCBgb2ZmYDpcbiAqXG4gKiBgYGB0c1xuICogc291cmNlLm9mZignZ3JlZXRpbmcnLCBsaXN0ZW5lcjIpO1xuICogYGBgXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZXZlbnRlZChLbGFzcykge1xuICBsZXQgcHJvdG8gPSBLbGFzcy5wcm90b3R5cGU7XG5cbiAgaWYgKGlzRXZlbnRlZChwcm90bykpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBwcm90b1tFVkVOVEVEXSA9IHRydWU7XG5cbiAgcHJvdG8ub24gPSBmdW5jdGlvbiAoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgZGVwcmVjYXRlKCdgYmluZGluZ2AgYXJndW1lbnQgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCB3aGVuIGNvbmZpZ3VyaW5nIGBFdmVudGVkYCBsaXN0ZW5lcnMuIFBsZWFzZSBwcmUtYmluZCBsaXN0ZW5lcnMgYmVmb3JlIGNhbGxpbmcgYG9uYC4nKTtcbiAgICB9XG5cbiAgICBub3RpZmllckZvckV2ZW50KHRoaXMsIGV2ZW50TmFtZSwgdHJ1ZSkuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICB9O1xuXG4gIHByb3RvLm9mZiA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICBkZXByZWNhdGUoJ2BiaW5kaW5nYCBhcmd1bWVudCBpcyBubyBsb25nZXIgc3VwcG9ydGVkIHdoZW4gY29uZmlndXJpbmcgYEV2ZW50ZWRgIGxpc3RlbmVycy4gUGxlYXNlIHByZS1iaW5kIGxpc3RlbmVycyBiZWZvcmUgY2FsbGluZyBgb2ZmYC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBub3RpZmllciA9IG5vdGlmaWVyRm9yRXZlbnQodGhpcywgZXZlbnROYW1lKTtcblxuICAgIGlmIChub3RpZmllcikge1xuICAgICAgaWYgKGxpc3RlbmVyKSB7XG4gICAgICAgIG5vdGlmaWVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlbW92ZU5vdGlmaWVyRm9yRXZlbnQodGhpcywgZXZlbnROYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcHJvdG8ub25lID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgIGRlcHJlY2F0ZSgnYGJpbmRpbmdgIGFyZ3VtZW50IGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgd2hlbiBjb25maWd1cmluZyBgRXZlbnRlZGAgbGlzdGVuZXJzLiBQbGVhc2UgcHJlLWJpbmQgbGlzdGVuZXJzIGJlZm9yZSBjYWxsaW5nIGBvZmZgLicpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vdGlmaWVyID0gbm90aWZpZXJGb3JFdmVudCh0aGlzLCBldmVudE5hbWUsIHRydWUpO1xuXG4gICAgY29uc3QgY2FsbE9uY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBsaXN0ZW5lciguLi5hcmd1bWVudHMpO1xuICAgICAgbm90aWZpZXIucmVtb3ZlTGlzdGVuZXIoY2FsbE9uY2UpO1xuICAgIH07XG5cbiAgICBub3RpZmllci5hZGRMaXN0ZW5lcihjYWxsT25jZSk7XG4gIH07XG5cbiAgcHJvdG8uZW1pdCA9IGZ1bmN0aW9uIChldmVudE5hbWUsIC4uLmFyZ3MpIHtcbiAgICBsZXQgbm90aWZpZXIgPSBub3RpZmllckZvckV2ZW50KHRoaXMsIGV2ZW50TmFtZSk7XG5cbiAgICBpZiAobm90aWZpZXIpIHtcbiAgICAgIG5vdGlmaWVyLmVtaXQuYXBwbHkobm90aWZpZXIsIGFyZ3MpO1xuICAgIH1cbiAgfTtcblxuICBwcm90by5saXN0ZW5lcnMgPSBmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgbGV0IG5vdGlmaWVyID0gbm90aWZpZXJGb3JFdmVudCh0aGlzLCBldmVudE5hbWUpO1xuICAgIHJldHVybiBub3RpZmllciA/IG5vdGlmaWVyLmxpc3RlbmVycyA6IFtdO1xuICB9O1xufVxuLyoqXG4gKiBTZXR0bGUgYW55IHByb21pc2VzIHJldHVybmVkIGJ5IGV2ZW50IGxpc3RlbmVycyBpbiBzZXJpZXMuXG4gKlxuICogSWYgYW55IGVycm9ycyBhcmUgZW5jb3VudGVyZWQgZHVyaW5nIHByb2Nlc3NpbmcsIHRoZXkgd2lsbCBiZSBpZ25vcmVkLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXR0bGVJblNlcmllcyhvYmosIGV2ZW50TmFtZSwgLi4uYXJncykge1xuICBjb25zdCBsaXN0ZW5lcnMgPSBvYmoubGlzdGVuZXJzKGV2ZW50TmFtZSk7XG4gIHJldHVybiBsaXN0ZW5lcnMucmVkdWNlKChjaGFpbiwgbGlzdGVuZXIpID0+IHtcbiAgICByZXR1cm4gY2hhaW4udGhlbigoKSA9PiBsaXN0ZW5lciguLi5hcmdzKSkuY2F0Y2goKCkgPT4ge30pO1xuICB9LCBQcm9taXNlLnJlc29sdmUoKSk7XG59XG4vKipcbiAqIEZ1bGZpbGwgYW55IHByb21pc2VzIHJldHVybmVkIGJ5IGV2ZW50IGxpc3RlbmVycyBpbiBzZXJpZXMuXG4gKlxuICogUHJvY2Vzc2luZyB3aWxsIHN0b3AgaWYgYW4gZXJyb3IgaXMgZW5jb3VudGVyZWQgYW5kIHRoZSByZXR1cm5lZCBwcm9taXNlIHdpbGxcbiAqIGJlIHJlamVjdGVkLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBmdWxmaWxsSW5TZXJpZXMob2JqLCBldmVudE5hbWUsIC4uLmFyZ3MpIHtcbiAgY29uc3QgbGlzdGVuZXJzID0gb2JqLmxpc3RlbmVycyhldmVudE5hbWUpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGZ1bGZpbGxFYWNoKGxpc3RlbmVycywgYXJncywgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmaWVyRm9yRXZlbnQob2JqZWN0LCBldmVudE5hbWUsIGNyZWF0ZUlmVW5kZWZpbmVkID0gZmFsc2UpIHtcbiAgaWYgKG9iamVjdC5fZXZlbnRlZE5vdGlmaWVycyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgb2JqZWN0Ll9ldmVudGVkTm90aWZpZXJzID0ge307XG4gIH1cblxuICBsZXQgbm90aWZpZXIgPSBvYmplY3QuX2V2ZW50ZWROb3RpZmllcnNbZXZlbnROYW1lXTtcblxuICBpZiAoIW5vdGlmaWVyICYmIGNyZWF0ZUlmVW5kZWZpbmVkKSB7XG4gICAgbm90aWZpZXIgPSBvYmplY3QuX2V2ZW50ZWROb3RpZmllcnNbZXZlbnROYW1lXSA9IG5ldyBOb3RpZmllcigpO1xuICB9XG5cbiAgcmV0dXJuIG5vdGlmaWVyO1xufVxuXG5mdW5jdGlvbiByZW1vdmVOb3RpZmllckZvckV2ZW50KG9iamVjdCwgZXZlbnROYW1lKSB7XG4gIGlmIChvYmplY3QuX2V2ZW50ZWROb3RpZmllcnMgJiYgb2JqZWN0Ll9ldmVudGVkTm90aWZpZXJzW2V2ZW50TmFtZV0pIHtcbiAgICBkZWxldGUgb2JqZWN0Ll9ldmVudGVkTm90aWZpZXJzW2V2ZW50TmFtZV07XG4gIH1cbn1cblxuZnVuY3Rpb24gZnVsZmlsbEVhY2gobGlzdGVuZXJzLCBhcmdzLCByZXNvbHZlLCByZWplY3QpIHtcbiAgaWYgKGxpc3RlbmVycy5sZW5ndGggPT09IDApIHtcbiAgICByZXNvbHZlKCk7XG4gIH0gZWxzZSB7XG4gICAgbGV0IGxpc3RlbmVyO1xuICAgIFtsaXN0ZW5lciwgLi4ubGlzdGVuZXJzXSA9IGxpc3RlbmVycztcbiAgICBsZXQgcmVzcG9uc2UgPSBsaXN0ZW5lciguLi5hcmdzKTtcblxuICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXNwb25zZSkudGhlbigoKSA9PiBmdWxmaWxsRWFjaChsaXN0ZW5lcnMsIGFyZ3MsIHJlc29sdmUsIHJlamVjdCkpLmNhdGNoKGVycm9yID0+IHJlamVjdChlcnJvcikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmdWxmaWxsRWFjaChsaXN0ZW5lcnMsIGFyZ3MsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgfVxuICB9XG59Il19