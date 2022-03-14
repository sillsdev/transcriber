function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * A `TaskProcessor` performs a `Task` by calling `perform()` on its target.
 * This is triggered by calling `process()` on the processor.
 *
 * A processor maintains a promise that represents the eventual state (resolved
 * or rejected) of the task. This promise is created upon construction, and
 * will be returned by calling `settle()`.
 *
 * A task can be re-tried by first calling `reset()` on the processor. This
 * will clear the processor's state and allow `process()` to be invoked again.
 */
var TaskProcessor =
/*#__PURE__*/
function () {
  /**
   * Creates an instance of TaskProcessor.
   */
  function TaskProcessor(target, task) {
    this.target = target;
    this.task = task;
    this.reset();
  }
  /**
   * Clears the processor state, allowing for a fresh call to `process()`.
   */


  var _proto = TaskProcessor.prototype;

  _proto.reset = function reset() {
    var _this = this;

    this._started = false;
    this._settled = false;
    this._settlement = new Promise(function (resolve, reject) {
      _this._success = function (r) {
        _this._settled = true;
        resolve(r);
      };

      _this._fail = function (e) {
        _this._settled = true;
        reject(e);
      };
    });
  }
  /**
   * Has `process` been invoked?
   */
  ;

  /**
   * The eventual result of processing.
   */
  _proto.settle = function settle() {
    return this._settlement;
  }
  /**
   * Invokes `perform` on the target.
   */
  ;

  _proto.process = function process() {
    if (!this._started) {
      this._started = true;
      this.target.perform(this.task).then(this._success, this._fail);
    }

    return this.settle();
  }
  /**
   * Reject the current promise with a specific error.
   *
   * @param e Error associated with rejection
   */
  ;

  _proto.reject = function reject(e) {
    if (this._settled) {
      throw new Error('TaskProcessor#reject can not be invoked when processing has already settled.');
    } else {
      this._fail(e);
    }
  };

  _createClass(TaskProcessor, [{
    key: "started",
    get: function () {
      return this._started;
    }
    /**
     * Has promise settled, either via `process` or `reject`?
     */

  }, {
    key: "settled",
    get: function () {
      return this._settled;
    }
  }]);

  return TaskProcessor;
}();

