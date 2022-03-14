"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OutOfRangeException = exports.NotLoggedException = exports.Exception = void 0;

function _defaults(obj, defaults) {
  var keys = Object.getOwnPropertyNames(defaults);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = Object.getOwnPropertyDescriptor(defaults, key);

    if (value && value.configurable && obj[key] === undefined) {
      Object.defineProperty(obj, key, value);
    }
  }

  return obj;
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;

  _defaults(subClass, superClass);
}
/**
 * Base exception class.
 */


var Exception = function Exception(message) {
  this.message = message;
  this.error = new Error(this.message);
  this.stack = this.error.stack;
};
/**
 * Exception raised when an item does not exist in a log.
 */


exports.Exception = Exception;

var NotLoggedException =
/*#__PURE__*/
function (_Exception) {
  _inheritsLoose(NotLoggedException, _Exception);

  function NotLoggedException(id) {
    var _this;

    _this = _Exception.call(this, "Action not logged: " + id) || this;
    _this.id = id;
    return _this;
  }

  return NotLoggedException;
}(Exception);
/**
 * Exception raised when a value is outside an allowed range.
 */


exports.NotLoggedException = NotLoggedException;

var OutOfRangeException =
/*#__PURE__*/
function (_Exception2) {
  _inheritsLoose(OutOfRangeException, _Exception2);

  function OutOfRangeException(value) {
    var _this2;

    _this2 = _Exception2.call(this, "Out of range: " + value) || this;
    _this2.value = value;
    return _this2;
  }

  return OutOfRangeException;
}(Exception);

exports.OutOfRangeException = OutOfRangeException;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV4Y2VwdGlvbi5qcyJdLCJuYW1lcyI6WyJFeGNlcHRpb24iLCJOb3RMb2dnZWRFeGNlcHRpb24iLCJPdXRPZlJhbmdlRXhjZXB0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7O0FBR0EsSUFBYUEsU0FBYixHQUNFLFNBQUEsU0FBQSxDQUFBLE9BQUEsRUFBcUI7QUFDbkIsT0FBQSxPQUFBLEdBQUEsT0FBQTtBQUNBLE9BQUEsS0FBQSxHQUFhLElBQUEsS0FBQSxDQUFVLEtBQXZCLE9BQWEsQ0FBYjtBQUNBLE9BQUEsS0FBQSxHQUFhLEtBQUEsS0FBQSxDQUFiLEtBQUE7QUFKSixDQUFBO0FBUUE7Ozs7Ozs7QUFJQSxJQUFhQyxrQkFBYjtBQUFBO0FBQUEsVUFBQSxVQUFBLEVBQUE7QUFBQSxFQUFBLGNBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsQ0FBQTs7QUFDRSxXQUFBLGtCQUFBLENBQUEsRUFBQSxFQUFnQjtBQUFBLFFBQUEsS0FBQTs7QUFDZCxJQUFBLEtBQUEsR0FBQSxVQUFBLENBQUEsSUFBQSxDQUFBLElBQUEsRUFBQSx3QkFBQSxFQUFBLEtBQUEsSUFBQTtBQUNBLElBQUEsS0FBQSxDQUFBLEVBQUEsR0FBQSxFQUFBO0FBRmMsV0FBQSxLQUFBO0FBR2Y7O0FBSkgsU0FBQSxrQkFBQTtBQUFBLENBQUEsQ0FBQSxTQUFBLENBQUE7QUFPQTs7Ozs7OztBQUlBLElBQWFDLG1CQUFiO0FBQUE7QUFBQSxVQUFBLFdBQUEsRUFBQTtBQUFBLEVBQUEsY0FBQSxDQUFBLG1CQUFBLEVBQUEsV0FBQSxDQUFBOztBQUNFLFdBQUEsbUJBQUEsQ0FBQSxLQUFBLEVBQW1CO0FBQUEsUUFBQSxNQUFBOztBQUNqQixJQUFBLE1BQUEsR0FBQSxXQUFBLENBQUEsSUFBQSxDQUFBLElBQUEsRUFBQSxtQkFBQSxLQUFBLEtBQUEsSUFBQTtBQUNBLElBQUEsTUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBO0FBRmlCLFdBQUEsTUFBQTtBQUdsQjs7QUFKSCxTQUFBLG1CQUFBO0FBQUEsQ0FBQSxDQUFBLFNBQUEsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQmFzZSBleGNlcHRpb24gY2xhc3MuXG4gKi9cbmV4cG9ydCBjbGFzcyBFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB0aGlzLmVycm9yID0gbmV3IEVycm9yKHRoaXMubWVzc2FnZSk7XG4gICAgdGhpcy5zdGFjayA9IHRoaXMuZXJyb3Iuc3RhY2s7XG4gIH1cblxufVxuLyoqXG4gKiBFeGNlcHRpb24gcmFpc2VkIHdoZW4gYW4gaXRlbSBkb2VzIG5vdCBleGlzdCBpbiBhIGxvZy5cbiAqL1xuXG5leHBvcnQgY2xhc3MgTm90TG9nZ2VkRXhjZXB0aW9uIGV4dGVuZHMgRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoaWQpIHtcbiAgICBzdXBlcihgQWN0aW9uIG5vdCBsb2dnZWQ6ICR7aWR9YCk7XG4gICAgdGhpcy5pZCA9IGlkO1xuICB9XG5cbn1cbi8qKlxuICogRXhjZXB0aW9uIHJhaXNlZCB3aGVuIGEgdmFsdWUgaXMgb3V0c2lkZSBhbiBhbGxvd2VkIHJhbmdlLlxuICovXG5cbmV4cG9ydCBjbGFzcyBPdXRPZlJhbmdlRXhjZXB0aW9uIGV4dGVuZHMgRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IodmFsdWUpIHtcbiAgICBzdXBlcihgT3V0IG9mIHJhbmdlOiAke3ZhbHVlfWApO1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG59Il19