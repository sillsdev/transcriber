"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

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
class TaskProcessor {
  /**
   * Creates an instance of TaskProcessor.
   */
  constructor(target, task) {
    this.target = target;
    this.task = task;
    this.reset();
  }
  /**
   * Clears the processor state, allowing for a fresh call to `process()`.
   */


  reset() {
    this._started = false;
    this._settled = false;
    this._settlement = new Promise((resolve, reject) => {
      this._success = r => {
        this._settled = true;
        resolve(r);
      };

      this._fail = e => {
        this._settled = true;
        reject(e);
      };
    });
  }
  /**
   * Has `process` been invoked?
   */


  get started() {
    return this._started;
  }
  /**
   * Has promise settled, either via `process` or `reject`?
   */


  get settled() {
    return this._settled;
  }
  /**
   * The eventual result of processing.
   */


  settle() {
    return this._settlement;
  }
  /**
   * Invokes `perform` on the target.
   */


  process() {
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


  reject(e) {
    if (this._settled) {
      throw new Error('TaskProcessor#reject can not be invoked when processing has already settled.');
    } else {
      this._fail(e);
    }
  }

}

exports.default = TaskProcessor;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRhc2stcHJvY2Vzc29yLmpzIl0sIm5hbWVzIjpbIlRhc2tQcm9jZXNzb3IiLCJjb25zdHJ1Y3RvciIsInRhcmdldCIsInRhc2siLCJyZXNldCIsIl9zdGFydGVkIiwiX3NldHRsZWQiLCJfc2V0dGxlbWVudCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiX3N1Y2Nlc3MiLCJyIiwiX2ZhaWwiLCJlIiwic3RhcnRlZCIsInNldHRsZWQiLCJzZXR0bGUiLCJwcm9jZXNzIiwicGVyZm9ybSIsInRoZW4iLCJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7Ozs7Ozs7OztBQVdlLE1BQU1BLGFBQU4sQ0FBb0I7QUFDakM7OztBQUdBQyxFQUFBQSxXQUFXLENBQUNDLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ3hCLFNBQUtELE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtDLElBQUwsR0FBWUEsSUFBWjtBQUNBLFNBQUtDLEtBQUw7QUFDRDtBQUNEOzs7OztBQUtBQSxFQUFBQSxLQUFLLEdBQUc7QUFDTixTQUFLQyxRQUFMLEdBQWdCLEtBQWhCO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQixLQUFoQjtBQUNBLFNBQUtDLFdBQUwsR0FBbUIsSUFBSUMsT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVUMsTUFBVixLQUFxQjtBQUNsRCxXQUFLQyxRQUFMLEdBQWdCQyxDQUFDLElBQUk7QUFDbkIsYUFBS04sUUFBTCxHQUFnQixJQUFoQjtBQUNBRyxRQUFBQSxPQUFPLENBQUNHLENBQUQsQ0FBUDtBQUNELE9BSEQ7O0FBS0EsV0FBS0MsS0FBTCxHQUFhQyxDQUFDLElBQUk7QUFDaEIsYUFBS1IsUUFBTCxHQUFnQixJQUFoQjtBQUNBSSxRQUFBQSxNQUFNLENBQUNJLENBQUQsQ0FBTjtBQUNELE9BSEQ7QUFJRCxLQVZrQixDQUFuQjtBQVdEO0FBQ0Q7Ozs7O0FBS0EsTUFBSUMsT0FBSixHQUFjO0FBQ1osV0FBTyxLQUFLVixRQUFaO0FBQ0Q7QUFDRDs7Ozs7QUFLQSxNQUFJVyxPQUFKLEdBQWM7QUFDWixXQUFPLEtBQUtWLFFBQVo7QUFDRDtBQUNEOzs7OztBQUtBVyxFQUFBQSxNQUFNLEdBQUc7QUFDUCxXQUFPLEtBQUtWLFdBQVo7QUFDRDtBQUNEOzs7OztBQUtBVyxFQUFBQSxPQUFPLEdBQUc7QUFDUixRQUFJLENBQUMsS0FBS2IsUUFBVixFQUFvQjtBQUNsQixXQUFLQSxRQUFMLEdBQWdCLElBQWhCO0FBQ0EsV0FBS0gsTUFBTCxDQUFZaUIsT0FBWixDQUFvQixLQUFLaEIsSUFBekIsRUFBK0JpQixJQUEvQixDQUFvQyxLQUFLVCxRQUF6QyxFQUFtRCxLQUFLRSxLQUF4RDtBQUNEOztBQUVELFdBQU8sS0FBS0ksTUFBTCxFQUFQO0FBQ0Q7QUFDRDs7Ozs7OztBQU9BUCxFQUFBQSxNQUFNLENBQUNJLENBQUQsRUFBSTtBQUNSLFFBQUksS0FBS1IsUUFBVCxFQUFtQjtBQUNqQixZQUFNLElBQUllLEtBQUosQ0FBVSw4RUFBVixDQUFOO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsV0FBS1IsS0FBTCxDQUFXQyxDQUFYO0FBQ0Q7QUFDRjs7QUEvRWdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBIGBUYXNrUHJvY2Vzc29yYCBwZXJmb3JtcyBhIGBUYXNrYCBieSBjYWxsaW5nIGBwZXJmb3JtKClgIG9uIGl0cyB0YXJnZXQuXG4gKiBUaGlzIGlzIHRyaWdnZXJlZCBieSBjYWxsaW5nIGBwcm9jZXNzKClgIG9uIHRoZSBwcm9jZXNzb3IuXG4gKlxuICogQSBwcm9jZXNzb3IgbWFpbnRhaW5zIGEgcHJvbWlzZSB0aGF0IHJlcHJlc2VudHMgdGhlIGV2ZW50dWFsIHN0YXRlIChyZXNvbHZlZFxuICogb3IgcmVqZWN0ZWQpIG9mIHRoZSB0YXNrLiBUaGlzIHByb21pc2UgaXMgY3JlYXRlZCB1cG9uIGNvbnN0cnVjdGlvbiwgYW5kXG4gKiB3aWxsIGJlIHJldHVybmVkIGJ5IGNhbGxpbmcgYHNldHRsZSgpYC5cbiAqXG4gKiBBIHRhc2sgY2FuIGJlIHJlLXRyaWVkIGJ5IGZpcnN0IGNhbGxpbmcgYHJlc2V0KClgIG9uIHRoZSBwcm9jZXNzb3IuIFRoaXNcbiAqIHdpbGwgY2xlYXIgdGhlIHByb2Nlc3NvcidzIHN0YXRlIGFuZCBhbGxvdyBgcHJvY2VzcygpYCB0byBiZSBpbnZva2VkIGFnYWluLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUYXNrUHJvY2Vzc29yIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgVGFza1Byb2Nlc3Nvci5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHRhcmdldCwgdGFzaykge1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIHRoaXMudGFzayA9IHRhc2s7XG4gICAgdGhpcy5yZXNldCgpO1xuICB9XG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIHByb2Nlc3NvciBzdGF0ZSwgYWxsb3dpbmcgZm9yIGEgZnJlc2ggY2FsbCB0byBgcHJvY2VzcygpYC5cbiAgICovXG5cblxuICByZXNldCgpIHtcbiAgICB0aGlzLl9zdGFydGVkID0gZmFsc2U7XG4gICAgdGhpcy5fc2V0dGxlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3NldHRsZW1lbnQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLl9zdWNjZXNzID0gciA9PiB7XG4gICAgICAgIHRoaXMuX3NldHRsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlKHIpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5fZmFpbCA9IGUgPT4ge1xuICAgICAgICB0aGlzLl9zZXR0bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogSGFzIGBwcm9jZXNzYCBiZWVuIGludm9rZWQ/XG4gICAqL1xuXG5cbiAgZ2V0IHN0YXJ0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N0YXJ0ZWQ7XG4gIH1cbiAgLyoqXG4gICAqIEhhcyBwcm9taXNlIHNldHRsZWQsIGVpdGhlciB2aWEgYHByb2Nlc3NgIG9yIGByZWplY3RgP1xuICAgKi9cblxuXG4gIGdldCBzZXR0bGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9zZXR0bGVkO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgZXZlbnR1YWwgcmVzdWx0IG9mIHByb2Nlc3NpbmcuXG4gICAqL1xuXG5cbiAgc2V0dGxlKCkge1xuICAgIHJldHVybiB0aGlzLl9zZXR0bGVtZW50O1xuICB9XG4gIC8qKlxuICAgKiBJbnZva2VzIGBwZXJmb3JtYCBvbiB0aGUgdGFyZ2V0LlxuICAgKi9cblxuXG4gIHByb2Nlc3MoKSB7XG4gICAgaWYgKCF0aGlzLl9zdGFydGVkKSB7XG4gICAgICB0aGlzLl9zdGFydGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMudGFyZ2V0LnBlcmZvcm0odGhpcy50YXNrKS50aGVuKHRoaXMuX3N1Y2Nlc3MsIHRoaXMuX2ZhaWwpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnNldHRsZSgpO1xuICB9XG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIGN1cnJlbnQgcHJvbWlzZSB3aXRoIGEgc3BlY2lmaWMgZXJyb3IuXG4gICAqXG4gICAqIEBwYXJhbSBlIEVycm9yIGFzc29jaWF0ZWQgd2l0aCByZWplY3Rpb25cbiAgICovXG5cblxuICByZWplY3QoZSkge1xuICAgIGlmICh0aGlzLl9zZXR0bGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Rhc2tQcm9jZXNzb3IjcmVqZWN0IGNhbiBub3QgYmUgaW52b2tlZCB3aGVuIHByb2Nlc3NpbmcgaGFzIGFscmVhZHkgc2V0dGxlZC4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZmFpbChlKTtcbiAgICB9XG4gIH1cblxufSJdfQ==