export { TaskProcessor as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRhc2stcHJvY2Vzc29yLmpzIl0sIm5hbWVzIjpbIlRhc2tQcm9jZXNzb3IiLCJ0YXJnZXQiLCJ0YXNrIiwicmVzZXQiLCJfc3RhcnRlZCIsIl9zZXR0bGVkIiwiX3NldHRsZW1lbnQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIl9zdWNjZXNzIiwiciIsIl9mYWlsIiwiZSIsInNldHRsZSIsInByb2Nlc3MiLCJwZXJmb3JtIiwidGhlbiIsIkVycm9yIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7Ozs7Ozs7O0lBV3FCQSxhOzs7QUFDbkI7OztBQUdBLHlCQUFZQyxNQUFaLEVBQW9CQyxJQUFwQixFQUEwQjtBQUN4QixTQUFLRCxNQUFMLEdBQWNBLE1BQWQ7QUFDQSxTQUFLQyxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLQyxLQUFMO0FBQ0Q7QUFDRDs7Ozs7OztTQUtBQSxLLEdBQUEsaUJBQVE7QUFBQTs7QUFDTixTQUFLQyxRQUFMLEdBQWdCLEtBQWhCO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQixLQUFoQjtBQUNBLFNBQUtDLFdBQUwsR0FBbUIsSUFBSUMsT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBVUMsTUFBVixFQUFxQjtBQUNsRCxNQUFBLEtBQUksQ0FBQ0MsUUFBTCxHQUFnQixVQUFBQyxDQUFDLEVBQUk7QUFDbkIsUUFBQSxLQUFJLENBQUNOLFFBQUwsR0FBZ0IsSUFBaEI7QUFDQUcsUUFBQUEsT0FBTyxDQUFDRyxDQUFELENBQVA7QUFDRCxPQUhEOztBQUtBLE1BQUEsS0FBSSxDQUFDQyxLQUFMLEdBQWEsVUFBQUMsQ0FBQyxFQUFJO0FBQ2hCLFFBQUEsS0FBSSxDQUFDUixRQUFMLEdBQWdCLElBQWhCO0FBQ0FJLFFBQUFBLE1BQU0sQ0FBQ0ksQ0FBRCxDQUFOO0FBQ0QsT0FIRDtBQUlELEtBVmtCLENBQW5CO0FBV0Q7QUFDRDs7Ozs7QUFnQkE7OztTQUtBQyxNLEdBQUEsa0JBQVM7QUFDUCxXQUFPLEtBQUtSLFdBQVo7QUFDRDtBQUNEOzs7OztTQUtBUyxPLEdBQUEsbUJBQVU7QUFDUixRQUFJLENBQUMsS0FBS1gsUUFBVixFQUFvQjtBQUNsQixXQUFLQSxRQUFMLEdBQWdCLElBQWhCO0FBQ0EsV0FBS0gsTUFBTCxDQUFZZSxPQUFaLENBQW9CLEtBQUtkLElBQXpCLEVBQStCZSxJQUEvQixDQUFvQyxLQUFLUCxRQUF6QyxFQUFtRCxLQUFLRSxLQUF4RDtBQUNEOztBQUVELFdBQU8sS0FBS0UsTUFBTCxFQUFQO0FBQ0Q7QUFDRDs7Ozs7OztTQU9BTCxNLEdBQUEsZ0JBQU9JLENBQVAsRUFBVTtBQUNSLFFBQUksS0FBS1IsUUFBVCxFQUFtQjtBQUNqQixZQUFNLElBQUlhLEtBQUosQ0FBVSw4RUFBVixDQUFOO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsV0FBS04sS0FBTCxDQUFXQyxDQUFYO0FBQ0Q7QUFDRixHOzs7O3FCQTdDYTtBQUNaLGFBQU8sS0FBS1QsUUFBWjtBQUNEO0FBQ0Q7Ozs7OztxQkFLYztBQUNaLGFBQU8sS0FBS0MsUUFBWjtBQUNEOzs7Ozs7U0E1Q2tCTCxhIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBIGBUYXNrUHJvY2Vzc29yYCBwZXJmb3JtcyBhIGBUYXNrYCBieSBjYWxsaW5nIGBwZXJmb3JtKClgIG9uIGl0cyB0YXJnZXQuXG4gKiBUaGlzIGlzIHRyaWdnZXJlZCBieSBjYWxsaW5nIGBwcm9jZXNzKClgIG9uIHRoZSBwcm9jZXNzb3IuXG4gKlxuICogQSBwcm9jZXNzb3IgbWFpbnRhaW5zIGEgcHJvbWlzZSB0aGF0IHJlcHJlc2VudHMgdGhlIGV2ZW50dWFsIHN0YXRlIChyZXNvbHZlZFxuICogb3IgcmVqZWN0ZWQpIG9mIHRoZSB0YXNrLiBUaGlzIHByb21pc2UgaXMgY3JlYXRlZCB1cG9uIGNvbnN0cnVjdGlvbiwgYW5kXG4gKiB3aWxsIGJlIHJldHVybmVkIGJ5IGNhbGxpbmcgYHNldHRsZSgpYC5cbiAqXG4gKiBBIHRhc2sgY2FuIGJlIHJlLXRyaWVkIGJ5IGZpcnN0IGNhbGxpbmcgYHJlc2V0KClgIG9uIHRoZSBwcm9jZXNzb3IuIFRoaXNcbiAqIHdpbGwgY2xlYXIgdGhlIHByb2Nlc3NvcidzIHN0YXRlIGFuZCBhbGxvdyBgcHJvY2VzcygpYCB0byBiZSBpbnZva2VkIGFnYWluLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUYXNrUHJvY2Vzc29yIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgVGFza1Byb2Nlc3Nvci5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHRhcmdldCwgdGFzaykge1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIHRoaXMudGFzayA9IHRhc2s7XG4gICAgdGhpcy5yZXNldCgpO1xuICB9XG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIHByb2Nlc3NvciBzdGF0ZSwgYWxsb3dpbmcgZm9yIGEgZnJlc2ggY2FsbCB0byBgcHJvY2VzcygpYC5cbiAgICovXG5cblxuICByZXNldCgpIHtcbiAgICB0aGlzLl9zdGFydGVkID0gZmFsc2U7XG4gICAgdGhpcy5fc2V0dGxlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3NldHRsZW1lbnQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLl9zdWNjZXNzID0gciA9PiB7XG4gICAgICAgIHRoaXMuX3NldHRsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlKHIpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5fZmFpbCA9IGUgPT4ge1xuICAgICAgICB0aGlzLl9zZXR0bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogSGFzIGBwcm9jZXNzYCBiZWVuIGludm9rZWQ/XG4gICAqL1xuXG5cbiAgZ2V0IHN0YXJ0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N0YXJ0ZWQ7XG4gIH1cbiAgLyoqXG4gICAqIEhhcyBwcm9taXNlIHNldHRsZWQsIGVpdGhlciB2aWEgYHByb2Nlc3NgIG9yIGByZWplY3RgP1xuICAgKi9cblxuXG4gIGdldCBzZXR0bGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9zZXR0bGVkO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgZXZlbnR1YWwgcmVzdWx0IG9mIHByb2Nlc3NpbmcuXG4gICAqL1xuXG5cbiAgc2V0dGxlKCkge1xuICAgIHJldHVybiB0aGlzLl9zZXR0bGVtZW50O1xuICB9XG4gIC8qKlxuICAgKiBJbnZva2VzIGBwZXJmb3JtYCBvbiB0aGUgdGFyZ2V0LlxuICAgKi9cblxuXG4gIHByb2Nlc3MoKSB7XG4gICAgaWYgKCF0aGlzLl9zdGFydGVkKSB7XG4gICAgICB0aGlzLl9zdGFydGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMudGFyZ2V0LnBlcmZvcm0odGhpcy50YXNrKS50aGVuKHRoaXMuX3N1Y2Nlc3MsIHRoaXMuX2ZhaWwpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnNldHRsZSgpO1xuICB9XG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIGN1cnJlbnQgcHJvbWlzZSB3aXRoIGEgc3BlY2lmaWMgZXJyb3IuXG4gICAqXG4gICAqIEBwYXJhbSBlIEVycm9yIGFzc29jaWF0ZWQgd2l0aCByZWplY3Rpb25cbiAgICovXG5cblxuICByZWplY3QoZSkge1xuICAgIGlmICh0aGlzLl9zZXR0bGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Rhc2tQcm9jZXNzb3IjcmVqZWN0IGNhbiBub3QgYmUgaW52b2tlZCB3aGVuIHByb2Nlc3NpbmcgaGFzIGFscmVhZHkgc2V0dGxlZC4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZmFpbChlKTtcbiAgICB9XG4gIH1cblxufSJdfQ==