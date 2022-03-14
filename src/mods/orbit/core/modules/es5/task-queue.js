function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
    if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  }
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

import Orbit from './main';
import TaskProcessor from './task-processor';
import evented, { settleInSeries } from './evented';
var assert = Orbit.assert;
/**
 * `TaskQueue` is a FIFO queue of asynchronous tasks that should be
 * performed sequentially.
 *
 * Tasks are added to the queue with `push`. Each task will be processed by
 * calling its `process` method.
 *
 * By default, task queues will be processed automatically, as soon as tasks
 * are pushed to them. This can be overridden by setting the `autoProcess`
 * setting to `false` and calling `process` when you'd like to start
 * processing.
 */

var TaskQueue =
/*#__PURE__*/
function () {
  /**
   * Creates an instance of `TaskQueue`.
   */
  function TaskQueue(target) {
    var _this = this;

    var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this._performer = target;
    this._name = settings.name;
    this._bucket = settings.bucket;
    this.autoProcess = settings.autoProcess === undefined ? true : settings.autoProcess;

    if (this._bucket) {
      assert('TaskQueue requires a name if it has a bucket', !!this._name);
    }

    this._reify().then(function () {
      if (_this.length > 0 && _this.autoProcess) {
        _this.process();
      }
    });
  }
  /**
   * Name used for tracking / debugging this queue.
   */


  var _proto = TaskQueue.prototype;

  /**
   * Push a new task onto the end of the queue.
   *
   * If `autoProcess` is enabled, this will automatically trigger processing of
   * the queue.
   *
   * Returns a promise that resolves when the pushed task has been processed.
   */
  _proto.push = function push(task) {
    var _this2 = this;

    var processor = new TaskProcessor(this._performer, task);
    return this._reified.then(function () {
      _this2._tasks.push(task);

      _this2._processors.push(processor);

      return _this2._persist();
    }).then(function () {
      return _this2._settle(processor);
    });
  }
  /**
   * Cancels and re-tries processing the current task.
   *
   * Returns a promise that resolves when the pushed task has been processed.
   */
  ;

  _proto.retry = function retry() {
    var _this3 = this;

    var processor;
    return this._reified.then(function () {
      _this3._cancel();

      processor = _this3.currentProcessor;
      processor.reset();
      return _this3._persist();
    }).then(function () {
      return _this3._settle(processor, true);
    });
  }
  /**
   * Cancels and discards the current task.
   *
   * If `autoProcess` is enabled, this will automatically trigger processing of
   * the queue.
   */
  ;

  _proto.skip = function skip(e) {
    var _this4 = this;

    return this._reified.then(function () {
      _this4._cancel();

      _this4._tasks.shift();

      var processor = _this4._processors.shift();

      if (processor !== undefined && !processor.settled) {
        processor.reject(e || new Error('Processing cancelled via `TaskQueue#skip`'));
      }

      return _this4._persist();
    }).then(function () {
      return _this4._settle();
    });
  }
  /**
   * Cancels the current task and completely clears the queue.
   */
  ;

  _proto.clear = function clear(e) {
    var _this5 = this;

    return this._reified.then(function () {
      _this5._cancel();

      _this5._tasks = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = _this5._processors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var processor = _step.value;

          if (!processor.settled) {
            processor.reject(e || new Error('Processing cancelled via `TaskQueue#clear`'));
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      _this5._processors = [];
      return _this5._persist();
    }).then(function () {
      return _this5._settle(null, true);
    });
  }
  /**
   * Cancels the current task and removes it, but does not continue processing.
   *
   * Returns the canceled and removed task.
   */
  ;

  _proto.shift = function shift(e) {
    var _this6 = this;

    var task;
    return this._reified.then(function () {
      _this6._cancel();

      task = _this6._tasks.shift();

      var processor = _this6._processors.shift();

      if (processor !== undefined && !processor.settled) {
        processor.reject(e || new Error('Processing cancelled via `TaskQueue#shift`'));
      }

      return _this6._persist();
    }).then(function () {
      return task;
    });
  }
  /**
   * Cancels processing the current task and inserts a new task at the beginning
   * of the queue. This new task will be processed next.
   *
   * Returns a promise that resolves when the new task has been processed.
   */
  ;

  _proto.unshift = function unshift(task) {
    var _this7 = this;

    var processor = new TaskProcessor(this._performer, task);
    return this._reified.then(function () {
      _this7._cancel();

      _this7._tasks.unshift(task);

      _this7._processors.unshift(processor);

      return _this7._persist();
    }).then(function () {
      return _this7._settle(processor);
    });
  }
  /**
   * Processes all the tasks in the queue. Resolves when the queue is empty.
   */
  ;

  _proto.process = function process() {
    var _this8 = this;

    return this._reified.then(function () {
      var resolution = _this8._resolution;

      if (!resolution) {
        if (_this8._tasks.length === 0) {
          resolution = _this8._complete();
        } else {
          _this8._error = null;
          _this8._resolution = resolution = new Promise(function (resolve, reject) {
            _this8._resolve = resolve;
            _this8._reject = reject;
          });

          _this8._settleEach(resolution);
        }
      }

      return resolution;
    });
  };

  _proto._settle = function _settle(processor, alwaysProcess) {
    if (this.autoProcess || alwaysProcess) {
      var settle = processor ? function () {
        return processor.settle();
      } : function () {};
      return this.process().then(settle, settle);
    } else if (processor) {
      return processor.settle();
    } else {
      return Promise.resolve();
    }
  };

  _proto._complete = function _complete() {
    if (this._resolve) {
      this._resolve();
    }

    this._resolve = null;
    this._reject = null;
    this._error = null;
    this._resolution = null;
    return settleInSeries(this, 'complete');
  };

  _proto._fail = function _fail(task, e) {
    if (this._reject) {
      this._reject(e);
    }

    this._resolve = null;
    this._reject = null;
    this._error = e;
    this._resolution = null;
    return settleInSeries(this, 'fail', task, e);
  };

  _proto._cancel = function _cancel() {
    this._error = null;
    this._resolution = null;
  };

  _proto._settleEach = function _settleEach(resolution) {
    var _this9 = this;

    if (this._tasks.length === 0) {
      return this._complete();
    } else {
      var task = this._tasks[0];
      var processor = this._processors[0];
      return settleInSeries(this, 'beforeTask', task).then(function () {
        return processor.process();
      }).then(function () {
        if (resolution === _this9._resolution) {
          _this9._tasks.shift();

          _this9._processors.shift();

          return _this9._persist().then(function () {
            return settleInSeries(_this9, 'task', task);
          }).then(function () {
            return _this9._settleEach(resolution);
          });
        }
      }).catch(function (e) {
        if (resolution === _this9._resolution) {
          return _this9._fail(task, e);
        }
      });
    }
  };

  _proto._reify = function _reify() {
    var _this10 = this;

    this._tasks = [];
    this._processors = [];

    if (this._bucket) {
      this._reified = this._bucket.getItem(this._name).then(function (tasks) {
        if (tasks) {
          _this10._tasks = tasks;
          _this10._processors = tasks.map(function (task) {
            return new TaskProcessor(_this10._performer, task);
          });
        }
      });
    } else {
      this._reified = Promise.resolve();
    }

    return this._reified;
  };

  _proto._persist = function _persist() {
    this.emit('change');

    if (this._bucket) {
      return this._bucket.setItem(this._name, this._tasks);
    } else {
      return Promise.resolve();
    }
  };

  _createClass(TaskQueue, [{
    key: "name",
    get: function () {
      return this._name;
    }
    /**
     * The object which will `perform` the tasks in this queue.
     */

  }, {
    key: "performer",
    get: function () {
      return this._performer;
    }
    /**
     * A bucket used to persist the state of this queue.
     */

  }, {
    key: "bucket",
    get: function () {
      return this._bucket;
    }
    /**
     * The number of tasks in the queue.
     */

  }, {
    key: "length",
    get: function () {
      return this._tasks ? this._tasks.length : 0;
    }
    /**
     * The tasks in the queue.
     */

  }, {
    key: "entries",
    get: function () {
      return this._tasks;
    }
    /**
     * The current task being processed (if actively processing), or the next
     * task to be processed (if not actively processing).
     */

  }, {
    key: "current",
    get: function () {
      return this._tasks && this._tasks[0];
    }
    /**
     * The processor wrapper that is processing the current task (or next task,
     * if none are being processed).
     */

  }, {
    key: "currentProcessor",
    get: function () {
      return this._processors && this._processors[0];
    }
    /**
     * If an error occurs while processing a task, processing will be halted, the
     * `fail` event will be emitted, and this property will reflect the error
     * encountered.
     */

  }, {
    key: "error",
    get: function () {
      return this._error;
    }
    /**
     * Is the queue empty?
     */

  }, {
    key: "empty",
    get: function () {
      return this.length === 0;
    }
    /**
     * Is the queue actively processing a task?
     */

  }, {
    key: "processing",
    get: function () {
      var processor = this.currentProcessor;
      return processor !== undefined && processor.started && !processor.settled;
    }
    /**
     * Resolves when the queue has been fully reified from its associated bucket,
     * if applicable.
     */

  }, {
    key: "reified",
    get: function () {
      return this._reified;
    }
  }]);

  return TaskQueue;
}();

TaskQueue = __decorate([evented], TaskQueue);
export default TaskQueue;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRhc2stcXVldWUuanMiXSwibmFtZXMiOlsiX19kZWNvcmF0ZSIsImRlY29yYXRvcnMiLCJ0YXJnZXQiLCJrZXkiLCJkZXNjIiwiYyIsImFyZ3VtZW50cyIsImxlbmd0aCIsInIiLCJPYmplY3QiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJkIiwiUmVmbGVjdCIsImRlY29yYXRlIiwiaSIsImRlZmluZVByb3BlcnR5IiwiT3JiaXQiLCJUYXNrUHJvY2Vzc29yIiwiZXZlbnRlZCIsInNldHRsZUluU2VyaWVzIiwiYXNzZXJ0IiwiVGFza1F1ZXVlIiwic2V0dGluZ3MiLCJfcGVyZm9ybWVyIiwiX25hbWUiLCJuYW1lIiwiX2J1Y2tldCIsImJ1Y2tldCIsImF1dG9Qcm9jZXNzIiwidW5kZWZpbmVkIiwiX3JlaWZ5IiwidGhlbiIsInByb2Nlc3MiLCJwdXNoIiwidGFzayIsInByb2Nlc3NvciIsIl9yZWlmaWVkIiwiX3Rhc2tzIiwiX3Byb2Nlc3NvcnMiLCJfcGVyc2lzdCIsIl9zZXR0bGUiLCJyZXRyeSIsIl9jYW5jZWwiLCJjdXJyZW50UHJvY2Vzc29yIiwicmVzZXQiLCJza2lwIiwiZSIsInNoaWZ0Iiwic2V0dGxlZCIsInJlamVjdCIsIkVycm9yIiwiY2xlYXIiLCJ1bnNoaWZ0IiwicmVzb2x1dGlvbiIsIl9yZXNvbHV0aW9uIiwiX2NvbXBsZXRlIiwiX2Vycm9yIiwiUHJvbWlzZSIsInJlc29sdmUiLCJfcmVzb2x2ZSIsIl9yZWplY3QiLCJfc2V0dGxlRWFjaCIsImFsd2F5c1Byb2Nlc3MiLCJzZXR0bGUiLCJfZmFpbCIsImNhdGNoIiwiZ2V0SXRlbSIsInRhc2tzIiwibWFwIiwiZW1pdCIsInNldEl0ZW0iLCJzdGFydGVkIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUEsSUFBSUEsVUFBVSxHQUFHLFFBQVEsS0FBS0EsVUFBYixJQUEyQixVQUFVQyxVQUFWLEVBQXNCQyxNQUF0QixFQUE4QkMsR0FBOUIsRUFBbUNDLElBQW5DLEVBQXlDO0FBQ25GLE1B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RkM7QUFDVixhQUFPLEtBQUtrQixNQUFaO0FBQ0Q7QUFDRDs7OztBQXhGVztBQUFBO0FBQUEscUJBNkZDO0FBQ1YsYUFBTyxLQUFLakQsTUFBTCxLQUFnQixDQUF2QjtBQUNEO0FBQ0Q7Ozs7QUFoR1c7QUFBQTtBQUFBLHFCQXFHTTtBQUNmLFVBQU00QixTQUFTLEdBQUcsS0FBS1EsZ0JBQXZCO0FBQ0EsYUFBT1IsU0FBUyxLQUFLTixTQUFkLElBQTJCTSxTQUFTLENBQUNvQyxPQUFyQyxJQUFnRCxDQUFDcEMsU0FBUyxDQUFDYSxPQUFsRTtBQUNEO0FBQ0Q7Ozs7O0FBekdXO0FBQUE7QUFBQSxxQkErR0c7QUFDWixhQUFPLEtBQUtaLFFBQVo7QUFDRDtBQWpIVTs7QUFBQTtBQUFBLEdBQWI7O0FBb1dBZixTQUFTLEdBQUdyQixVQUFVLENBQUMsQ0FBQ2tCLE9BQUQsQ0FBRCxFQUFZRyxTQUFaLENBQXRCO0FBQ0EsZUFBZUEsU0FBZiIsInNvdXJjZXNDb250ZW50IjpbInZhciBfX2RlY29yYXRlID0gdGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgICAgIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLFxuICAgICAgZDtcbiAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcblxuaW1wb3J0IE9yYml0IGZyb20gJy4vbWFpbic7XG5pbXBvcnQgVGFza1Byb2Nlc3NvciBmcm9tICcuL3Rhc2stcHJvY2Vzc29yJztcbmltcG9ydCBldmVudGVkLCB7IHNldHRsZUluU2VyaWVzIH0gZnJvbSAnLi9ldmVudGVkJztcbmNvbnN0IHtcbiAgYXNzZXJ0XG59ID0gT3JiaXQ7XG4vKipcbiAqIGBUYXNrUXVldWVgIGlzIGEgRklGTyBxdWV1ZSBvZiBhc3luY2hyb25vdXMgdGFza3MgdGhhdCBzaG91bGQgYmVcbiAqIHBlcmZvcm1lZCBzZXF1ZW50aWFsbHkuXG4gKlxuICogVGFza3MgYXJlIGFkZGVkIHRvIHRoZSBxdWV1ZSB3aXRoIGBwdXNoYC4gRWFjaCB0YXNrIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5XG4gKiBjYWxsaW5nIGl0cyBgcHJvY2Vzc2AgbWV0aG9kLlxuICpcbiAqIEJ5IGRlZmF1bHQsIHRhc2sgcXVldWVzIHdpbGwgYmUgcHJvY2Vzc2VkIGF1dG9tYXRpY2FsbHksIGFzIHNvb24gYXMgdGFza3NcbiAqIGFyZSBwdXNoZWQgdG8gdGhlbS4gVGhpcyBjYW4gYmUgb3ZlcnJpZGRlbiBieSBzZXR0aW5nIHRoZSBgYXV0b1Byb2Nlc3NgXG4gKiBzZXR0aW5nIHRvIGBmYWxzZWAgYW5kIGNhbGxpbmcgYHByb2Nlc3NgIHdoZW4geW91J2QgbGlrZSB0byBzdGFydFxuICogcHJvY2Vzc2luZy5cbiAqL1xuXG5sZXQgVGFza1F1ZXVlID0gY2xhc3MgVGFza1F1ZXVlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgYFRhc2tRdWV1ZWAuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih0YXJnZXQsIHNldHRpbmdzID0ge30pIHtcbiAgICB0aGlzLl9wZXJmb3JtZXIgPSB0YXJnZXQ7XG4gICAgdGhpcy5fbmFtZSA9IHNldHRpbmdzLm5hbWU7XG4gICAgdGhpcy5fYnVja2V0ID0gc2V0dGluZ3MuYnVja2V0O1xuICAgIHRoaXMuYXV0b1Byb2Nlc3MgPSBzZXR0aW5ncy5hdXRvUHJvY2VzcyA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IHNldHRpbmdzLmF1dG9Qcm9jZXNzO1xuXG4gICAgaWYgKHRoaXMuX2J1Y2tldCkge1xuICAgICAgYXNzZXJ0KCdUYXNrUXVldWUgcmVxdWlyZXMgYSBuYW1lIGlmIGl0IGhhcyBhIGJ1Y2tldCcsICEhdGhpcy5fbmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5fcmVpZnkoKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA+IDAgJiYgdGhpcy5hdXRvUHJvY2Vzcykge1xuICAgICAgICB0aGlzLnByb2Nlc3MoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogTmFtZSB1c2VkIGZvciB0cmFja2luZyAvIGRlYnVnZ2luZyB0aGlzIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgb2JqZWN0IHdoaWNoIHdpbGwgYHBlcmZvcm1gIHRoZSB0YXNrcyBpbiB0aGlzIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBwZXJmb3JtZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BlcmZvcm1lcjtcbiAgfVxuICAvKipcbiAgICogQSBidWNrZXQgdXNlZCB0byBwZXJzaXN0IHRoZSBzdGF0ZSBvZiB0aGlzIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBidWNrZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Y2tldDtcbiAgfVxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiB0YXNrcyBpbiB0aGUgcXVldWUuXG4gICAqL1xuXG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdGFza3MgPyB0aGlzLl90YXNrcy5sZW5ndGggOiAwO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgdGFza3MgaW4gdGhlIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBlbnRyaWVzKCkge1xuICAgIHJldHVybiB0aGlzLl90YXNrcztcbiAgfVxuICAvKipcbiAgICogVGhlIGN1cnJlbnQgdGFzayBiZWluZyBwcm9jZXNzZWQgKGlmIGFjdGl2ZWx5IHByb2Nlc3NpbmcpLCBvciB0aGUgbmV4dFxuICAgKiB0YXNrIHRvIGJlIHByb2Nlc3NlZCAoaWYgbm90IGFjdGl2ZWx5IHByb2Nlc3NpbmcpLlxuICAgKi9cblxuXG4gIGdldCBjdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLl90YXNrcyAmJiB0aGlzLl90YXNrc1swXTtcbiAgfVxuICAvKipcbiAgICogVGhlIHByb2Nlc3NvciB3cmFwcGVyIHRoYXQgaXMgcHJvY2Vzc2luZyB0aGUgY3VycmVudCB0YXNrIChvciBuZXh0IHRhc2ssXG4gICAqIGlmIG5vbmUgYXJlIGJlaW5nIHByb2Nlc3NlZCkuXG4gICAqL1xuXG5cbiAgZ2V0IGN1cnJlbnRQcm9jZXNzb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb2Nlc3NvcnMgJiYgdGhpcy5fcHJvY2Vzc29yc1swXTtcbiAgfVxuICAvKipcbiAgICogSWYgYW4gZXJyb3Igb2NjdXJzIHdoaWxlIHByb2Nlc3NpbmcgYSB0YXNrLCBwcm9jZXNzaW5nIHdpbGwgYmUgaGFsdGVkLCB0aGVcbiAgICogYGZhaWxgIGV2ZW50IHdpbGwgYmUgZW1pdHRlZCwgYW5kIHRoaXMgcHJvcGVydHkgd2lsbCByZWZsZWN0IHRoZSBlcnJvclxuICAgKiBlbmNvdW50ZXJlZC5cbiAgICovXG5cblxuICBnZXQgZXJyb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Vycm9yO1xuICB9XG4gIC8qKlxuICAgKiBJcyB0aGUgcXVldWUgZW1wdHk/XG4gICAqL1xuXG5cbiAgZ2V0IGVtcHR5KCkge1xuICAgIHJldHVybiB0aGlzLmxlbmd0aCA9PT0gMDtcbiAgfVxuICAvKipcbiAgICogSXMgdGhlIHF1ZXVlIGFjdGl2ZWx5IHByb2Nlc3NpbmcgYSB0YXNrP1xuICAgKi9cblxuXG4gIGdldCBwcm9jZXNzaW5nKCkge1xuICAgIGNvbnN0IHByb2Nlc3NvciA9IHRoaXMuY3VycmVudFByb2Nlc3NvcjtcbiAgICByZXR1cm4gcHJvY2Vzc29yICE9PSB1bmRlZmluZWQgJiYgcHJvY2Vzc29yLnN0YXJ0ZWQgJiYgIXByb2Nlc3Nvci5zZXR0bGVkO1xuICB9XG4gIC8qKlxuICAgKiBSZXNvbHZlcyB3aGVuIHRoZSBxdWV1ZSBoYXMgYmVlbiBmdWxseSByZWlmaWVkIGZyb20gaXRzIGFzc29jaWF0ZWQgYnVja2V0LFxuICAgKiBpZiBhcHBsaWNhYmxlLlxuICAgKi9cblxuXG4gIGdldCByZWlmaWVkKCkge1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkO1xuICB9XG4gIC8qKlxuICAgKiBQdXNoIGEgbmV3IHRhc2sgb250byB0aGUgZW5kIG9mIHRoZSBxdWV1ZS5cbiAgICpcbiAgICogSWYgYGF1dG9Qcm9jZXNzYCBpcyBlbmFibGVkLCB0aGlzIHdpbGwgYXV0b21hdGljYWxseSB0cmlnZ2VyIHByb2Nlc3Npbmcgb2ZcbiAgICogdGhlIHF1ZXVlLlxuICAgKlxuICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHB1c2hlZCB0YXNrIGhhcyBiZWVuIHByb2Nlc3NlZC5cbiAgICovXG5cblxuICBwdXNoKHRhc2spIHtcbiAgICBsZXQgcHJvY2Vzc29yID0gbmV3IFRhc2tQcm9jZXNzb3IodGhpcy5fcGVyZm9ybWVyLCB0YXNrKTtcbiAgICByZXR1cm4gdGhpcy5fcmVpZmllZC50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3Rhc2tzLnB1c2godGFzayk7XG5cbiAgICAgIHRoaXMuX3Byb2Nlc3NvcnMucHVzaChwcm9jZXNzb3IpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fcGVyc2lzdCgpO1xuICAgIH0pLnRoZW4oKCkgPT4gdGhpcy5fc2V0dGxlKHByb2Nlc3NvcikpO1xuICB9XG4gIC8qKlxuICAgKiBDYW5jZWxzIGFuZCByZS10cmllcyBwcm9jZXNzaW5nIHRoZSBjdXJyZW50IHRhc2suXG4gICAqXG4gICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgcHVzaGVkIHRhc2sgaGFzIGJlZW4gcHJvY2Vzc2VkLlxuICAgKi9cblxuXG4gIHJldHJ5KCkge1xuICAgIGxldCBwcm9jZXNzb3I7XG4gICAgcmV0dXJuIHRoaXMuX3JlaWZpZWQudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLl9jYW5jZWwoKTtcblxuICAgICAgcHJvY2Vzc29yID0gdGhpcy5jdXJyZW50UHJvY2Vzc29yO1xuICAgICAgcHJvY2Vzc29yLnJlc2V0KCk7XG4gICAgICByZXR1cm4gdGhpcy5fcGVyc2lzdCgpO1xuICAgIH0pLnRoZW4oKCkgPT4gdGhpcy5fc2V0dGxlKHByb2Nlc3NvciwgdHJ1ZSkpO1xuICB9XG4gIC8qKlxuICAgKiBDYW5jZWxzIGFuZCBkaXNjYXJkcyB0aGUgY3VycmVudCB0YXNrLlxuICAgKlxuICAgKiBJZiBgYXV0b1Byb2Nlc3NgIGlzIGVuYWJsZWQsIHRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IHRyaWdnZXIgcHJvY2Vzc2luZyBvZlxuICAgKiB0aGUgcXVldWUuXG4gICAqL1xuXG5cbiAgc2tpcChlKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlaWZpZWQudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLl9jYW5jZWwoKTtcblxuICAgICAgdGhpcy5fdGFza3Muc2hpZnQoKTtcblxuICAgICAgbGV0IHByb2Nlc3NvciA9IHRoaXMuX3Byb2Nlc3NvcnMuc2hpZnQoKTtcblxuICAgICAgaWYgKHByb2Nlc3NvciAhPT0gdW5kZWZpbmVkICYmICFwcm9jZXNzb3Iuc2V0dGxlZCkge1xuICAgICAgICBwcm9jZXNzb3IucmVqZWN0KGUgfHwgbmV3IEVycm9yKCdQcm9jZXNzaW5nIGNhbmNlbGxlZCB2aWEgYFRhc2tRdWV1ZSNza2lwYCcpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX3BlcnNpc3QoKTtcbiAgICB9KS50aGVuKCgpID0+IHRoaXMuX3NldHRsZSgpKTtcbiAgfVxuICAvKipcbiAgICogQ2FuY2VscyB0aGUgY3VycmVudCB0YXNrIGFuZCBjb21wbGV0ZWx5IGNsZWFycyB0aGUgcXVldWUuXG4gICAqL1xuXG5cbiAgY2xlYXIoZSkge1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fY2FuY2VsKCk7XG5cbiAgICAgIHRoaXMuX3Rhc2tzID0gW107XG5cbiAgICAgIGZvciAobGV0IHByb2Nlc3NvciBvZiB0aGlzLl9wcm9jZXNzb3JzKSB7XG4gICAgICAgIGlmICghcHJvY2Vzc29yLnNldHRsZWQpIHtcbiAgICAgICAgICBwcm9jZXNzb3IucmVqZWN0KGUgfHwgbmV3IEVycm9yKCdQcm9jZXNzaW5nIGNhbmNlbGxlZCB2aWEgYFRhc2tRdWV1ZSNjbGVhcmAnKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5fcHJvY2Vzc29ycyA9IFtdO1xuICAgICAgcmV0dXJuIHRoaXMuX3BlcnNpc3QoKTtcbiAgICB9KS50aGVuKCgpID0+IHRoaXMuX3NldHRsZShudWxsLCB0cnVlKSk7XG4gIH1cbiAgLyoqXG4gICAqIENhbmNlbHMgdGhlIGN1cnJlbnQgdGFzayBhbmQgcmVtb3ZlcyBpdCwgYnV0IGRvZXMgbm90IGNvbnRpbnVlIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIFJldHVybnMgdGhlIGNhbmNlbGVkIGFuZCByZW1vdmVkIHRhc2suXG4gICAqL1xuXG5cbiAgc2hpZnQoZSkge1xuICAgIGxldCB0YXNrO1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fY2FuY2VsKCk7XG5cbiAgICAgIHRhc2sgPSB0aGlzLl90YXNrcy5zaGlmdCgpO1xuXG4gICAgICBsZXQgcHJvY2Vzc29yID0gdGhpcy5fcHJvY2Vzc29ycy5zaGlmdCgpO1xuXG4gICAgICBpZiAocHJvY2Vzc29yICE9PSB1bmRlZmluZWQgJiYgIXByb2Nlc3Nvci5zZXR0bGVkKSB7XG4gICAgICAgIHByb2Nlc3Nvci5yZWplY3QoZSB8fCBuZXcgRXJyb3IoJ1Byb2Nlc3NpbmcgY2FuY2VsbGVkIHZpYSBgVGFza1F1ZXVlI3NoaWZ0YCcpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX3BlcnNpc3QoKTtcbiAgICB9KS50aGVuKCgpID0+IHRhc2spO1xuICB9XG4gIC8qKlxuICAgKiBDYW5jZWxzIHByb2Nlc3NpbmcgdGhlIGN1cnJlbnQgdGFzayBhbmQgaW5zZXJ0cyBhIG5ldyB0YXNrIGF0IHRoZSBiZWdpbm5pbmdcbiAgICogb2YgdGhlIHF1ZXVlLiBUaGlzIG5ldyB0YXNrIHdpbGwgYmUgcHJvY2Vzc2VkIG5leHQuXG4gICAqXG4gICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgbmV3IHRhc2sgaGFzIGJlZW4gcHJvY2Vzc2VkLlxuICAgKi9cblxuXG4gIHVuc2hpZnQodGFzaykge1xuICAgIGxldCBwcm9jZXNzb3IgPSBuZXcgVGFza1Byb2Nlc3Nvcih0aGlzLl9wZXJmb3JtZXIsIHRhc2spO1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fY2FuY2VsKCk7XG5cbiAgICAgIHRoaXMuX3Rhc2tzLnVuc2hpZnQodGFzayk7XG5cbiAgICAgIHRoaXMuX3Byb2Nlc3NvcnMudW5zaGlmdChwcm9jZXNzb3IpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fcGVyc2lzdCgpO1xuICAgIH0pLnRoZW4oKCkgPT4gdGhpcy5fc2V0dGxlKHByb2Nlc3NvcikpO1xuICB9XG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgYWxsIHRoZSB0YXNrcyBpbiB0aGUgcXVldWUuIFJlc29sdmVzIHdoZW4gdGhlIHF1ZXVlIGlzIGVtcHR5LlxuICAgKi9cblxuXG4gIHByb2Nlc3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlaWZpZWQudGhlbigoKSA9PiB7XG4gICAgICBsZXQgcmVzb2x1dGlvbiA9IHRoaXMuX3Jlc29sdXRpb247XG5cbiAgICAgIGlmICghcmVzb2x1dGlvbikge1xuICAgICAgICBpZiAodGhpcy5fdGFza3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgcmVzb2x1dGlvbiA9IHRoaXMuX2NvbXBsZXRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fZXJyb3IgPSBudWxsO1xuICAgICAgICAgIHRoaXMuX3Jlc29sdXRpb24gPSByZXNvbHV0aW9uID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3QgPSByZWplY3Q7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB0aGlzLl9zZXR0bGVFYWNoKHJlc29sdXRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXNvbHV0aW9uO1xuICAgIH0pO1xuICB9XG5cbiAgX3NldHRsZShwcm9jZXNzb3IsIGFsd2F5c1Byb2Nlc3MpIHtcbiAgICBpZiAodGhpcy5hdXRvUHJvY2VzcyB8fCBhbHdheXNQcm9jZXNzKSB7XG4gICAgICBsZXQgc2V0dGxlID0gcHJvY2Vzc29yID8gKCkgPT4gcHJvY2Vzc29yLnNldHRsZSgpIDogKCkgPT4ge307XG4gICAgICByZXR1cm4gdGhpcy5wcm9jZXNzKCkudGhlbihzZXR0bGUsIHNldHRsZSk7XG4gICAgfSBlbHNlIGlmIChwcm9jZXNzb3IpIHtcbiAgICAgIHJldHVybiBwcm9jZXNzb3Iuc2V0dGxlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gIH1cblxuICBfY29tcGxldGUoKSB7XG4gICAgaWYgKHRoaXMuX3Jlc29sdmUpIHtcbiAgICAgIHRoaXMuX3Jlc29sdmUoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9yZXNvbHZlID0gbnVsbDtcbiAgICB0aGlzLl9yZWplY3QgPSBudWxsO1xuICAgIHRoaXMuX2Vycm9yID0gbnVsbDtcbiAgICB0aGlzLl9yZXNvbHV0aW9uID0gbnVsbDtcbiAgICByZXR1cm4gc2V0dGxlSW5TZXJpZXModGhpcywgJ2NvbXBsZXRlJyk7XG4gIH1cblxuICBfZmFpbCh0YXNrLCBlKSB7XG4gICAgaWYgKHRoaXMuX3JlamVjdCkge1xuICAgICAgdGhpcy5fcmVqZWN0KGUpO1xuICAgIH1cblxuICAgIHRoaXMuX3Jlc29sdmUgPSBudWxsO1xuICAgIHRoaXMuX3JlamVjdCA9IG51bGw7XG4gICAgdGhpcy5fZXJyb3IgPSBlO1xuICAgIHRoaXMuX3Jlc29sdXRpb24gPSBudWxsO1xuICAgIHJldHVybiBzZXR0bGVJblNlcmllcyh0aGlzLCAnZmFpbCcsIHRhc2ssIGUpO1xuICB9XG5cbiAgX2NhbmNlbCgpIHtcbiAgICB0aGlzLl9lcnJvciA9IG51bGw7XG4gICAgdGhpcy5fcmVzb2x1dGlvbiA9IG51bGw7XG4gIH1cblxuICBfc2V0dGxlRWFjaChyZXNvbHV0aW9uKSB7XG4gICAgaWYgKHRoaXMuX3Rhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbXBsZXRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB0YXNrID0gdGhpcy5fdGFza3NbMF07XG4gICAgICBsZXQgcHJvY2Vzc29yID0gdGhpcy5fcHJvY2Vzc29yc1swXTtcbiAgICAgIHJldHVybiBzZXR0bGVJblNlcmllcyh0aGlzLCAnYmVmb3JlVGFzaycsIHRhc2spLnRoZW4oKCkgPT4gcHJvY2Vzc29yLnByb2Nlc3MoKSkudGhlbigoKSA9PiB7XG4gICAgICAgIGlmIChyZXNvbHV0aW9uID09PSB0aGlzLl9yZXNvbHV0aW9uKSB7XG4gICAgICAgICAgdGhpcy5fdGFza3Muc2hpZnQoKTtcblxuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NvcnMuc2hpZnQoKTtcblxuICAgICAgICAgIHJldHVybiB0aGlzLl9wZXJzaXN0KCkudGhlbigoKSA9PiBzZXR0bGVJblNlcmllcyh0aGlzLCAndGFzaycsIHRhc2spKS50aGVuKCgpID0+IHRoaXMuX3NldHRsZUVhY2gocmVzb2x1dGlvbikpO1xuICAgICAgICB9XG4gICAgICB9KS5jYXRjaChlID0+IHtcbiAgICAgICAgaWYgKHJlc29sdXRpb24gPT09IHRoaXMuX3Jlc29sdXRpb24pIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZmFpbCh0YXNrLCBlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgX3JlaWZ5KCkge1xuICAgIHRoaXMuX3Rhc2tzID0gW107XG4gICAgdGhpcy5fcHJvY2Vzc29ycyA9IFtdO1xuXG4gICAgaWYgKHRoaXMuX2J1Y2tldCkge1xuICAgICAgdGhpcy5fcmVpZmllZCA9IHRoaXMuX2J1Y2tldC5nZXRJdGVtKHRoaXMuX25hbWUpLnRoZW4odGFza3MgPT4ge1xuICAgICAgICBpZiAodGFza3MpIHtcbiAgICAgICAgICB0aGlzLl90YXNrcyA9IHRhc2tzO1xuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NvcnMgPSB0YXNrcy5tYXAodGFzayA9PiBuZXcgVGFza1Byb2Nlc3Nvcih0aGlzLl9wZXJmb3JtZXIsIHRhc2spKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlaWZpZWQgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcmVpZmllZDtcbiAgfVxuXG4gIF9wZXJzaXN0KCkge1xuICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG5cbiAgICBpZiAodGhpcy5fYnVja2V0KSB7XG4gICAgICByZXR1cm4gdGhpcy5fYnVja2V0LnNldEl0ZW0odGhpcy5fbmFtZSwgdGhpcy5fdGFza3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICB9XG5cbn07XG5UYXNrUXVldWUgPSBfX2RlY29yYXRlKFtldmVudGVkXSwgVGFza1F1ZXVlKTtcbmV4cG9ydCBkZWZhdWx0IFRhc2tRdWV1ZTsiXX0=