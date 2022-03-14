"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _main = _interopRequireDefault(require("./main"));

var _taskProcessor = _interopRequireDefault(require("./task-processor"));

var _evented = _interopRequireWildcard(require("./evented"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
    if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  }
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var assert = _main.default.assert;
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

    var processor = new _taskProcessor.default(this._performer, task);
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

    var processor = new _taskProcessor.default(this._performer, task);
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
    return (0, _evented.settleInSeries)(this, 'complete');
  };

  _proto._fail = function _fail(task, e) {
    if (this._reject) {
      this._reject(e);
    }

    this._resolve = null;
    this._reject = null;
    this._error = e;
    this._resolution = null;
    return (0, _evented.settleInSeries)(this, 'fail', task, e);
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
      return (0, _evented.settleInSeries)(this, 'beforeTask', task).then(function () {
        return processor.process();
      }).then(function () {
        if (resolution === _this9._resolution) {
          _this9._tasks.shift();

          _this9._processors.shift();

          return _this9._persist().then(function () {
            return (0, _evented.settleInSeries)(_this9, 'task', task);
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
            return new _taskProcessor.default(_this10._performer, task);
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

TaskQueue = __decorate([_evented.default], TaskQueue);
var _default = TaskQueue;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRhc2stcXVldWUuanMiXSwibmFtZXMiOlsiX19kZWNvcmF0ZSIsImMiLCJhcmd1bWVudHMiLCJyIiwiZGVzYyIsIk9iamVjdCIsIlJlZmxlY3QiLCJpIiwiZGVjb3JhdG9ycyIsImQiLCJhc3NlcnQiLCJPcmJpdCIsIlRhc2tRdWV1ZSIsInNldHRpbmdzIiwicHJvY2Vzc29yIiwicHVzaCIsInJldHJ5Iiwic2tpcCIsImUiLCJjbGVhciIsInNoaWZ0IiwidGFzayIsInVuc2hpZnQiLCJwcm9jZXNzIiwicmVzb2x1dGlvbiIsIl9zZXR0bGUiLCJzZXR0bGUiLCJQcm9taXNlIiwiX2NvbXBsZXRlIiwic2V0dGxlSW5TZXJpZXMiLCJfZmFpbCIsIl9jYW5jZWwiLCJfc2V0dGxlRWFjaCIsIl9yZWlmeSIsIl9wZXJzaXN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBUUE7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFWQSxJQUFJQSxVQUFVLEdBQUcsVUFBUSxTQUFSLFVBQUEsSUFBMkIsVUFBQSxVQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQXlDO0FBQ25GLE1BQUlDLENBQUMsR0FBR0MsU0FBUyxDQUFqQixNQUFBO0FBQUEsTUFDSUMsQ0FBQyxHQUFHRixDQUFDLEdBQURBLENBQUFBLEdBQUFBLE1BQUFBLEdBQWlCRyxJQUFJLEtBQUpBLElBQUFBLEdBQWdCQSxJQUFJLEdBQUdDLE1BQU0sQ0FBTkEsd0JBQUFBLENBQUFBLE1BQUFBLEVBQXZCRCxHQUF1QkMsQ0FBdkJELEdBRHpCLElBQUE7QUFBQSxNQUFBLENBQUE7QUFHQSxNQUFJLE9BQUEsT0FBQSxLQUFBLFFBQUEsSUFBK0IsT0FBT0UsT0FBTyxDQUFkLFFBQUEsS0FBbkMsVUFBQSxFQUEyRUgsQ0FBQyxHQUFHRyxPQUFPLENBQVBBLFFBQUFBLENBQUFBLFVBQUFBLEVBQUFBLE1BQUFBLEVBQUFBLEdBQUFBLEVBQS9FLElBQStFQSxDQUFKSCxDQUEzRSxLQUFvSSxL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ZixVQUFNYixTQUFTLEdBQUcsS0FBbEIsZ0JBQUE7QUFDQSxhQUFPQSxTQUFTLEtBQVRBLFNBQUFBLElBQTJCQSxTQUFTLENBQXBDQSxPQUFBQSxJQUFnRCxDQUFDQSxTQUFTLENBQWpFLE9BQUE7QUFDRDtBQUNEOzs7OztBQXpHVyxHQUFBLEVBQUE7QUFBQSxJQUFBLEdBQUEsRUFBQSxTQUFBO0FBQUEsSUFBQSxHQUFBLEVBQUEsWUErR0c7QUFDWixhQUFPLEtBQVAsUUFBQTtBQUNEO0FBakhVLEdBQUEsQ0FBQSxDQUFBOztBQUFBLFNBQUEsU0FBQTtBQUFiLENBQWEsRUFBYjs7QUFvV0FGLFNBQVMsR0FBR1osVUFBVSxDQUFDLENBQUQsZ0JBQUMsQ0FBRCxFQUF0QlksU0FBc0IsQ0FBdEJBO2VBQ0EsUyIsInNvdXJjZXNDb250ZW50IjpbInZhciBfX2RlY29yYXRlID0gdGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgICAgIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLFxuICAgICAgZDtcbiAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcblxuaW1wb3J0IE9yYml0IGZyb20gJy4vbWFpbic7XG5pbXBvcnQgVGFza1Byb2Nlc3NvciBmcm9tICcuL3Rhc2stcHJvY2Vzc29yJztcbmltcG9ydCBldmVudGVkLCB7IHNldHRsZUluU2VyaWVzIH0gZnJvbSAnLi9ldmVudGVkJztcbmNvbnN0IHtcbiAgYXNzZXJ0XG59ID0gT3JiaXQ7XG4vKipcbiAqIGBUYXNrUXVldWVgIGlzIGEgRklGTyBxdWV1ZSBvZiBhc3luY2hyb25vdXMgdGFza3MgdGhhdCBzaG91bGQgYmVcbiAqIHBlcmZvcm1lZCBzZXF1ZW50aWFsbHkuXG4gKlxuICogVGFza3MgYXJlIGFkZGVkIHRvIHRoZSBxdWV1ZSB3aXRoIGBwdXNoYC4gRWFjaCB0YXNrIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5XG4gKiBjYWxsaW5nIGl0cyBgcHJvY2Vzc2AgbWV0aG9kLlxuICpcbiAqIEJ5IGRlZmF1bHQsIHRhc2sgcXVldWVzIHdpbGwgYmUgcHJvY2Vzc2VkIGF1dG9tYXRpY2FsbHksIGFzIHNvb24gYXMgdGFza3NcbiAqIGFyZSBwdXNoZWQgdG8gdGhlbS4gVGhpcyBjYW4gYmUgb3ZlcnJpZGRlbiBieSBzZXR0aW5nIHRoZSBgYXV0b1Byb2Nlc3NgXG4gKiBzZXR0aW5nIHRvIGBmYWxzZWAgYW5kIGNhbGxpbmcgYHByb2Nlc3NgIHdoZW4geW91J2QgbGlrZSB0byBzdGFydFxuICogcHJvY2Vzc2luZy5cbiAqL1xuXG5sZXQgVGFza1F1ZXVlID0gY2xhc3MgVGFza1F1ZXVlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgYFRhc2tRdWV1ZWAuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih0YXJnZXQsIHNldHRpbmdzID0ge30pIHtcbiAgICB0aGlzLl9wZXJmb3JtZXIgPSB0YXJnZXQ7XG4gICAgdGhpcy5fbmFtZSA9IHNldHRpbmdzLm5hbWU7XG4gICAgdGhpcy5fYnVja2V0ID0gc2V0dGluZ3MuYnVja2V0O1xuICAgIHRoaXMuYXV0b1Byb2Nlc3MgPSBzZXR0aW5ncy5hdXRvUHJvY2VzcyA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IHNldHRpbmdzLmF1dG9Qcm9jZXNzO1xuXG4gICAgaWYgKHRoaXMuX2J1Y2tldCkge1xuICAgICAgYXNzZXJ0KCdUYXNrUXVldWUgcmVxdWlyZXMgYSBuYW1lIGlmIGl0IGhhcyBhIGJ1Y2tldCcsICEhdGhpcy5fbmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5fcmVpZnkoKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA+IDAgJiYgdGhpcy5hdXRvUHJvY2Vzcykge1xuICAgICAgICB0aGlzLnByb2Nlc3MoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogTmFtZSB1c2VkIGZvciB0cmFja2luZyAvIGRlYnVnZ2luZyB0aGlzIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgb2JqZWN0IHdoaWNoIHdpbGwgYHBlcmZvcm1gIHRoZSB0YXNrcyBpbiB0aGlzIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBwZXJmb3JtZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BlcmZvcm1lcjtcbiAgfVxuICAvKipcbiAgICogQSBidWNrZXQgdXNlZCB0byBwZXJzaXN0IHRoZSBzdGF0ZSBvZiB0aGlzIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBidWNrZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Y2tldDtcbiAgfVxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiB0YXNrcyBpbiB0aGUgcXVldWUuXG4gICAqL1xuXG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdGFza3MgPyB0aGlzLl90YXNrcy5sZW5ndGggOiAwO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgdGFza3MgaW4gdGhlIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBlbnRyaWVzKCkge1xuICAgIHJldHVybiB0aGlzLl90YXNrcztcbiAgfVxuICAvKipcbiAgICogVGhlIGN1cnJlbnQgdGFzayBiZWluZyBwcm9jZXNzZWQgKGlmIGFjdGl2ZWx5IHByb2Nlc3NpbmcpLCBvciB0aGUgbmV4dFxuICAgKiB0YXNrIHRvIGJlIHByb2Nlc3NlZCAoaWYgbm90IGFjdGl2ZWx5IHByb2Nlc3NpbmcpLlxuICAgKi9cblxuXG4gIGdldCBjdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLl90YXNrcyAmJiB0aGlzLl90YXNrc1swXTtcbiAgfVxuICAvKipcbiAgICogVGhlIHByb2Nlc3NvciB3cmFwcGVyIHRoYXQgaXMgcHJvY2Vzc2luZyB0aGUgY3VycmVudCB0YXNrIChvciBuZXh0IHRhc2ssXG4gICAqIGlmIG5vbmUgYXJlIGJlaW5nIHByb2Nlc3NlZCkuXG4gICAqL1xuXG5cbiAgZ2V0IGN1cnJlbnRQcm9jZXNzb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb2Nlc3NvcnMgJiYgdGhpcy5fcHJvY2Vzc29yc1swXTtcbiAgfVxuICAvKipcbiAgICogSWYgYW4gZXJyb3Igb2NjdXJzIHdoaWxlIHByb2Nlc3NpbmcgYSB0YXNrLCBwcm9jZXNzaW5nIHdpbGwgYmUgaGFsdGVkLCB0aGVcbiAgICogYGZhaWxgIGV2ZW50IHdpbGwgYmUgZW1pdHRlZCwgYW5kIHRoaXMgcHJvcGVydHkgd2lsbCByZWZsZWN0IHRoZSBlcnJvclxuICAgKiBlbmNvdW50ZXJlZC5cbiAgICovXG5cblxuICBnZXQgZXJyb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Vycm9yO1xuICB9XG4gIC8qKlxuICAgKiBJcyB0aGUgcXVldWUgZW1wdHk/XG4gICAqL1xuXG5cbiAgZ2V0IGVtcHR5KCkge1xuICAgIHJldHVybiB0aGlzLmxlbmd0aCA9PT0gMDtcbiAgfVxuICAvKipcbiAgICogSXMgdGhlIHF1ZXVlIGFjdGl2ZWx5IHByb2Nlc3NpbmcgYSB0YXNrP1xuICAgKi9cblxuXG4gIGdldCBwcm9jZXNzaW5nKCkge1xuICAgIGNvbnN0IHByb2Nlc3NvciA9IHRoaXMuY3VycmVudFByb2Nlc3NvcjtcbiAgICByZXR1cm4gcHJvY2Vzc29yICE9PSB1bmRlZmluZWQgJiYgcHJvY2Vzc29yLnN0YXJ0ZWQgJiYgIXByb2Nlc3Nvci5zZXR0bGVkO1xuICB9XG4gIC8qKlxuICAgKiBSZXNvbHZlcyB3aGVuIHRoZSBxdWV1ZSBoYXMgYmVlbiBmdWxseSByZWlmaWVkIGZyb20gaXRzIGFzc29jaWF0ZWQgYnVja2V0LFxuICAgKiBpZiBhcHBsaWNhYmxlLlxuICAgKi9cblxuXG4gIGdldCByZWlmaWVkKCkge1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkO1xuICB9XG4gIC8qKlxuICAgKiBQdXNoIGEgbmV3IHRhc2sgb250byB0aGUgZW5kIG9mIHRoZSBxdWV1ZS5cbiAgICpcbiAgICogSWYgYGF1dG9Qcm9jZXNzYCBpcyBlbmFibGVkLCB0aGlzIHdpbGwgYXV0b21hdGljYWxseSB0cmlnZ2VyIHByb2Nlc3Npbmcgb2ZcbiAgICogdGhlIHF1ZXVlLlxuICAgKlxuICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHB1c2hlZCB0YXNrIGhhcyBiZWVuIHByb2Nlc3NlZC5cbiAgICovXG5cblxuICBwdXNoKHRhc2spIHtcbiAgICBsZXQgcHJvY2Vzc29yID0gbmV3IFRhc2tQcm9jZXNzb3IodGhpcy5fcGVyZm9ybWVyLCB0YXNrKTtcbiAgICByZXR1cm4gdGhpcy5fcmVpZmllZC50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3Rhc2tzLnB1c2godGFzayk7XG5cbiAgICAgIHRoaXMuX3Byb2Nlc3NvcnMucHVzaChwcm9jZXNzb3IpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fcGVyc2lzdCgpO1xuICAgIH0pLnRoZW4oKCkgPT4gdGhpcy5fc2V0dGxlKHByb2Nlc3NvcikpO1xuICB9XG4gIC8qKlxuICAgKiBDYW5jZWxzIGFuZCByZS10cmllcyBwcm9jZXNzaW5nIHRoZSBjdXJyZW50IHRhc2suXG4gICAqXG4gICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgcHVzaGVkIHRhc2sgaGFzIGJlZW4gcHJvY2Vzc2VkLlxuICAgKi9cblxuXG4gIHJldHJ5KCkge1xuICAgIGxldCBwcm9jZXNzb3I7XG4gICAgcmV0dXJuIHRoaXMuX3JlaWZpZWQudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLl9jYW5jZWwoKTtcblxuICAgICAgcHJvY2Vzc29yID0gdGhpcy5jdXJyZW50UHJvY2Vzc29yO1xuICAgICAgcHJvY2Vzc29yLnJlc2V0KCk7XG4gICAgICByZXR1cm4gdGhpcy5fcGVyc2lzdCgpO1xuICAgIH0pLnRoZW4oKCkgPT4gdGhpcy5fc2V0dGxlKHByb2Nlc3NvciwgdHJ1ZSkpO1xuICB9XG4gIC8qKlxuICAgKiBDYW5jZWxzIGFuZCBkaXNjYXJkcyB0aGUgY3VycmVudCB0YXNrLlxuICAgKlxuICAgKiBJZiBgYXV0b1Byb2Nlc3NgIGlzIGVuYWJsZWQsIHRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IHRyaWdnZXIgcHJvY2Vzc2luZyBvZlxuICAgKiB0aGUgcXVldWUuXG4gICAqL1xuXG5cbiAgc2tpcChlKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlaWZpZWQudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLl9jYW5jZWwoKTtcblxuICAgICAgdGhpcy5fdGFza3Muc2hpZnQoKTtcblxuICAgICAgbGV0IHByb2Nlc3NvciA9IHRoaXMuX3Byb2Nlc3NvcnMuc2hpZnQoKTtcblxuICAgICAgaWYgKHByb2Nlc3NvciAhPT0gdW5kZWZpbmVkICYmICFwcm9jZXNzb3Iuc2V0dGxlZCkge1xuICAgICAgICBwcm9jZXNzb3IucmVqZWN0KGUgfHwgbmV3IEVycm9yKCdQcm9jZXNzaW5nIGNhbmNlbGxlZCB2aWEgYFRhc2tRdWV1ZSNza2lwYCcpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX3BlcnNpc3QoKTtcbiAgICB9KS50aGVuKCgpID0+IHRoaXMuX3NldHRsZSgpKTtcbiAgfVxuICAvKipcbiAgICogQ2FuY2VscyB0aGUgY3VycmVudCB0YXNrIGFuZCBjb21wbGV0ZWx5IGNsZWFycyB0aGUgcXVldWUuXG4gICAqL1xuXG5cbiAgY2xlYXIoZSkge1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fY2FuY2VsKCk7XG5cbiAgICAgIHRoaXMuX3Rhc2tzID0gW107XG5cbiAgICAgIGZvciAobGV0IHByb2Nlc3NvciBvZiB0aGlzLl9wcm9jZXNzb3JzKSB7XG4gICAgICAgIGlmICghcHJvY2Vzc29yLnNldHRsZWQpIHtcbiAgICAgICAgICBwcm9jZXNzb3IucmVqZWN0KGUgfHwgbmV3IEVycm9yKCdQcm9jZXNzaW5nIGNhbmNlbGxlZCB2aWEgYFRhc2tRdWV1ZSNjbGVhcmAnKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5fcHJvY2Vzc29ycyA9IFtdO1xuICAgICAgcmV0dXJuIHRoaXMuX3BlcnNpc3QoKTtcbiAgICB9KS50aGVuKCgpID0+IHRoaXMuX3NldHRsZShudWxsLCB0cnVlKSk7XG4gIH1cbiAgLyoqXG4gICAqIENhbmNlbHMgdGhlIGN1cnJlbnQgdGFzayBhbmQgcmVtb3ZlcyBpdCwgYnV0IGRvZXMgbm90IGNvbnRpbnVlIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIFJldHVybnMgdGhlIGNhbmNlbGVkIGFuZCByZW1vdmVkIHRhc2suXG4gICAqL1xuXG5cbiAgc2hpZnQoZSkge1xuICAgIGxldCB0YXNrO1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fY2FuY2VsKCk7XG5cbiAgICAgIHRhc2sgPSB0aGlzLl90YXNrcy5zaGlmdCgpO1xuXG4gICAgICBsZXQgcHJvY2Vzc29yID0gdGhpcy5fcHJvY2Vzc29ycy5zaGlmdCgpO1xuXG4gICAgICBpZiAocHJvY2Vzc29yICE9PSB1bmRlZmluZWQgJiYgIXByb2Nlc3Nvci5zZXR0bGVkKSB7XG4gICAgICAgIHByb2Nlc3Nvci5yZWplY3QoZSB8fCBuZXcgRXJyb3IoJ1Byb2Nlc3NpbmcgY2FuY2VsbGVkIHZpYSBgVGFza1F1ZXVlI3NoaWZ0YCcpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX3BlcnNpc3QoKTtcbiAgICB9KS50aGVuKCgpID0+IHRhc2spO1xuICB9XG4gIC8qKlxuICAgKiBDYW5jZWxzIHByb2Nlc3NpbmcgdGhlIGN1cnJlbnQgdGFzayBhbmQgaW5zZXJ0cyBhIG5ldyB0YXNrIGF0IHRoZSBiZWdpbm5pbmdcbiAgICogb2YgdGhlIHF1ZXVlLiBUaGlzIG5ldyB0YXNrIHdpbGwgYmUgcHJvY2Vzc2VkIG5leHQuXG4gICAqXG4gICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgbmV3IHRhc2sgaGFzIGJlZW4gcHJvY2Vzc2VkLlxuICAgKi9cblxuXG4gIHVuc2hpZnQodGFzaykge1xuICAgIGxldCBwcm9jZXNzb3IgPSBuZXcgVGFza1Byb2Nlc3Nvcih0aGlzLl9wZXJmb3JtZXIsIHRhc2spO1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fY2FuY2VsKCk7XG5cbiAgICAgIHRoaXMuX3Rhc2tzLnVuc2hpZnQodGFzayk7XG5cbiAgICAgIHRoaXMuX3Byb2Nlc3NvcnMudW5zaGlmdChwcm9jZXNzb3IpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fcGVyc2lzdCgpO1xuICAgIH0pLnRoZW4oKCkgPT4gdGhpcy5fc2V0dGxlKHByb2Nlc3NvcikpO1xuICB9XG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgYWxsIHRoZSB0YXNrcyBpbiB0aGUgcXVldWUuIFJlc29sdmVzIHdoZW4gdGhlIHF1ZXVlIGlzIGVtcHR5LlxuICAgKi9cblxuXG4gIHByb2Nlc3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlaWZpZWQudGhlbigoKSA9PiB7XG4gICAgICBsZXQgcmVzb2x1dGlvbiA9IHRoaXMuX3Jlc29sdXRpb247XG5cbiAgICAgIGlmICghcmVzb2x1dGlvbikge1xuICAgICAgICBpZiAodGhpcy5fdGFza3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgcmVzb2x1dGlvbiA9IHRoaXMuX2NvbXBsZXRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fZXJyb3IgPSBudWxsO1xuICAgICAgICAgIHRoaXMuX3Jlc29sdXRpb24gPSByZXNvbHV0aW9uID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3QgPSByZWplY3Q7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB0aGlzLl9zZXR0bGVFYWNoKHJlc29sdXRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXNvbHV0aW9uO1xuICAgIH0pO1xuICB9XG5cbiAgX3NldHRsZShwcm9jZXNzb3IsIGFsd2F5c1Byb2Nlc3MpIHtcbiAgICBpZiAodGhpcy5hdXRvUHJvY2VzcyB8fCBhbHdheXNQcm9jZXNzKSB7XG4gICAgICBsZXQgc2V0dGxlID0gcHJvY2Vzc29yID8gKCkgPT4gcHJvY2Vzc29yLnNldHRsZSgpIDogKCkgPT4ge307XG4gICAgICByZXR1cm4gdGhpcy5wcm9jZXNzKCkudGhlbihzZXR0bGUsIHNldHRsZSk7XG4gICAgfSBlbHNlIGlmIChwcm9jZXNzb3IpIHtcbiAgICAgIHJldHVybiBwcm9jZXNzb3Iuc2V0dGxlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gIH1cblxuICBfY29tcGxldGUoKSB7XG4gICAgaWYgKHRoaXMuX3Jlc29sdmUpIHtcbiAgICAgIHRoaXMuX3Jlc29sdmUoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9yZXNvbHZlID0gbnVsbDtcbiAgICB0aGlzLl9yZWplY3QgPSBudWxsO1xuICAgIHRoaXMuX2Vycm9yID0gbnVsbDtcbiAgICB0aGlzLl9yZXNvbHV0aW9uID0gbnVsbDtcbiAgICByZXR1cm4gc2V0dGxlSW5TZXJpZXModGhpcywgJ2NvbXBsZXRlJyk7XG4gIH1cblxuICBfZmFpbCh0YXNrLCBlKSB7XG4gICAgaWYgKHRoaXMuX3JlamVjdCkge1xuICAgICAgdGhpcy5fcmVqZWN0KGUpO1xuICAgIH1cblxuICAgIHRoaXMuX3Jlc29sdmUgPSBudWxsO1xuICAgIHRoaXMuX3JlamVjdCA9IG51bGw7XG4gICAgdGhpcy5fZXJyb3IgPSBlO1xuICAgIHRoaXMuX3Jlc29sdXRpb24gPSBudWxsO1xuICAgIHJldHVybiBzZXR0bGVJblNlcmllcyh0aGlzLCAnZmFpbCcsIHRhc2ssIGUpO1xuICB9XG5cbiAgX2NhbmNlbCgpIHtcbiAgICB0aGlzLl9lcnJvciA9IG51bGw7XG4gICAgdGhpcy5fcmVzb2x1dGlvbiA9IG51bGw7XG4gIH1cblxuICBfc2V0dGxlRWFjaChyZXNvbHV0aW9uKSB7XG4gICAgaWYgKHRoaXMuX3Rhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbXBsZXRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB0YXNrID0gdGhpcy5fdGFza3NbMF07XG4gICAgICBsZXQgcHJvY2Vzc29yID0gdGhpcy5fcHJvY2Vzc29yc1swXTtcbiAgICAgIHJldHVybiBzZXR0bGVJblNlcmllcyh0aGlzLCAnYmVmb3JlVGFzaycsIHRhc2spLnRoZW4oKCkgPT4gcHJvY2Vzc29yLnByb2Nlc3MoKSkudGhlbigoKSA9PiB7XG4gICAgICAgIGlmIChyZXNvbHV0aW9uID09PSB0aGlzLl9yZXNvbHV0aW9uKSB7XG4gICAgICAgICAgdGhpcy5fdGFza3Muc2hpZnQoKTtcblxuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NvcnMuc2hpZnQoKTtcblxuICAgICAgICAgIHJldHVybiB0aGlzLl9wZXJzaXN0KCkudGhlbigoKSA9PiBzZXR0bGVJblNlcmllcyh0aGlzLCAndGFzaycsIHRhc2spKS50aGVuKCgpID0+IHRoaXMuX3NldHRsZUVhY2gocmVzb2x1dGlvbikpO1xuICAgICAgICB9XG4gICAgICB9KS5jYXRjaChlID0+IHtcbiAgICAgICAgaWYgKHJlc29sdXRpb24gPT09IHRoaXMuX3Jlc29sdXRpb24pIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZmFpbCh0YXNrLCBlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgX3JlaWZ5KCkge1xuICAgIHRoaXMuX3Rhc2tzID0gW107XG4gICAgdGhpcy5fcHJvY2Vzc29ycyA9IFtdO1xuXG4gICAgaWYgKHRoaXMuX2J1Y2tldCkge1xuICAgICAgdGhpcy5fcmVpZmllZCA9IHRoaXMuX2J1Y2tldC5nZXRJdGVtKHRoaXMuX25hbWUpLnRoZW4odGFza3MgPT4ge1xuICAgICAgICBpZiAodGFza3MpIHtcbiAgICAgICAgICB0aGlzLl90YXNrcyA9IHRhc2tzO1xuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NvcnMgPSB0YXNrcy5tYXAodGFzayA9PiBuZXcgVGFza1Byb2Nlc3Nvcih0aGlzLl9wZXJmb3JtZXIsIHRhc2spKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlaWZpZWQgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcmVpZmllZDtcbiAgfVxuXG4gIF9wZXJzaXN0KCkge1xuICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG5cbiAgICBpZiAodGhpcy5fYnVja2V0KSB7XG4gICAgICByZXR1cm4gdGhpcy5fYnVja2V0LnNldEl0ZW0odGhpcy5fbmFtZSwgdGhpcy5fdGFza3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICB9XG5cbn07XG5UYXNrUXVldWUgPSBfX2RlY29yYXRlKFtldmVudGVkXSwgVGFza1F1ZXVlKTtcbmV4cG9ydCBkZWZhdWx0IFRhc2tRdWV1ZTsiXX0=