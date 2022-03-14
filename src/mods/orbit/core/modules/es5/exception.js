function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _defaults(subClass, superClass); }

/**
 * Base exception class.
 */
export var Exception = function Exception(message) {
  this.message = message;
  this.error = new Error(this.message);
  this.stack = this.error.stack;
};
/**
 * Exception raised when an item does not exist in a log.
 */

export var NotLoggedException =
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

export var OutOfRangeException =
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV4Y2VwdGlvbi5qcyJdLCJuYW1lcyI6WyJFeGNlcHRpb24iLCJtZXNzYWdlIiwiZXJyb3IiLCJFcnJvciIsInN0YWNrIiwiTm90TG9nZ2VkRXhjZXB0aW9uIiwiaWQiLCJPdXRPZlJhbmdlRXhjZXB0aW9uIiwidmFsdWUiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7O0FBR0EsV0FBYUEsU0FBYixHQUNFLG1CQUFZQyxPQUFaLEVBQXFCO0FBQ25CLE9BQUtBLE9BQUwsR0FBZUEsT0FBZjtBQUNBLE9BQUtDLEtBQUwsR0FBYSxJQUFJQyxLQUFKLENBQVUsS0FBS0YsT0FBZixDQUFiO0FBQ0EsT0FBS0csS0FBTCxHQUFhLEtBQUtGLEtBQUwsQ0FBV0UsS0FBeEI7QUFDRCxDQUxIO0FBUUE7Ozs7QUFJQSxXQUFhQyxrQkFBYjtBQUFBO0FBQUE7QUFBQTs7QUFDRSw4QkFBWUMsRUFBWixFQUFnQjtBQUFBOztBQUNkLDBEQUE0QkEsRUFBNUI7QUFDQSxVQUFLQSxFQUFMLEdBQVVBLEVBQVY7QUFGYztBQUdmOztBQUpIO0FBQUEsRUFBd0NOLFNBQXhDO0FBT0E7Ozs7QUFJQSxXQUFhTyxtQkFBYjtBQUFBO0FBQUE7QUFBQTs7QUFDRSwrQkFBWUMsS0FBWixFQUFtQjtBQUFBOztBQUNqQix1REFBdUJBLEtBQXZCO0FBQ0EsV0FBS0EsS0FBTCxHQUFhQSxLQUFiO0FBRmlCO0FBR2xCOztBQUpIO0FBQUEsRUFBeUNSLFNBQXpDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBCYXNlIGV4Y2VwdGlvbiBjbGFzcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIHRoaXMuZXJyb3IgPSBuZXcgRXJyb3IodGhpcy5tZXNzYWdlKTtcbiAgICB0aGlzLnN0YWNrID0gdGhpcy5lcnJvci5zdGFjaztcbiAgfVxuXG59XG4vKipcbiAqIEV4Y2VwdGlvbiByYWlzZWQgd2hlbiBhbiBpdGVtIGRvZXMgbm90IGV4aXN0IGluIGEgbG9nLlxuICovXG5cbmV4cG9ydCBjbGFzcyBOb3RMb2dnZWRFeGNlcHRpb24gZXh0ZW5kcyBFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihpZCkge1xuICAgIHN1cGVyKGBBY3Rpb24gbm90IGxvZ2dlZDogJHtpZH1gKTtcbiAgICB0aGlzLmlkID0gaWQ7XG4gIH1cblxufVxuLyoqXG4gKiBFeGNlcHRpb24gcmFpc2VkIHdoZW4gYSB2YWx1ZSBpcyBvdXRzaWRlIGFuIGFsbG93ZWQgcmFuZ2UuXG4gKi9cblxuZXhwb3J0IGNsYXNzIE91dE9mUmFuZ2VFeGNlcHRpb24gZXh0ZW5kcyBFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3Rvcih2YWx1ZSkge1xuICAgIHN1cGVyKGBPdXQgb2YgcmFuZ2U6ICR7dmFsdWV9YCk7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB9XG5cbn0iXX0=