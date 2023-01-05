Object.defineProperty(exports, '__esModule', { value: true });
var methods_1 = require('../methods');
exports.componentWillUnmountPrototype = function (that) {
  var proto = Object.getPrototypeOf(that);
  if (Object.prototype.hasOwnProperty.call(proto, 'componentWillUnmount')) {
    that.componentWillUnmount = function () {
      methods_1.ReactNComponentWillUnmount(that);
      proto.componentWillUnmount.bind(that)();
    };
    return true;
  }
  return false;
};
