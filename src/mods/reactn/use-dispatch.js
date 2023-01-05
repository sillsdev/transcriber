var __read =
  (this && this.__read) ||
  function (o, n) {
    var m = typeof Symbol === 'function' && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
      r,
      ar = [],
      e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error: error };
    } finally {
      try {
        if (r && !r.done && (m = i['return'])) m.call(i);
      } finally {
        if (e) throw e.error;
      }
    }
    return ar;
  };
var __spread =
  (this && this.__spread) ||
  function () {
    for (var ar = [], i = 0; i < arguments.length; i++)
      ar = ar.concat(__read(arguments[i]));
    return ar;
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = require('react');
var use_force_update_1 = require('use-force-update');
var context_1 = require('./context');
var default_global_state_manager_1 = require('./default-global-state-manager');
var is_property_reducer_1 = require('./utils/is-property-reducer');
var react_hooks_error_1 = require('./utils/react-hooks-error');
function _useDispatch(overrideGlobalStateManager, reducer, property) {
  if (!react_1.useContext) {
    throw react_hooks_error_1.default;
  }
  var forceUpdate = use_force_update_1.default();
  var globalStateManager =
    overrideGlobalStateManager ||
    react_1.useContext(context_1.default) ||
    default_global_state_manager_1.default;
  if (typeof reducer === 'undefined') {
    return globalStateManager.dispatcherMap;
  }
  if (typeof reducer === 'function') {
    if (is_property_reducer_1.default(reducer, property)) {
      var newReducer = function (global, _dispatch) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
          args[_i - 2] = arguments[_i];
        }
        var newGlobalState = Object.create(null);
        newGlobalState[property] = reducer.apply(
          void 0,
          __spread([global[property]], args)
        );
        return newGlobalState;
      };
      var propertyDispatcher_1 = globalStateManager.createDispatcher(
        newReducer,
        reducer.name
      );
      Object.defineProperty(propertyDispatcher_1, 0, {
        configurable: true,
        enumerable: true,
        get: function () {
          globalStateManager.addPropertyListener(property, forceUpdate);
          return globalStateManager.state[property];
        },
      });
      propertyDispatcher_1[1] = propertyDispatcher_1;
      var propertyDispatcherSlice = function (start, end) {
        var values = [propertyDispatcher_1[0], propertyDispatcher_1[1]];
        return values.slice.apply(values, [start, end]);
      };
      propertyDispatcher_1.slice = propertyDispatcherSlice;
      var propertyDispatcherIterator = function () {
        var _a;
        var index = 0;
        var propertyDispatcherIteratorNext = function () {
          if (index < 2) {
            return {
              done: false,
              value: propertyDispatcher_1[index++],
            };
          }
          index = 0;
          return {
            done: true,
            value: undefined,
          };
        };
        return (
          (_a = {}),
          (_a[Symbol.iterator] = propertyDispatcher_1[Symbol.iterator]),
          (_a.next = propertyDispatcherIteratorNext),
          _a
        );
      };
      propertyDispatcher_1[Symbol.iterator] = propertyDispatcherIterator;
      return propertyDispatcher_1;
    }
    return globalStateManager.createDispatcher(reducer);
  }
  return globalStateManager.getDispatcher(reducer);
}
exports.default = _useDispatch;
