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
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
Object.defineProperty(exports, '__esModule', { value: true });
var React = require('react');
var components_1 = require('./components');
var context_1 = require('./context');
var global_state_manager_1 = require('./global-state-manager');
var methods_1 = require('./methods');
var get_global_state_manager_1 = require('./utils/get-global-state-manager');
var componentName = function (Component) {
  return typeof Component === 'string'
    ? Component
    : Component.displayName || Component.name;
};
var isComponentDidMount = false;
var isComponentDidUpdate = false;
var isSetGlobalCallback = false;
function _withGlobal(globalStateManager, getter, setter) {
  if (globalStateManager === void 0) {
    globalStateManager = null;
  }
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
  return function ReactNWithGlobal(Component) {
    var _a;
    return (
      (_a = (function (_super) {
        __extends(ReactNWithGlobalHoc, _super);
        function ReactNWithGlobalHoc() {
          var _this =
            (_super !== null && _super.apply(this, arguments)) || this;
          _this.setGlobal = function (newGlobalState, callback) {
            if (callback === void 0) {
              callback = null;
            }
            return methods_1.ReactNSetGlobal(
              newGlobalState,
              callback,
              !isComponentDidMount &&
                !isComponentDidUpdate &&
                !isSetGlobalCallback,
              _this.globalStateManager
            );
          };
          return _this;
        }
        Object.defineProperty(ReactNWithGlobalHoc.prototype, 'dispatch', {
          get: function () {
            return this.globalStateManager.dispatchers;
          },
          enumerable: true,
          configurable: true,
        });
        Object.defineProperty(ReactNWithGlobalHoc.prototype, 'global', {
          get: function () {
            return methods_1.ReactNGlobal(this, this.globalStateManager);
          },
          enumerable: true,
          configurable: true,
        });
        Object.defineProperty(
          ReactNWithGlobalHoc.prototype,
          'globalStateManager',
          {
            get: function () {
              if (globalStateManager) {
                return globalStateManager;
              }
              if (this.context instanceof global_state_manager_1.default) {
                return this.context;
              }
              return get_global_state_manager_1.default();
            },
            enumerable: true,
            configurable: true,
          }
        );
        ReactNWithGlobalHoc.prototype.render = function () {
          var lowerOrderProps = __assign(
            __assign(
              __assign({}, this.props),
              getter(this.global, this.dispatch, this.props)
            ),
            setter(this.setGlobal, this.dispatch, this.props)
          );
          return React.createElement(Component, __assign({}, lowerOrderProps));
        };
        return ReactNWithGlobalHoc;
      })(components_1.ReactNComponent)),
      (_a.contextType = context_1.default),
      (_a.displayName = componentName(Component) + '-ReactN'),
      _a
    );
  };
}
exports.default = _withGlobal;
