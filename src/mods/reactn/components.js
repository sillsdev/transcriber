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
var methods_1 = require('./methods');
var bind_lifecycle_methods_1 = require('./utils/bind-lifecycle-methods');
var isComponentDidMount = false;
var isComponentDidUpdate = false;
var isSetGlobalCallback = false;
var ReactPureComponent = React.PureComponent || React.Component;
var ReactNComponent = (function (_super) {
  __extends(ReactNComponent, _super);
  function ReactNComponent(props, context) {
    var _this = _super.call(this, props, context) || this;
    _this._globalCallback = _this._globalCallback.bind(_this);
    bind_lifecycle_methods_1.default(_this);
    return _this;
  }
  Object.defineProperty(ReactNComponent.prototype, 'dispatch', {
    get: function () {
      return methods_1.ReactNDispatch();
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(ReactNComponent.prototype, 'global', {
    get: function () {
      return methods_1.ReactNGlobal(this);
    },
    enumerable: true,
    configurable: true,
  });
  ReactNComponent.prototype.setGlobal = function (newGlobalState, callback) {
    if (callback === void 0) {
      callback = null;
    }
    return methods_1.ReactNSetGlobal(
      newGlobalState,
      callback,
      !isComponentDidMount && !isComponentDidUpdate && !isSetGlobalCallback
    );
  };
  ReactNComponent.prototype._globalCallback = function () {
    return methods_1.ReactNGlobalCallback(this);
  };
  return ReactNComponent;
})(React.Component);
exports.ReactNComponent = ReactNComponent;
var ReactNPureComponent = (function (_super) {
  __extends(ReactNPureComponent, _super);
  function ReactNPureComponent(props, context) {
    var _this = _super.call(this, props, context) || this;
    _this._globalCallback = _this._globalCallback.bind(_this);
    bind_lifecycle_methods_1.default(_this);
    return _this;
  }
  Object.defineProperty(ReactNPureComponent.prototype, 'dispatch', {
    get: function () {
      return methods_1.ReactNDispatch();
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(ReactNPureComponent.prototype, 'global', {
    get: function () {
      return methods_1.ReactNGlobal(this);
    },
    enumerable: true,
    configurable: true,
  });
  ReactNPureComponent.prototype.setGlobal = function (
    newGlobalState,
    callback
  ) {
    if (callback === void 0) {
      callback = null;
    }
    return methods_1.ReactNSetGlobal(
      newGlobalState,
      callback,
      !isComponentDidMount && !isComponentDidUpdate && !isSetGlobalCallback
    );
  };
  ReactNPureComponent.prototype._globalCallback = function () {
    return methods_1.ReactNGlobalCallback(this);
  };
  return ReactNPureComponent;
})(ReactPureComponent);
exports.ReactNPureComponent = ReactNPureComponent;
