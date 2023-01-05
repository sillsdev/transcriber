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
Object.defineProperty(exports, '__esModule', { value: true });
var React = require('react');
var methods_1 = require('../methods');
var component_will_unmount_1 = require('./component-will-unmount');
var component_will_update_1 = require('./component-will-update');
var should_component_update_1 = require('./should-component-update');
function bindLifecycleMethods(that) {
  if (!component_will_unmount_1.componentWillUnmountPrototype(that)) {
    that.componentWillUnmount = function () {
      methods_1.ReactNComponentWillUnmount(that);
    };
  }
  var _a = __read(
      React.version.split('.').map(function (v) {
        return parseInt(v);
      }),
      2
    ),
    rVerMaj = _a[0],
    rVerMin = _a[1];
  var isPureComponent =
    React.PureComponent && that instanceof React.PureComponent;
  var isUsingOldReact = rVerMaj < 16 || (rVerMaj === 16 && rVerMin < 3);
  if (
    isUsingOldReact &&
    !component_will_update_1.componentWillUpdatePrototype(that)
  ) {
    that.componentWillUpdate = function () {
      methods_1.ReactNComponentWillUpdate(that);
    };
  }
  if (
    !isUsingOldReact &&
    isPureComponent &&
    !component_will_update_1.componentWillUpdatePrototype(that)
  ) {
    that.UNSAFE_componentWillUpdate = function () {
      methods_1.ReactNComponentWillUpdate(that);
    };
  }
  if (
    !isUsingOldReact &&
    !isPureComponent &&
    !should_component_update_1.shouldComponentUpdatePrototype(that)
  ) {
    that.shouldComponentUpdate = function () {
      methods_1.ReactNShouldComponentUpdate(that);
      return true;
    };
  }
}
exports.default = bindLifecycleMethods;
