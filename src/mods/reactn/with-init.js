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
var add_reducers_1 = require('./add-reducers');
var components_1 = require('./components');
var default_global_state_manager_1 = require('./default-global-state-manager');
function _withInit(initialGlobal, initialReducers) {
  if (initialGlobal === void 0) {
    initialGlobal = null;
  }
  if (initialReducers === void 0) {
    initialReducers = null;
  }
  return function ReactNWithInit(Component, FallbackComponent) {
    if (FallbackComponent === void 0) {
      FallbackComponent = null;
    }
    return (function (_super) {
      __extends(ReactNWithInitHoc, _super);
      function ReactNWithInitHoc() {
        var _this = (_super !== null && _super.apply(this, arguments)) || this;
        _this.state = {
          global: !Boolean(initialGlobal),
          reducers: !Boolean(initialReducers),
        };
        return _this;
      }
      ReactNWithInitHoc.prototype.componentDidMount = function () {
        var _this = this;
        if (initialGlobal) {
          this.setGlobal(initialGlobal, function () {
            _this.setState({ global: true });
          });
        }
        if (initialReducers) {
          add_reducers_1.default(
            default_global_state_manager_1.default,
            initialReducers
          );
          this.setState({ reducers: true });
        }
      };
      ReactNWithInitHoc.prototype.render = function () {
        if (!this.state.global || !this.state.reducers) {
          if (FallbackComponent) {
            return React.createElement(
              FallbackComponent,
              __assign({}, this.props)
            );
          }
          return null;
        }
        return React.createElement(Component, __assign({}, this.props));
      };
      return ReactNWithInitHoc;
    })(components_1.ReactNComponent);
  };
}
exports.default = _withInit;
