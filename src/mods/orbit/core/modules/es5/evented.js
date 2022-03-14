import Orbit from './main';
import Notifier from './notifier';
var deprecate = Orbit.deprecate;
export var EVENTED = '__evented__';
/**
 * Has a class been decorated as `@evented`?
 */

export function isEvented(obj) {
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

export default function evented(Klass) {
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

export function settleInSeries(obj, eventName) {
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

export function fulfillInSeries(obj, eventName) {
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
    notifier = object._eventedNotifiers[eventName] = new Notifier();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50ZWQuanMiXSwibmFtZXMiOlsiT3JiaXQiLCJOb3RpZmllciIsImRlcHJlY2F0ZSIsIkVWRU5URUQiLCJpc0V2ZW50ZWQiLCJvYmoiLCJldmVudGVkIiwiS2xhc3MiLCJwcm90byIsInByb3RvdHlwZSIsIm9uIiwiZXZlbnROYW1lIiwibGlzdGVuZXIiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJub3RpZmllckZvckV2ZW50IiwiYWRkTGlzdGVuZXIiLCJvZmYiLCJub3RpZmllciIsInJlbW92ZUxpc3RlbmVyIiwicmVtb3ZlTm90aWZpZXJGb3JFdmVudCIsIm9uZSIsImNhbGxPbmNlIiwiZW1pdCIsImFyZ3MiLCJhcHBseSIsImxpc3RlbmVycyIsInNldHRsZUluU2VyaWVzIiwicmVkdWNlIiwiY2hhaW4iLCJ0aGVuIiwiY2F0Y2giLCJQcm9taXNlIiwicmVzb2x2ZSIsImZ1bGZpbGxJblNlcmllcyIsInJlamVjdCIsImZ1bGZpbGxFYWNoIiwib2JqZWN0IiwiY3JlYXRlSWZVbmRlZmluZWQiLCJfZXZlbnRlZE5vdGlmaWVycyIsInVuZGVmaW5lZCIsInJlc3BvbnNlIiwiZXJyb3IiXSwibWFwcGluZ3MiOiJBQUFBLE9BQU9BLEtBQVAsTUFBa0IsUUFBbEI7QUFDQSxPQUFPQyxRQUFQLE1BQXFCLFlBQXJCO0lBRUVDLFMsR0FDRUYsSyxDQURGRSxTO0FBRUYsT0FBTyxJQUFNQyxPQUFPLEdBQUcsYUFBaEI7QUFDUDs7OztBQUlBLE9BQU8sU0FBU0MsU0FBVCxDQUFtQkMsR0FBbkIsRUFBd0I7QUFDN0IsU0FBTyxDQUFDLENBQUNBLEdBQUcsQ0FBQ0YsT0FBRCxDQUFaO0FBQ0Q7QUFDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdDQSxlQUFlLFNBQVNHLE9BQVQsQ0FBaUJDLEtBQWpCLEVBQXdCO0FBQ3JDLE1BQUlDLEtBQUssR0FBR0QsS0FBSyxDQUFDRSxTQUFsQjs7QUFFQSxNQUFJTCxTQUFTLENBQUNJLEtBQUQs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eUI1QixTQUF6QixDQUFoQyxFQUFxRTtBQUNuRSxXQUFPMEIsTUFBTSxDQUFDRSxpQkFBUCxDQUF5QjVCLFNBQXpCLENBQVA7QUFDRDtBQUNGOztBQUVELFNBQVN5QixXQUFULENBQXFCVixTQUFyQixFQUFnQ0YsSUFBaEMsRUFBc0NTLE9BQXRDLEVBQStDRSxNQUEvQyxFQUF1RDtBQUNyRCxNQUFJVCxTQUFTLENBQUNaLE1BQVYsS0FBcUIsQ0FBekIsRUFBNEI7QUFDMUJtQixJQUFBQSxPQUFPO0FBQ1IsR0FGRCxNQUVPO0FBQ0wsUUFBSXJCLFFBQUo7QUFESyxxQkFFc0JjLFNBRnRCO0FBRUpkLElBQUFBLFFBRkk7QUFFU2MsSUFBQUEsU0FGVDtBQUdMLFFBQUllLFFBQVEsR0FBRzdCLFFBQVEsTUFBUixTQUFZWSxJQUFaLENBQWY7O0FBRUEsUUFBSWlCLFFBQUosRUFBYztBQUNaLGFBQU9ULE9BQU8sQ0FBQ0MsT0FBUixDQUFnQlEsUUFBaEIsRUFBMEJYLElBQTFCLENBQStCO0FBQUEsZUFBTU0sV0FBVyxDQUFDVixTQUFELEVBQVlGLElBQVosRUFBa0JTLE9BQWxCLEVBQTJCRSxNQUEzQixDQUFqQjtBQUFBLE9BQS9CLEVBQW9GSixLQUFwRixDQUEwRixVQUFBVyxLQUFLO0FBQUEsZUFBSVAsTUFBTSxDQUFDTyxLQUFELENBQVY7QUFBQSxPQUEvRixDQUFQO0FBQ0QsS0FGRCxNQUVPO0FBQ0xOLE1BQUFBLFdBQVcsQ0FBQ1YsU0FBRCxFQUFZRixJQUFaLEVBQWtCUyxPQUFsQixFQUEyQkUsTUFBM0IsQ0FBWDtBQUNEO0FBQ0Y7QUFDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPcmJpdCBmcm9tICcuL21haW4nO1xuaW1wb3J0IE5vdGlmaWVyIGZyb20gJy4vbm90aWZpZXInO1xuY29uc3Qge1xuICBkZXByZWNhdGVcbn0gPSBPcmJpdDtcbmV4cG9ydCBjb25zdCBFVkVOVEVEID0gJ19fZXZlbnRlZF9fJztcbi8qKlxuICogSGFzIGEgY2xhc3MgYmVlbiBkZWNvcmF0ZWQgYXMgYEBldmVudGVkYD9cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gaXNFdmVudGVkKG9iaikge1xuICByZXR1cm4gISFvYmpbRVZFTlRFRF07XG59XG4vKipcbiAqIE1hcmtzIGEgY2xhc3MgYXMgZXZlbnRlZC5cbiAqXG4gKiBBbiBldmVudGVkIGNsYXNzIHNob3VsZCBhbHNvIGltcGxlbWVudCB0aGUgYEV2ZW50ZWRgIGludGVyZmFjZS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXZlbnRlZCwgRXZlbnRlZCB9IGZyb20gJ0BvcmJpdC9jb3JlJztcbiAqXG4gKiBAZXZlbnRlZFxuICogY2xhc3MgU291cmNlIGltcGxlbWVudHMgRXZlbnRlZCB7XG4gKiAgIC4uLlxuICogfVxuICogYGBgXG4gKlxuICogTGlzdGVuZXJzIGNhbiB0aGVuIHJlZ2lzdGVyIHRoZW1zZWx2ZXMgZm9yIHBhcnRpY3VsYXIgZXZlbnRzIHdpdGggYG9uYDpcbiAqXG4gKiBgYGB0c1xuICogbGV0IHNvdXJjZSA9IG5ldyBTb3VyY2UoKTtcbiAqXG4gKiBmdW5jdGlvbiBsaXN0ZW5lcjEobWVzc2FnZTogc3RyaW5nKSB7XG4gKiAgIGNvbnNvbGUubG9nKCdsaXN0ZW5lcjEgaGVhcmQgJyArIG1lc3NhZ2UpO1xuICogfTtcbiAqIGZ1bmN0aW9uIGxpc3RlbmVyMihtZXNzYWdlOiBzdHJpbmcpIHtcbiAqICAgY29uc29sZS5sb2coJ2xpc3RlbmVyMiBoZWFyZCAnICsgbWVzc2FnZSk7XG4gKiB9O1xuICpcbiAqIHNvdXJjZS5vbignZ3JlZXRpbmcnLCBsaXN0ZW5lcjEpO1xuICogc291cmNlLm9uKCdncmVldGluZycsIGxpc3RlbmVyMik7XG4gKlxuICogZXZlbnRlZC5lbWl0KCdncmVldGluZycsICdoZWxsbycpOyAvLyBsb2dzIFwibGlzdGVuZXIxIGhlYXJkIGhlbGxvXCIgYW5kXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgXCJsaXN0ZW5lcjIgaGVhcmQgaGVsbG9cIlxuICogYGBgXG4gKlxuICogTGlzdGVuZXJzIGNhbiBiZSB1bnJlZ2lzdGVyZWQgZnJvbSBldmVudHMgYXQgYW55IHRpbWUgd2l0aCBgb2ZmYDpcbiAqXG4gKiBgYGB0c1xuICogc291cmNlLm9mZignZ3JlZXRpbmcnLCBsaXN0ZW5lcjIpO1xuICogYGBgXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZXZlbnRlZChLbGFzcykge1xuICBsZXQgcHJvdG8gPSBLbGFzcy5wcm90b3R5cGU7XG5cbiAgaWYgKGlzRXZlbnRlZChwcm90bykpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBwcm90b1tFVkVOVEVEXSA9IHRydWU7XG5cbiAgcHJvdG8ub24gPSBmdW5jdGlvbiAoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgZGVwcmVjYXRlKCdgYmluZGluZ2AgYXJndW1lbnQgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCB3aGVuIGNvbmZpZ3VyaW5nIGBFdmVudGVkYCBsaXN0ZW5lcnMuIFBsZWFzZSBwcmUtYmluZCBsaXN0ZW5lcnMgYmVmb3JlIGNhbGxpbmcgYG9uYC4nKTtcbiAgICB9XG5cbiAgICBub3RpZmllckZvckV2ZW50KHRoaXMsIGV2ZW50TmFtZSwgdHJ1ZSkuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICB9O1xuXG4gIHByb3RvLm9mZiA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICBkZXByZWNhdGUoJ2BiaW5kaW5nYCBhcmd1bWVudCBpcyBubyBsb25nZXIgc3VwcG9ydGVkIHdoZW4gY29uZmlndXJpbmcgYEV2ZW50ZWRgIGxpc3RlbmVycy4gUGxlYXNlIHByZS1iaW5kIGxpc3RlbmVycyBiZWZvcmUgY2FsbGluZyBgb2ZmYC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBub3RpZmllciA9IG5vdGlmaWVyRm9yRXZlbnQodGhpcywgZXZlbnROYW1lKTtcblxuICAgIGlmIChub3RpZmllcikge1xuICAgICAgaWYgKGxpc3RlbmVyKSB7XG4gICAgICAgIG5vdGlmaWVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlbW92ZU5vdGlmaWVyRm9yRXZlbnQodGhpcywgZXZlbnROYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcHJvdG8ub25lID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgIGRlcHJlY2F0ZSgnYGJpbmRpbmdgIGFyZ3VtZW50IGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgd2hlbiBjb25maWd1cmluZyBgRXZlbnRlZGAgbGlzdGVuZXJzLiBQbGVhc2UgcHJlLWJpbmQgbGlzdGVuZXJzIGJlZm9yZSBjYWxsaW5nIGBvZmZgLicpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vdGlmaWVyID0gbm90aWZpZXJGb3JFdmVudCh0aGlzLCBldmVudE5hbWUsIHRydWUpO1xuXG4gICAgY29uc3QgY2FsbE9uY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBsaXN0ZW5lciguLi5hcmd1bWVudHMpO1xuICAgICAgbm90aWZpZXIucmVtb3ZlTGlzdGVuZXIoY2FsbE9uY2UpO1xuICAgIH07XG5cbiAgICBub3RpZmllci5hZGRMaXN0ZW5lcihjYWxsT25jZSk7XG4gIH07XG5cbiAgcHJvdG8uZW1pdCA9IGZ1bmN0aW9uIChldmVudE5hbWUsIC4uLmFyZ3MpIHtcbiAgICBsZXQgbm90aWZpZXIgPSBub3RpZmllckZvckV2ZW50KHRoaXMsIGV2ZW50TmFtZSk7XG5cbiAgICBpZiAobm90aWZpZXIpIHtcbiAgICAgIG5vdGlmaWVyLmVtaXQuYXBwbHkobm90aWZpZXIsIGFyZ3MpO1xuICAgIH1cbiAgfTtcblxuICBwcm90by5saXN0ZW5lcnMgPSBmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgbGV0IG5vdGlmaWVyID0gbm90aWZpZXJGb3JFdmVudCh0aGlzLCBldmVudE5hbWUpO1xuICAgIHJldHVybiBub3RpZmllciA/IG5vdGlmaWVyLmxpc3RlbmVycyA6IFtdO1xuICB9O1xufVxuLyoqXG4gKiBTZXR0bGUgYW55IHByb21pc2VzIHJldHVybmVkIGJ5IGV2ZW50IGxpc3RlbmVycyBpbiBzZXJpZXMuXG4gKlxuICogSWYgYW55IGVycm9ycyBhcmUgZW5jb3VudGVyZWQgZHVyaW5nIHByb2Nlc3NpbmcsIHRoZXkgd2lsbCBiZSBpZ25vcmVkLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXR0bGVJblNlcmllcyhvYmosIGV2ZW50TmFtZSwgLi4uYXJncykge1xuICBjb25zdCBsaXN0ZW5lcnMgPSBvYmoubGlzdGVuZXJzKGV2ZW50TmFtZSk7XG4gIHJldHVybiBsaXN0ZW5lcnMucmVkdWNlKChjaGFpbiwgbGlzdGVuZXIpID0+IHtcbiAgICByZXR1cm4gY2hhaW4udGhlbigoKSA9PiBsaXN0ZW5lciguLi5hcmdzKSkuY2F0Y2goKCkgPT4ge30pO1xuICB9LCBQcm9taXNlLnJlc29sdmUoKSk7XG59XG4vKipcbiAqIEZ1bGZpbGwgYW55IHByb21pc2VzIHJldHVybmVkIGJ5IGV2ZW50IGxpc3RlbmVycyBpbiBzZXJpZXMuXG4gKlxuICogUHJvY2Vzc2luZyB3aWxsIHN0b3AgaWYgYW4gZXJyb3IgaXMgZW5jb3VudGVyZWQgYW5kIHRoZSByZXR1cm5lZCBwcm9taXNlIHdpbGxcbiAqIGJlIHJlamVjdGVkLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBmdWxmaWxsSW5TZXJpZXMob2JqLCBldmVudE5hbWUsIC4uLmFyZ3MpIHtcbiAgY29uc3QgbGlzdGVuZXJzID0gb2JqLmxpc3RlbmVycyhldmVudE5hbWUpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGZ1bGZpbGxFYWNoKGxpc3RlbmVycywgYXJncywgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmaWVyRm9yRXZlbnQob2JqZWN0LCBldmVudE5hbWUsIGNyZWF0ZUlmVW5kZWZpbmVkID0gZmFsc2UpIHtcbiAgaWYgKG9iamVjdC5fZXZlbnRlZE5vdGlmaWVycyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgb2JqZWN0Ll9ldmVudGVkTm90aWZpZXJzID0ge307XG4gIH1cblxuICBsZXQgbm90aWZpZXIgPSBvYmplY3QuX2V2ZW50ZWROb3RpZmllcnNbZXZlbnROYW1lXTtcblxuICBpZiAoIW5vdGlmaWVyICYmIGNyZWF0ZUlmVW5kZWZpbmVkKSB7XG4gICAgbm90aWZpZXIgPSBvYmplY3QuX2V2ZW50ZWROb3RpZmllcnNbZXZlbnROYW1lXSA9IG5ldyBOb3RpZmllcigpO1xuICB9XG5cbiAgcmV0dXJuIG5vdGlmaWVyO1xufVxuXG5mdW5jdGlvbiByZW1vdmVOb3RpZmllckZvckV2ZW50KG9iamVjdCwgZXZlbnROYW1lKSB7XG4gIGlmIChvYmplY3QuX2V2ZW50ZWROb3RpZmllcnMgJiYgb2JqZWN0Ll9ldmVudGVkTm90aWZpZXJzW2V2ZW50TmFtZV0pIHtcbiAgICBkZWxldGUgb2JqZWN0Ll9ldmVudGVkTm90aWZpZXJzW2V2ZW50TmFtZV07XG4gIH1cbn1cblxuZnVuY3Rpb24gZnVsZmlsbEVhY2gobGlzdGVuZXJzLCBhcmdzLCByZXNvbHZlLCByZWplY3QpIHtcbiAgaWYgKGxpc3RlbmVycy5sZW5ndGggPT09IDApIHtcbiAgICByZXNvbHZlKCk7XG4gIH0gZWxzZSB7XG4gICAgbGV0IGxpc3RlbmVyO1xuICAgIFtsaXN0ZW5lciwgLi4ubGlzdGVuZXJzXSA9IGxpc3RlbmVycztcbiAgICBsZXQgcmVzcG9uc2UgPSBsaXN0ZW5lciguLi5hcmdzKTtcblxuICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXNwb25zZSkudGhlbigoKSA9PiBmdWxmaWxsRWFjaChsaXN0ZW5lcnMsIGFyZ3MsIHJlc29sdmUsIHJlamVjdCkpLmNhdGNoKGVycm9yID0+IHJlamVjdChlcnJvcikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmdWxmaWxsRWFjaChsaXN0ZW5lcnMsIGFyZ3MsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgfVxuICB9XG59Il19