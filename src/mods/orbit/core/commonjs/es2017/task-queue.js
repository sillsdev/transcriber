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

var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

const {
  assert
} = _main.default;
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

let TaskQueue = class TaskQueue {
  /**
   * Creates an instance of `TaskQueue`.
   */
  constructor(target, settings = {}) {
    this._performer = target;
    this._name = settings.name;
    this._bucket = settings.bucket;
    this.autoProcess = settings.autoProcess === undefined ? true : settings.autoProcess;

    if (this._bucket) {
      assert('TaskQueue requires a name if it has a bucket', !!this._name);
    }

    this._reify().then(() => {
      if (this.length > 0 && this.autoProcess) {
        this.process();
      }
    });
  }
  /**
   * Name used for tracking / debugging this queue.
   */


  get name() {
    return this._name;
  }
  /**
   * The object which will `perform` the tasks in this queue.
   */


  get performer() {
    return this._performer;
  }
  /**
   * A bucket used to persist the state of this queue.
   */


  get bucket() {
    return this._bucket;
  }
  /**
   * The number of tasks in the queue.
   */


  get length() {
    return this._tasks ? this._tasks.length : 0;
  }
  /**
   * The tasks in the queue.
   */


  get entries() {
    return this._tasks;
  }
  /**
   * The current task being processed (if actively processing), or the next
   * task to be processed (if not actively processing).
   */


  get current() {
    return this._tasks && this._tasks[0];
  }
  /**
   * The processor wrapper that is processing the current task (or next task,
   * if none are being processed).
   */


  get currentProcessor() {
    return this._processors && this._processors[0];
  }
  /**
   * If an error occurs while processing a task, processing will be halted, the
   * `fail` event will be emitted, and this property will reflect the error
   * encountered.
   */


  get error() {
    return this._error;
  }
  /**
   * Is the queue empty?
   */


  get empty() {
    return this.length === 0;
  }
  /**
   * Is the queue actively processing a task?
   */


  get processing() {
    const processor = this.currentProcessor;
    return processor !== undefined && processor.started && !processor.settled;
  }
  /**
   * Resolves when the queue has been fully reified from its associated bucket,
   * if applicable.
   */


  get reified() {
    return this._reified;
  }
  /**
   * Push a new task onto the end of the queue.
   *
   * If `autoProcess` is enabled, this will automatically trigger processing of
   * the queue.
   *
   * Returns a promise that resolves when the pushed task has been processed.
   */


  push(task) {
    let processor = new _taskProcessor.default(this._performer, task);
    return this._reified.then(() => {
      this._tasks.push(task);

      this._processors.push(processor);

      return this._persist();
    }).then(() => this._settle(processor));
  }
  /**
   * Cancels and re-tries processing the current task.
   *
   * Returns a promise that resolves when the pushed task has been processed.
   */


  retry() {
    let processor;
    return this._reified.then(() => {
      this._cancel();

      processor = this.currentProcessor;
      processor.reset();
      return this._persist();
    }).then(() => this._settle(processor, true));
  }
  /**
   * Cancels and discards the current task.
   *
   * If `autoProcess` is enabled, this will automatically trigger processing of
   * the queue.
   */


  skip(e) {
    return this._reified.then(() => {
      this._cancel();

      this._tasks.shift();

      let processor = this._processors.shift();

      if (processor !== undefined && !processor.settled) {
        processor.reject(e || new Error('Processing cancelled via `TaskQueue#skip`'));
      }

      return this._persist();
    }).then(() => this._settle());
  }
  /**
   * Cancels the current task and completely clears the queue.
   */


  clear(e) {
    return this._reified.then(() => {
      this._cancel();

      this._tasks = [];

      for (let processor of this._processors) {
        if (!processor.settled) {
          processor.reject(e || new Error('Processing cancelled via `TaskQueue#clear`'));
        }
      }

      this._processors = [];
      return this._persist();
    }).then(() => this._settle(null, true));
  }
  /**
   * Cancels the current task and removes it, but does not continue processing.
   *
   * Returns the canceled and removed task.
   */


  shift(e) {
    let task;
    return this._reified.then(() => {
      this._cancel();

      task = this._tasks.shift();

      let processor = this._processors.shift();

      if (processor !== undefined && !processor.settled) {
        processor.reject(e || new Error('Processing cancelled via `TaskQueue#shift`'));
      }

      return this._persist();
    }).then(() => task);
  }
  /**
   * Cancels processing the current task and inserts a new task at the beginning
   * of the queue. This new task will be processed next.
   *
   * Returns a promise that resolves when the new task has been processed.
   */


  unshift(task) {
    let processor = new _taskProcessor.default(this._performer, task);
    return this._reified.then(() => {
      this._cancel();

      this._tasks.unshift(task);

      this._processors.unshift(processor);

      return this._persist();
    }).then(() => this._settle(processor));
  }
  /**
   * Processes all the tasks in the queue. Resolves when the queue is empty.
   */


  process() {
    return this._reified.then(() => {
      let resolution = this._resolution;

      if (!resolution) {
        if (this._tasks.length === 0) {
          resolution = this._complete();
        } else {
          this._error = null;
          this._resolution = resolution = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
          });

          this._settleEach(resolution);
        }
      }

      return resolution;
    });
  }

  _settle(processor, alwaysProcess) {
    if (this.autoProcess || alwaysProcess) {
      let settle = processor ? () => processor.settle() : () => {};
      return this.process().then(settle, settle);
    } else if (processor) {
      return processor.settle();
    } else {
      return Promise.resolve();
    }
  }

  _complete() {
    if (this._resolve) {
      this._resolve();
    }

    this._resolve = null;
    this._reject = null;
    this._error = null;
    this._resolution = null;
    return (0, _evented.settleInSeries)(this, 'complete');
  }

  _fail(task, e) {
    if (this._reject) {
      this._reject(e);
    }

    this._resolve = null;
    this._reject = null;
    this._error = e;
    this._resolution = null;
    return (0, _evented.settleInSeries)(this, 'fail', task, e);
  }

  _cancel() {
    this._error = null;
    this._resolution = null;
  }

  _settleEach(resolution) {
    if (this._tasks.length === 0) {
      return this._complete();
    } else {
      let task = this._tasks[0];
      let processor = this._processors[0];
      return (0, _evented.settleInSeries)(this, 'beforeTask', task).then(() => processor.process()).then(() => {
        if (resolution === this._resolution) {
          this._tasks.shift();

          this._processors.shift();

          return this._persist().then(() => (0, _evented.settleInSeries)(this, 'task', task)).then(() => this._settleEach(resolution));
        }
      }).catch(e => {
        if (resolution === this._resolution) {
          return this._fail(task, e);
        }
      });
    }
  }

  _reify() {
    this._tasks = [];
    this._processors = [];

    if (this._bucket) {
      this._reified = this._bucket.getItem(this._name).then(tasks => {
        if (tasks) {
          this._tasks = tasks;
          this._processors = tasks.map(task => new _taskProcessor.default(this._performer, task));
        }
      });
    } else {
      this._reified = Promise.resolve();
    }

    return this._reified;
  }

  _persist() {
    this.emit('change');

    if (this._bucket) {
      return this._bucket.setItem(this._name, this._tasks);
    } else {
      return Promise.resolve();
    }
  }

};
TaskQueue = __decorate([_evented.default], TaskQueue);
var _default = TaskQueue;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRhc2stcXVldWUuanMiXSwibmFtZXMiOlsiX19kZWNvcmF0ZSIsImRlY29yYXRvcnMiLCJ0YXJnZXQiLCJrZXkiLCJkZXNjIiwiYyIsImFyZ3VtZW50cyIsImxlbmd0aCIsInIiLCJPYmplY3QiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJkIiwiUmVmbGVjdCIsImRlY29yYXRlIiwiaSIsImRlZmluZVByb3BlcnR5IiwiYXNzZXJ0IiwiT3JiaXQiLCJUYXNrUXVldWUiLCJjb25zdHJ1Y3RvciIsInNldHRpbmdzIiwiX3BlcmZvcm1lciIsIl9uYW1lIiwibmFtZSIsIl9idWNrZXQiLCJidWNrZXQiLCJhdXRvUHJvY2VzcyIsInVuZGVmaW5lZCIsIl9yZWlmeSIsInRoZW4iLCJwcm9jZXNzIiwicGVyZm9ybWVyIiwiX3Rhc2tzIiwiZW50cmllcyIsImN1cnJlbnQiLCJjdXJyZW50UHJvY2Vzc29yIiwiX3Byb2Nlc3NvcnMiLCJlcnJvciIsIl9lcnJvciIsImVtcHR5IiwicHJvY2Vzc2luZyIsInByb2Nlc3NvciIsInN0YXJ0ZWQiLCJzZXR0bGVkIiwicmVpZmllZCIsIl9yZWlmaWVkIiwicHVzaCIsInRhc2siLCJUYXNrUHJvY2Vzc29yIiwiX3BlcnNpc3QiLCJfc2V0dGxlIiwicmV0cnkiLCJfY2FuY2VsIiwicmVzZXQiLCJza2lwIiwiZSIsInNoaWZ0IiwicmVqZWN0IiwiRXJyb3IiLCJjbGVhciIsInVuc2hpZnQiLCJyZXNvbHV0aW9uIiwiX3Jlc29sdXRpb24iLCJfY29tcGxldGUiLCJQcm9taXNlIiwicmVzb2x2ZSIsIl9yZXNvbHZlIiwiX3JlamVjdCIsIl9zZXR0bGVFYWNoIiwiYWx3YXlzUHJvY2VzcyIsInNldHRsZSIsIl9mYWlsIiwiY2F0Y2giLCJnZXRJdGVtIiwidGFza3MiLCJtYXAiLCJlbWl0Iiwic2V0SXRlbSIsImV2ZW50ZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFRQTs7QUFDQTs7QUFDQTs7Ozs7O0FBVkEsSUFBSUEsVUFB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a0IsS0FBSzNCLFVBQXZCLEVBQW1DMEIsSUFBbkMsQ0FBbEIsQ0FBbkI7QUFDRDtBQUNGLE9BTGUsQ0FBaEI7QUFNRCxLQVBELE1BT087QUFDTCxXQUFLRixRQUFMLEdBQWdCbUIsT0FBTyxDQUFDQyxPQUFSLEVBQWhCO0FBQ0Q7O0FBRUQsV0FBTyxLQUFLcEIsUUFBWjtBQUNEOztBQUVESSxFQUFBQSxRQUFRLEdBQUc7QUFDVCxTQUFLMkIsSUFBTCxDQUFVLFFBQVY7O0FBRUEsUUFBSSxLQUFLcEQsT0FBVCxFQUFrQjtBQUNoQixhQUFPLEtBQUtBLE9BQUwsQ0FBYXFELE9BQWIsQ0FBcUIsS0FBS3ZELEtBQTFCLEVBQWlDLEtBQUtVLE1BQXRDLENBQVA7QUFDRCxLQUZELE1BRU87QUFDTCxhQUFPZ0MsT0FBTyxDQUFDQyxPQUFSLEVBQVA7QUFDRDtBQUNGOztBQWpXNkIsQ0FBaEM7QUFvV0EvQyxTQUFTLEdBQUdsQixVQUFVLENBQUMsQ0FBQzhFLGdCQUFELENBQUQsRUFBWTVELFNBQVosQ0FBdEI7ZUFDZUEsUyIsInNvdXJjZXNDb250ZW50IjpbInZhciBfX2RlY29yYXRlID0gdGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgICAgIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLFxuICAgICAgZDtcbiAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcblxuaW1wb3J0IE9yYml0IGZyb20gJy4vbWFpbic7XG5pbXBvcnQgVGFza1Byb2Nlc3NvciBmcm9tICcuL3Rhc2stcHJvY2Vzc29yJztcbmltcG9ydCBldmVudGVkLCB7IHNldHRsZUluU2VyaWVzIH0gZnJvbSAnLi9ldmVudGVkJztcbmNvbnN0IHtcbiAgYXNzZXJ0XG59ID0gT3JiaXQ7XG4vKipcbiAqIGBUYXNrUXVldWVgIGlzIGEgRklGTyBxdWV1ZSBvZiBhc3luY2hyb25vdXMgdGFza3MgdGhhdCBzaG91bGQgYmVcbiAqIHBlcmZvcm1lZCBzZXF1ZW50aWFsbHkuXG4gKlxuICogVGFza3MgYXJlIGFkZGVkIHRvIHRoZSBxdWV1ZSB3aXRoIGBwdXNoYC4gRWFjaCB0YXNrIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5XG4gKiBjYWxsaW5nIGl0cyBgcHJvY2Vzc2AgbWV0aG9kLlxuICpcbiAqIEJ5IGRlZmF1bHQsIHRhc2sgcXVldWVzIHdpbGwgYmUgcHJvY2Vzc2VkIGF1dG9tYXRpY2FsbHksIGFzIHNvb24gYXMgdGFza3NcbiAqIGFyZSBwdXNoZWQgdG8gdGhlbS4gVGhpcyBjYW4gYmUgb3ZlcnJpZGRlbiBieSBzZXR0aW5nIHRoZSBgYXV0b1Byb2Nlc3NgXG4gKiBzZXR0aW5nIHRvIGBmYWxzZWAgYW5kIGNhbGxpbmcgYHByb2Nlc3NgIHdoZW4geW91J2QgbGlrZSB0byBzdGFydFxuICogcHJvY2Vzc2luZy5cbiAqL1xuXG5sZXQgVGFza1F1ZXVlID0gY2xhc3MgVGFza1F1ZXVlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgYFRhc2tRdWV1ZWAuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih0YXJnZXQsIHNldHRpbmdzID0ge30pIHtcbiAgICB0aGlzLl9wZXJmb3JtZXIgPSB0YXJnZXQ7XG4gICAgdGhpcy5fbmFtZSA9IHNldHRpbmdzLm5hbWU7XG4gICAgdGhpcy5fYnVja2V0ID0gc2V0dGluZ3MuYnVja2V0O1xuICAgIHRoaXMuYXV0b1Byb2Nlc3MgPSBzZXR0aW5ncy5hdXRvUHJvY2VzcyA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IHNldHRpbmdzLmF1dG9Qcm9jZXNzO1xuXG4gICAgaWYgKHRoaXMuX2J1Y2tldCkge1xuICAgICAgYXNzZXJ0KCdUYXNrUXVldWUgcmVxdWlyZXMgYSBuYW1lIGlmIGl0IGhhcyBhIGJ1Y2tldCcsICEhdGhpcy5fbmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5fcmVpZnkoKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA+IDAgJiYgdGhpcy5hdXRvUHJvY2Vzcykge1xuICAgICAgICB0aGlzLnByb2Nlc3MoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogTmFtZSB1c2VkIGZvciB0cmFja2luZyAvIGRlYnVnZ2luZyB0aGlzIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgb2JqZWN0IHdoaWNoIHdpbGwgYHBlcmZvcm1gIHRoZSB0YXNrcyBpbiB0aGlzIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBwZXJmb3JtZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BlcmZvcm1lcjtcbiAgfVxuICAvKipcbiAgICogQSBidWNrZXQgdXNlZCB0byBwZXJzaXN0IHRoZSBzdGF0ZSBvZiB0aGlzIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBidWNrZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Y2tldDtcbiAgfVxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiB0YXNrcyBpbiB0aGUgcXVldWUuXG4gICAqL1xuXG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdGFza3MgPyB0aGlzLl90YXNrcy5sZW5ndGggOiAwO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgdGFza3MgaW4gdGhlIHF1ZXVlLlxuICAgKi9cblxuXG4gIGdldCBlbnRyaWVzKCkge1xuICAgIHJldHVybiB0aGlzLl90YXNrcztcbiAgfVxuICAvKipcbiAgICogVGhlIGN1cnJlbnQgdGFzayBiZWluZyBwcm9jZXNzZWQgKGlmIGFjdGl2ZWx5IHByb2Nlc3NpbmcpLCBvciB0aGUgbmV4dFxuICAgKiB0YXNrIHRvIGJlIHByb2Nlc3NlZCAoaWYgbm90IGFjdGl2ZWx5IHByb2Nlc3NpbmcpLlxuICAgKi9cblxuXG4gIGdldCBjdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLl90YXNrcyAmJiB0aGlzLl90YXNrc1swXTtcbiAgfVxuICAvKipcbiAgICogVGhlIHByb2Nlc3NvciB3cmFwcGVyIHRoYXQgaXMgcHJvY2Vzc2luZyB0aGUgY3VycmVudCB0YXNrIChvciBuZXh0IHRhc2ssXG4gICAqIGlmIG5vbmUgYXJlIGJlaW5nIHByb2Nlc3NlZCkuXG4gICAqL1xuXG5cbiAgZ2V0IGN1cnJlbnRQcm9jZXNzb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb2Nlc3NvcnMgJiYgdGhpcy5fcHJvY2Vzc29yc1swXTtcbiAgfVxuICAvKipcbiAgICogSWYgYW4gZXJyb3Igb2NjdXJzIHdoaWxlIHByb2Nlc3NpbmcgYSB0YXNrLCBwcm9jZXNzaW5nIHdpbGwgYmUgaGFsdGVkLCB0aGVcbiAgICogYGZhaWxgIGV2ZW50IHdpbGwgYmUgZW1pdHRlZCwgYW5kIHRoaXMgcHJvcGVydHkgd2lsbCByZWZsZWN0IHRoZSBlcnJvclxuICAgKiBlbmNvdW50ZXJlZC5cbiAgICovXG5cblxuICBnZXQgZXJyb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Vycm9yO1xuICB9XG4gIC8qKlxuICAgKiBJcyB0aGUgcXVldWUgZW1wdHk/XG4gICAqL1xuXG5cbiAgZ2V0IGVtcHR5KCkge1xuICAgIHJldHVybiB0aGlzLmxlbmd0aCA9PT0gMDtcbiAgfVxuICAvKipcbiAgICogSXMgdGhlIHF1ZXVlIGFjdGl2ZWx5IHByb2Nlc3NpbmcgYSB0YXNrP1xuICAgKi9cblxuXG4gIGdldCBwcm9jZXNzaW5nKCkge1xuICAgIGNvbnN0IHByb2Nlc3NvciA9IHRoaXMuY3VycmVudFByb2Nlc3NvcjtcbiAgICByZXR1cm4gcHJvY2Vzc29yICE9PSB1bmRlZmluZWQgJiYgcHJvY2Vzc29yLnN0YXJ0ZWQgJiYgIXByb2Nlc3Nvci5zZXR0bGVkO1xuICB9XG4gIC8qKlxuICAgKiBSZXNvbHZlcyB3aGVuIHRoZSBxdWV1ZSBoYXMgYmVlbiBmdWxseSByZWlmaWVkIGZyb20gaXRzIGFzc29jaWF0ZWQgYnVja2V0LFxuICAgKiBpZiBhcHBsaWNhYmxlLlxuICAgKi9cblxuXG4gIGdldCByZWlmaWVkKCkge1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkO1xuICB9XG4gIC8qKlxuICAgKiBQdXNoIGEgbmV3IHRhc2sgb250byB0aGUgZW5kIG9mIHRoZSBxdWV1ZS5cbiAgICpcbiAgICogSWYgYGF1dG9Qcm9jZXNzYCBpcyBlbmFibGVkLCB0aGlzIHdpbGwgYXV0b21hdGljYWxseSB0cmlnZ2VyIHByb2Nlc3Npbmcgb2ZcbiAgICogdGhlIHF1ZXVlLlxuICAgKlxuICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHB1c2hlZCB0YXNrIGhhcyBiZWVuIHByb2Nlc3NlZC5cbiAgICovXG5cblxuICBwdXNoKHRhc2spIHtcbiAgICBsZXQgcHJvY2Vzc29yID0gbmV3IFRhc2tQcm9jZXNzb3IodGhpcy5fcGVyZm9ybWVyLCB0YXNrKTtcbiAgICByZXR1cm4gdGhpcy5fcmVpZmllZC50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3Rhc2tzLnB1c2godGFzayk7XG5cbiAgICAgIHRoaXMuX3Byb2Nlc3NvcnMucHVzaChwcm9jZXNzb3IpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fcGVyc2lzdCgpO1xuICAgIH0pLnRoZW4oKCkgPT4gdGhpcy5fc2V0dGxlKHByb2Nlc3NvcikpO1xuICB9XG4gIC8qKlxuICAgKiBDYW5jZWxzIGFuZCByZS10cmllcyBwcm9jZXNzaW5nIHRoZSBjdXJyZW50IHRhc2suXG4gICAqXG4gICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgcHVzaGVkIHRhc2sgaGFzIGJlZW4gcHJvY2Vzc2VkLlxuICAgKi9cblxuXG4gIHJldHJ5KCkge1xuICAgIGxldCBwcm9jZXNzb3I7XG4gICAgcmV0dXJuIHRoaXMuX3JlaWZpZWQudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLl9jYW5jZWwoKTtcblxuICAgICAgcHJvY2Vzc29yID0gdGhpcy5jdXJyZW50UHJvY2Vzc29yO1xuICAgICAgcHJvY2Vzc29yLnJlc2V0KCk7XG4gICAgICByZXR1cm4gdGhpcy5fcGVyc2lzdCgpO1xuICAgIH0pLnRoZW4oKCkgPT4gdGhpcy5fc2V0dGxlKHByb2Nlc3NvciwgdHJ1ZSkpO1xuICB9XG4gIC8qKlxuICAgKiBDYW5jZWxzIGFuZCBkaXNjYXJkcyB0aGUgY3VycmVudCB0YXNrLlxuICAgKlxuICAgKiBJZiBgYXV0b1Byb2Nlc3NgIGlzIGVuYWJsZWQsIHRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IHRyaWdnZXIgcHJvY2Vzc2luZyBvZlxuICAgKiB0aGUgcXVldWUuXG4gICAqL1xuXG5cbiAgc2tpcChlKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlaWZpZWQudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLl9jYW5jZWwoKTtcblxuICAgICAgdGhpcy5fdGFza3Muc2hpZnQoKTtcblxuICAgICAgbGV0IHByb2Nlc3NvciA9IHRoaXMuX3Byb2Nlc3NvcnMuc2hpZnQoKTtcblxuICAgICAgaWYgKHByb2Nlc3NvciAhPT0gdW5kZWZpbmVkICYmICFwcm9jZXNzb3Iuc2V0dGxlZCkge1xuICAgICAgICBwcm9jZXNzb3IucmVqZWN0KGUgfHwgbmV3IEVycm9yKCdQcm9jZXNzaW5nIGNhbmNlbGxlZCB2aWEgYFRhc2tRdWV1ZSNza2lwYCcpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX3BlcnNpc3QoKTtcbiAgICB9KS50aGVuKCgpID0+IHRoaXMuX3NldHRsZSgpKTtcbiAgfVxuICAvKipcbiAgICogQ2FuY2VscyB0aGUgY3VycmVudCB0YXNrIGFuZCBjb21wbGV0ZWx5IGNsZWFycyB0aGUgcXVldWUuXG4gICAqL1xuXG5cbiAgY2xlYXIoZSkge1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fY2FuY2VsKCk7XG5cbiAgICAgIHRoaXMuX3Rhc2tzID0gW107XG5cbiAgICAgIGZvciAobGV0IHByb2Nlc3NvciBvZiB0aGlzLl9wcm9jZXNzb3JzKSB7XG4gICAgICAgIGlmICghcHJvY2Vzc29yLnNldHRsZWQpIHtcbiAgICAgICAgICBwcm9jZXNzb3IucmVqZWN0KGUgfHwgbmV3IEVycm9yKCdQcm9jZXNzaW5nIGNhbmNlbGxlZCB2aWEgYFRhc2tRdWV1ZSNjbGVhcmAnKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5fcHJvY2Vzc29ycyA9IFtdO1xuICAgICAgcmV0dXJuIHRoaXMuX3BlcnNpc3QoKTtcbiAgICB9KS50aGVuKCgpID0+IHRoaXMuX3NldHRsZShudWxsLCB0cnVlKSk7XG4gIH1cbiAgLyoqXG4gICAqIENhbmNlbHMgdGhlIGN1cnJlbnQgdGFzayBhbmQgcmVtb3ZlcyBpdCwgYnV0IGRvZXMgbm90IGNvbnRpbnVlIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIFJldHVybnMgdGhlIGNhbmNlbGVkIGFuZCByZW1vdmVkIHRhc2suXG4gICAqL1xuXG5cbiAgc2hpZnQoZSkge1xuICAgIGxldCB0YXNrO1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fY2FuY2VsKCk7XG5cbiAgICAgIHRhc2sgPSB0aGlzLl90YXNrcy5zaGlmdCgpO1xuXG4gICAgICBsZXQgcHJvY2Vzc29yID0gdGhpcy5fcHJvY2Vzc29ycy5zaGlmdCgpO1xuXG4gICAgICBpZiAocHJvY2Vzc29yICE9PSB1bmRlZmluZWQgJiYgIXByb2Nlc3Nvci5zZXR0bGVkKSB7XG4gICAgICAgIHByb2Nlc3Nvci5yZWplY3QoZSB8fCBuZXcgRXJyb3IoJ1Byb2Nlc3NpbmcgY2FuY2VsbGVkIHZpYSBgVGFza1F1ZXVlI3NoaWZ0YCcpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX3BlcnNpc3QoKTtcbiAgICB9KS50aGVuKCgpID0+IHRhc2spO1xuICB9XG4gIC8qKlxuICAgKiBDYW5jZWxzIHByb2Nlc3NpbmcgdGhlIGN1cnJlbnQgdGFzayBhbmQgaW5zZXJ0cyBhIG5ldyB0YXNrIGF0IHRoZSBiZWdpbm5pbmdcbiAgICogb2YgdGhlIHF1ZXVlLiBUaGlzIG5ldyB0YXNrIHdpbGwgYmUgcHJvY2Vzc2VkIG5leHQuXG4gICAqXG4gICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgbmV3IHRhc2sgaGFzIGJlZW4gcHJvY2Vzc2VkLlxuICAgKi9cblxuXG4gIHVuc2hpZnQodGFzaykge1xuICAgIGxldCBwcm9jZXNzb3IgPSBuZXcgVGFza1Byb2Nlc3Nvcih0aGlzLl9wZXJmb3JtZXIsIHRhc2spO1xuICAgIHJldHVybiB0aGlzLl9yZWlmaWVkLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fY2FuY2VsKCk7XG5cbiAgICAgIHRoaXMuX3Rhc2tzLnVuc2hpZnQodGFzayk7XG5cbiAgICAgIHRoaXMuX3Byb2Nlc3NvcnMudW5zaGlmdChwcm9jZXNzb3IpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fcGVyc2lzdCgpO1xuICAgIH0pLnRoZW4oKCkgPT4gdGhpcy5fc2V0dGxlKHByb2Nlc3NvcikpO1xuICB9XG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgYWxsIHRoZSB0YXNrcyBpbiB0aGUgcXVldWUuIFJlc29sdmVzIHdoZW4gdGhlIHF1ZXVlIGlzIGVtcHR5LlxuICAgKi9cblxuXG4gIHByb2Nlc3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlaWZpZWQudGhlbigoKSA9PiB7XG4gICAgICBsZXQgcmVzb2x1dGlvbiA9IHRoaXMuX3Jlc29sdXRpb247XG5cbiAgICAgIGlmICghcmVzb2x1dGlvbikge1xuICAgICAgICBpZiAodGhpcy5fdGFza3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgcmVzb2x1dGlvbiA9IHRoaXMuX2NvbXBsZXRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fZXJyb3IgPSBudWxsO1xuICAgICAgICAgIHRoaXMuX3Jlc29sdXRpb24gPSByZXNvbHV0aW9uID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3QgPSByZWplY3Q7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB0aGlzLl9zZXR0bGVFYWNoKHJlc29sdXRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXNvbHV0aW9uO1xuICAgIH0pO1xuICB9XG5cbiAgX3NldHRsZShwcm9jZXNzb3IsIGFsd2F5c1Byb2Nlc3MpIHtcbiAgICBpZiAodGhpcy5hdXRvUHJvY2VzcyB8fCBhbHdheXNQcm9jZXNzKSB7XG4gICAgICBsZXQgc2V0dGxlID0gcHJvY2Vzc29yID8gKCkgPT4gcHJvY2Vzc29yLnNldHRsZSgpIDogKCkgPT4ge307XG4gICAgICByZXR1cm4gdGhpcy5wcm9jZXNzKCkudGhlbihzZXR0bGUsIHNldHRsZSk7XG4gICAgfSBlbHNlIGlmIChwcm9jZXNzb3IpIHtcbiAgICAgIHJldHVybiBwcm9jZXNzb3Iuc2V0dGxlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gIH1cblxuICBfY29tcGxldGUoKSB7XG4gICAgaWYgKHRoaXMuX3Jlc29sdmUpIHtcbiAgICAgIHRoaXMuX3Jlc29sdmUoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9yZXNvbHZlID0gbnVsbDtcbiAgICB0aGlzLl9yZWplY3QgPSBudWxsO1xuICAgIHRoaXMuX2Vycm9yID0gbnVsbDtcbiAgICB0aGlzLl9yZXNvbHV0aW9uID0gbnVsbDtcbiAgICByZXR1cm4gc2V0dGxlSW5TZXJpZXModGhpcywgJ2NvbXBsZXRlJyk7XG4gIH1cblxuICBfZmFpbCh0YXNrLCBlKSB7XG4gICAgaWYgKHRoaXMuX3JlamVjdCkge1xuICAgICAgdGhpcy5fcmVqZWN0KGUpO1xuICAgIH1cblxuICAgIHRoaXMuX3Jlc29sdmUgPSBudWxsO1xuICAgIHRoaXMuX3JlamVjdCA9IG51bGw7XG4gICAgdGhpcy5fZXJyb3IgPSBlO1xuICAgIHRoaXMuX3Jlc29sdXRpb24gPSBudWxsO1xuICAgIHJldHVybiBzZXR0bGVJblNlcmllcyh0aGlzLCAnZmFpbCcsIHRhc2ssIGUpO1xuICB9XG5cbiAgX2NhbmNlbCgpIHtcbiAgICB0aGlzLl9lcnJvciA9IG51bGw7XG4gICAgdGhpcy5fcmVzb2x1dGlvbiA9IG51bGw7XG4gIH1cblxuICBfc2V0dGxlRWFjaChyZXNvbHV0aW9uKSB7XG4gICAgaWYgKHRoaXMuX3Rhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbXBsZXRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB0YXNrID0gdGhpcy5fdGFza3NbMF07XG4gICAgICBsZXQgcHJvY2Vzc29yID0gdGhpcy5fcHJvY2Vzc29yc1swXTtcbiAgICAgIHJldHVybiBzZXR0bGVJblNlcmllcyh0aGlzLCAnYmVmb3JlVGFzaycsIHRhc2spLnRoZW4oKCkgPT4gcHJvY2Vzc29yLnByb2Nlc3MoKSkudGhlbigoKSA9PiB7XG4gICAgICAgIGlmIChyZXNvbHV0aW9uID09PSB0aGlzLl9yZXNvbHV0aW9uKSB7XG4gICAgICAgICAgdGhpcy5fdGFza3Muc2hpZnQoKTtcblxuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NvcnMuc2hpZnQoKTtcblxuICAgICAgICAgIHJldHVybiB0aGlzLl9wZXJzaXN0KCkudGhlbigoKSA9PiBzZXR0bGVJblNlcmllcyh0aGlzLCAndGFzaycsIHRhc2spKS50aGVuKCgpID0+IHRoaXMuX3NldHRsZUVhY2gocmVzb2x1dGlvbikpO1xuICAgICAgICB9XG4gICAgICB9KS5jYXRjaChlID0+IHtcbiAgICAgICAgaWYgKHJlc29sdXRpb24gPT09IHRoaXMuX3Jlc29sdXRpb24pIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZmFpbCh0YXNrLCBlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgX3JlaWZ5KCkge1xuICAgIHRoaXMuX3Rhc2tzID0gW107XG4gICAgdGhpcy5fcHJvY2Vzc29ycyA9IFtdO1xuXG4gICAgaWYgKHRoaXMuX2J1Y2tldCkge1xuICAgICAgdGhpcy5fcmVpZmllZCA9IHRoaXMuX2J1Y2tldC5nZXRJdGVtKHRoaXMuX25hbWUpLnRoZW4odGFza3MgPT4ge1xuICAgICAgICBpZiAodGFza3MpIHtcbiAgICAgICAgICB0aGlzLl90YXNrcyA9IHRhc2tzO1xuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NvcnMgPSB0YXNrcy5tYXAodGFzayA9PiBuZXcgVGFza1Byb2Nlc3Nvcih0aGlzLl9wZXJmb3JtZXIsIHRhc2spKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlaWZpZWQgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcmVpZmllZDtcbiAgfVxuXG4gIF9wZXJzaXN0KCkge1xuICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG5cbiAgICBpZiAodGhpcy5fYnVja2V0KSB7XG4gICAgICByZXR1cm4gdGhpcy5fYnVja2V0LnNldEl0ZW0odGhpcy5fbmFtZSwgdGhpcy5fdGFza3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICB9XG5cbn07XG5UYXNrUXVldWUgPSBfX2RlY29yYXRlKFtldmVudGVkXSwgVGFza1F1ZXVlKTtcbmV4cG9ydCBkZWZhdWx0IFRhc2tRdWV1ZTsiXX0=