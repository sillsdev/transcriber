var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
var React = require('react');
var context_1 = require('./context');
var add_reducer_1 = require('./add-reducer');
var add_reducers_1 = require('./add-reducers');
var global_state_manager_1 = require('./global-state-manager');
var set_global_1 = require('./set-global');
var use_dispatch_1 = require('./use-dispatch');
var use_global_1 = require('./use-global');
var is_property_reducer_1 = require('./utils/is-property-reducer');
var react_context_error_1 = require('./utils/react-context-error');
var with_global_1 = require('./with-global');
function _createProvider(initialState, initialReducers) {
  if (initialState === void 0) {
    initialState = Object.create(null);
  }
  if (initialReducers === void 0) {
    initialReducers = Object.create(null);
  }
  if (context_1.default === null) {
    throw react_context_error_1.default;
  }
  var globalStateManager = new global_state_manager_1.default(
    initialState,
    initialReducers
  );
  return (function (_super) {
    __extends(ReactNProvider, _super);
    function ReactNProvider() {
      return (_super !== null && _super.apply(this, arguments)) || this;
    }
    ReactNProvider.addCallback = function (f) {
      return globalStateManager.addCallback(f);
    };
    ReactNProvider.addReducer = function (name, reducer) {
      return add_reducer_1.default(globalStateManager, name, reducer);
    };
    ReactNProvider.addReducers = function (reducers) {
      return add_reducers_1.default(globalStateManager, reducers);
    };
    Object.defineProperty(ReactNProvider, 'dispatch', {
      get: function () {
        return globalStateManager.dispatchers;
      },
      enumerable: true,
      configurable: true,
    });
    Object.defineProperty(ReactNProvider, 'dispatcherMap', {
      get: function () {
        return globalStateManager.dispatcherMap;
      },
      enumerable: true,
      configurable: true,
    });
    ReactNProvider.getDispatch = function () {
      return globalStateManager.dispatchers;
    };
    ReactNProvider.getGlobal = function () {
      return globalStateManager.state;
    };
    Object.defineProperty(ReactNProvider, 'global', {
      get: function () {
        return globalStateManager.state;
      },
      enumerable: true,
      configurable: true,
    });
    ReactNProvider.removeCallback = function (callback) {
      return globalStateManager.removeCallback(callback);
    };
    ReactNProvider.reset = function () {
      return globalStateManager.reset();
    };
    ReactNProvider.setGlobal = function (newGlobalState, callback) {
      if (callback === void 0) {
        callback = null;
      }
      return set_global_1.default(globalStateManager, newGlobalState, callback);
    };
    ReactNProvider.useDispatch = function (reducer, property) {
      if (typeof reducer === 'function') {
        if (is_property_reducer_1.default(reducer, property)) {
          return use_dispatch_1.default(globalStateManager, reducer, property);
        }
        return use_dispatch_1.default(globalStateManager, reducer);
      }
      return use_dispatch_1.default(globalStateManager, reducer);
    };
    ReactNProvider.useGlobal = function (property) {
      return use_global_1.default(globalStateManager, property);
    };
    ReactNProvider.withGlobal = function (getter, setter) {
      if (getter === void 0) {
        getter = function (global) {
          return global;
        };
      }
      if (setter === void 0) {
        setter = function () {
          return null;
        };
      }
      return with_global_1.default(globalStateManager, getter, setter);
    };
    ReactNProvider.prototype.render = function () {
      return React.createElement(
        context_1.default.Provider,
        { value: globalStateManager },
        this.props.children
      );
    };
    return ReactNProvider;
  })(React.Component);
}
exports.default = _createProvider;
