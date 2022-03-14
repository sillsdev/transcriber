"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}
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

exports.default = TaskProcessor;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRhc2stcHJvY2Vzc29yLmpzIl0sIm5hbWVzIjpbIlRhc2tQcm9jZXNzb3IiLCJyZXNldCIsInJlc29sdmUiLCJyZWplY3QiLCJzZXR0bGUiLCJwcm9jZXNzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7SUFXcUJBLGE7OztBQUNuQjs7O0FBR0EsV0FBQSxhQUFBLENBQUEsTUFBQSxFQUFBLElBQUEsRUFBMEI7QUFDeEIsU0FBQSxNQUFBLEdBQUEsTUFBQTtBQUNBLFNBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxTQUFBLEtBQUE7QUFDRDtBQUNEOzs7Ozs7O1NBS0FDLEssR0FBQUEsU0FBQUEsS0FBQUEsR0FBUTtBQUFBLFFBQUEsS0FBQSxHQUFBLElBQUE7O0FBQ04sU0FBQSxRQUFBLEdBQUEsS0FBQTtBQUNBLFNBQUEsUUFBQSxHQUFBLEtBQUE7QUFDQSxTQUFBLFdBQUEsR0FBbUIsSUFBQSxPQUFBLENBQVksVUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFxQjtBQUNsRCxNQUFBLEtBQUksQ0FBSixRQUFBLEdBQWdCLFVBQUEsQ0FBQSxFQUFLO0FBQ25CLFFBQUEsS0FBSSxDQUFKLFFBQUEsR0FBQSxJQUFBO0FBQ0FDLFFBQUFBLE9BQU8sQ0FBUEEsQ0FBTyxDQUFQQTtBQUZGLE9BQUE7O0FBS0EsTUFBQSxLQUFJLENBQUosS0FBQSxHQUFhLFVBQUEsQ0FBQSxFQUFLO0FBQ2hCLFFBQUEsS0FBSSxDQUFKLFFBQUEsR0FBQSxJQUFBO0FBQ0FDLFFBQUFBLE1BQU0sQ0FBTkEsQ0FBTSxDQUFOQTtBQUZGLE9BQUE7QUFORixLQUFtQixDQUFuQjtBQVdEO0FBQ0Q7Ozs7QUFnQkE7Ozs7O1NBS0FDLE0sR0FBQUEsU0FBQUEsTUFBQUEsR0FBUztBQUNQLFdBQU8sS0FBUCxXQUFBO0FBQ0Q7QUFDRDs7Ozs7U0FLQUMsTyxHQUFBQSxTQUFBQSxPQUFBQSxHQUFVO0FBQ1IsUUFBSSxDQUFDLEtBQUwsUUFBQSxFQUFvQjtBQUNsQixXQUFBLFFBQUEsR0FBQSxJQUFBO0FBQ0EsV0FBQSxNQUFBLENBQUEsT0FBQSxDQUFvQixLQUFwQixJQUFBLEVBQUEsSUFBQSxDQUFvQyxLQUFwQyxRQUFBLEVBQW1ELEtBQW5ELEtBQUE7QUFDRDs7QUFFRCxXQUFPLEtBQVAsTUFBTyxFQUFQO0FBQ0Q7QUFDRDs7Ozs7OztTQU9BRixNLEdBQUFBLFNBQUFBLE1BQUFBLENBQUFBLENBQUFBLEVBQVU7QUFDUixRQUFJLEtBQUosUUFBQSxFQUFtQjtBQUNqQixZQUFNLElBQUEsS0FBQSxDQUFOLDhFQUFNLENBQU47QUFERixLQUFBLE1BRU87QUFDTCxXQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0Q7Ozs7O3FCQTVDVztBQUNaLGFBQU8sS0FBUCxRQUFBO0FBQ0Q7QUFDRDs7Ozs7O3FCQUtjO0FBQ1osYUFBTyxLQUFQLFFBQUE7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQSBgVGFza1Byb2Nlc3NvcmAgcGVyZm9ybXMgYSBgVGFza2AgYnkgY2FsbGluZyBgcGVyZm9ybSgpYCBvbiBpdHMgdGFyZ2V0LlxuICogVGhpcyBpcyB0cmlnZ2VyZWQgYnkgY2FsbGluZyBgcHJvY2VzcygpYCBvbiB0aGUgcHJvY2Vzc29yLlxuICpcbiAqIEEgcHJvY2Vzc29yIG1haW50YWlucyBhIHByb21pc2UgdGhhdCByZXByZXNlbnRzIHRoZSBldmVudHVhbCBzdGF0ZSAocmVzb2x2ZWRcbiAqIG9yIHJlamVjdGVkKSBvZiB0aGUgdGFzay4gVGhpcyBwcm9taXNlIGlzIGNyZWF0ZWQgdXBvbiBjb25zdHJ1Y3Rpb24sIGFuZFxuICogd2lsbCBiZSByZXR1cm5lZCBieSBjYWxsaW5nIGBzZXR0bGUoKWAuXG4gKlxuICogQSB0YXNrIGNhbiBiZSByZS10cmllZCBieSBmaXJzdCBjYWxsaW5nIGByZXNldCgpYCBvbiB0aGUgcHJvY2Vzc29yLiBUaGlzXG4gKiB3aWxsIGNsZWFyIHRoZSBwcm9jZXNzb3IncyBzdGF0ZSBhbmQgYWxsb3cgYHByb2Nlc3MoKWAgdG8gYmUgaW52b2tlZCBhZ2Fpbi5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGFza1Byb2Nlc3NvciB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIFRhc2tQcm9jZXNzb3IuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih0YXJnZXQsIHRhc2spIHtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLnRhc2sgPSB0YXNrO1xuICAgIHRoaXMucmVzZXQoKTtcbiAgfVxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBwcm9jZXNzb3Igc3RhdGUsIGFsbG93aW5nIGZvciBhIGZyZXNoIGNhbGwgdG8gYHByb2Nlc3MoKWAuXG4gICAqL1xuXG5cbiAgcmVzZXQoKSB7XG4gICAgdGhpcy5fc3RhcnRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3NldHRsZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9zZXR0bGVtZW50ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5fc3VjY2VzcyA9IHIgPT4ge1xuICAgICAgICB0aGlzLl9zZXR0bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZShyKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuX2ZhaWwgPSBlID0+IHtcbiAgICAgICAgdGhpcy5fc2V0dGxlZCA9IHRydWU7XG4gICAgICAgIHJlamVjdChlKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIEhhcyBgcHJvY2Vzc2AgYmVlbiBpbnZva2VkP1xuICAgKi9cblxuXG4gIGdldCBzdGFydGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9zdGFydGVkO1xuICB9XG4gIC8qKlxuICAgKiBIYXMgcHJvbWlzZSBzZXR0bGVkLCBlaXRoZXIgdmlhIGBwcm9jZXNzYCBvciBgcmVqZWN0YD9cbiAgICovXG5cblxuICBnZXQgc2V0dGxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2V0dGxlZDtcbiAgfVxuICAvKipcbiAgICogVGhlIGV2ZW50dWFsIHJlc3VsdCBvZiBwcm9jZXNzaW5nLlxuICAgKi9cblxuXG4gIHNldHRsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2V0dGxlbWVudDtcbiAgfVxuICAvKipcbiAgICogSW52b2tlcyBgcGVyZm9ybWAgb24gdGhlIHRhcmdldC5cbiAgICovXG5cblxuICBwcm9jZXNzKCkge1xuICAgIGlmICghdGhpcy5fc3RhcnRlZCkge1xuICAgICAgdGhpcy5fc3RhcnRlZCA9IHRydWU7XG4gICAgICB0aGlzLnRhcmdldC5wZXJmb3JtKHRoaXMudGFzaykudGhlbih0aGlzLl9zdWNjZXNzLCB0aGlzLl9mYWlsKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZXR0bGUoKTtcbiAgfVxuICAvKipcbiAgICogUmVqZWN0IHRoZSBjdXJyZW50IHByb21pc2Ugd2l0aCBhIHNwZWNpZmljIGVycm9yLlxuICAgKlxuICAgKiBAcGFyYW0gZSBFcnJvciBhc3NvY2lhdGVkIHdpdGggcmVqZWN0aW9uXG4gICAqL1xuXG5cbiAgcmVqZWN0KGUpIHtcbiAgICBpZiAodGhpcy5fc2V0dGxlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUYXNrUHJvY2Vzc29yI3JlamVjdCBjYW4gbm90IGJlIGludm9rZWQgd2hlbiBwcm9jZXNzaW5nIGhhcyBhbHJlYWR5IHNldHRsZWQuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2ZhaWwoZSk7XG4gICAgfVxuICB9XG5cbn0iXX0=