define('@orbit/core', ['exports', '@orbit/utils'], function (exports, _orbit_utils) { 'use strict';

/**
 * Throw an exception if `test` is not truthy.
 */
function assert(description, test) {
  if (!test) {
    throw new Error('Assertion failed: ' + description);
  }
}

/**
 * Display a deprecation warning with the provided message if the
 * provided `test` evaluates to a falsy value (or is missing).
 */
function deprecate(message, test) {
  if (typeof test === 'function') {
    if (test()) {
      return;
    }
  } else {
    if (test) {
      return;
    }
  }

  console.warn(message);
}

// on the server, or `this` in some virtual machines. We use `self`
// instead of `window` for `WebWorker` support.
//
// Source: https://github.com/jashkenas/underscore/blob/master/underscore.js#L11-L17
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2017 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

const globals = typeof self == 'object' && self.self === self && self || typeof global == 'object' && global || {};
const Orbit = {
  globals,
  assert,
  deprecate,
  uuid: _orbit_utils.uuid
};

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

const {
  deprecate: deprecate$2
} = Orbit;
/**
 *  The `Notifier` class can emit messages to an array of subscribed listeners.
 * Here's a simple example:
 *
 * ```ts
 * import { Notifier } from '@orbit/core';
 *
 * let notifier = new Notifier();
 * notifier.addListener((message: string) => {
 *   console.log("I heard " + message);
 * });
 * notifier.addListener((message: string) => {
 *   console.log("I also heard " + message);
 * });
 *
 * notifier.emit('hello'); // logs "I heard hello" and "I also heard hello"
 * ```
 *
 * Calls to `emit` will send along all of their arguments.
 */

class Notifier {
  constructor() {
    this.listeners = [];
  }
  /**
   * Add a callback as a listener, which will be triggered when sending
   * notifications.
   */


  addListener(listener) {
    if (arguments.length > 1) {
      deprecate$2('`binding` argument is no longer supported for individual `Notifier` listeners. Please pre-bind listeners before calling `addListener`.');
    }

    this.listeners.push(listener);
  }
  /**
   * Remove a listener so that it will no longer receive notifications.
   */


  removeListener(listener) {
    if (arguments.length > 1) {
      deprecate$2('`binding` argument is no longer supported for individual `Notifier` listeners. Please pre-bind listeners before calling `removeListener`.');
    }

    const listeners = this.listeners;

    for (let i = 0, len = listeners.length; i < len; i++) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        return;
      }
    }
  }
  /**
   * Notify registered listeners.
   */


  emit(...args) {
    this.listeners.slice(0).forEach(listener => listener(...args));
  }

}

const {
  deprecate: deprecate$1
} = Orbit;
const EVENTED = '__evented__';
/**
 * Has a class been decorated as `@evented`?
 */

function isEvented(obj) {
  return !!obj[EVENTED];
}
/**
 * Marks a class as evented.
 *
 * An evented class should also implement the `Evented` interface.
 *
 * ```ts
 * import { evented, Evented } from '@orbit/core';
 *
 * @evented
 * class Source implements Evented {
 *   ...
 * }
 * ```
 *
 * Listeners can then register themselves for particular events with `on`:
 *
 * ```ts
 * let source = new Source();
 *
 * function listener1(message: string) {
 *   console.log('listener1 heard ' + message);
 * };
 * function listener2(message: string) {
 *   console.log('listener2 heard ' + message);
 * };
 *
 * source.on('greeting', listener1);
 * source.on('greeting', listener2);
 *
 * evented.emit('greeting', 'hello'); // logs "listener1 heard hello" and
 *                                    //      "listener2 heard hello"
 * ```
 *
 * Listeners can be unregistered from events at any time with `off`:
 *
 * ```ts
 * source.off('greeting', listener2);
 * ```
 */

function evented(Klass) {
  let proto = Klass.prototype;

  if (isEvented(proto)) {
    return;
  }

  proto[EVENTED] = true;

  proto.on = function (eventName, listener) {
    if (arguments.length > 2) {
      deprecate$1('`binding` argument is no longer supported when configuring `Evented` listeners. Please pre-bind listeners before calling `on`.');
    }

    notifierForEvent(this, eventName, true).addListener(listener);
  };

  proto.off = function (eventName, listener) {
    if (arguments.length > 2) {
      deprecate$1('`binding` argument is no longer supported when configuring `Evented` listeners. Please pre-bind listeners before calling `off`.');
    }

    const notifier = notifierForEvent(this, eventName);

    if (notifier) {
      if (listener) {
        notifier.removeListener(listener);
      } else {
        removeNotifierForEvent(this, eventName);
      }
    }
  };

  proto.one = function (eventName, listener) {
    if (arguments.length > 2) {
      deprecate$1('`binding` argument is no longer supported when configuring `Evented` listeners. Please pre-bind listeners before calling `off`.');
    }

    const notifier = notifierForEvent(this, eventName, true);

    const callOnce = function () {
      listener(...arguments);
      notifier.removeListener(callOnce);
    };

    notifier.addListener(callOnce);
  };

  proto.emit = function (eventName, ...args) {
    let notifier = notifierForEvent(this, eventName);

    if (notifier) {
      notifier.emit.apply(notifier, args);
    }
  };

  proto.listeners = function (eventName) {
    let notifier = notifierForEvent(this, eventName);
    return notifier ? notifier.listeners : [];
  };
}
/**
 * Settle any promises returned by event listeners in series.
 *
 * If any errors are encountered during processing, they will be ignored.
 */

function settleInSeries(obj, eventName, ...args) {
  const listeners = obj.listeners(eventName);
  return listeners.reduce((chain, listener) => {
    return chain.then(() => listener(...args)).catch(() => {});
  }, Promise.resolve());
}
/**
 * Fulfill any promises returned by event listeners in series.
 *
 * Processing will stop if an error is encountered and the returned promise will
 * be rejected.
 */

function fulfillInSeries(obj, eventName, ...args) {
  const listeners = obj.listeners(eventName);
  return new Promise((resolve, reject) => {
    fulfillEach(listeners, args, resolve, reject);
  });
}

function notifierForEvent(object, eventName, createIfUndefined = false) {
  if (object._eventedNotifiers === undefined) {
    object._eventedNotifiers = {};
  }

  let notifier = object._eventedNotifiers[eventName];

  if (!notifier && createIfUndefined) {
    notifier = object._eventedNotifiers[eventName] = new Notifier();
  }

  return notifier;
}

function removeNotifierForEvent(object, eventName) {
  if (object._eventedNotifiers && object._eventedNotifiers[eventName]) {
    delete object._eventedNotifiers[eventName];
  }
}

function fulfillEach(listeners, args, resolve, reject) {
  if (listeners.length === 0) {
    resolve();
  } else {
    let listener;
    [listener, ...listeners] = listeners;
    let response = listener(...args);

    if (response) {
      return Promise.resolve(response).then(() => fulfillEach(listeners, args, resolve, reject)).catch(error => reject(error));
    } else {
      fulfillEach(listeners, args, resolve, reject);
    }
  }
}

var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

const {
  assert: assert$1
} = Orbit;
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
      assert$1('TaskQueue requires a name if it has a bucket', !!this._name);
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
    let processor = new TaskProcessor(this._performer, task);
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
    let processor = new TaskProcessor(this._performer, task);
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
    return settleInSeries(this, 'complete');
  }

  _fail(task, e) {
    if (this._reject) {
      this._reject(e);
    }

    this._resolve = null;
    this._reject = null;
    this._error = e;
    this._resolution = null;
    return settleInSeries(this, 'fail', task, e);
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
      return settleInSeries(this, 'beforeTask', task).then(() => processor.process()).then(() => {
        if (resolution === this._resolution) {
          this._tasks.shift();

          this._processors.shift();

          return this._persist().then(() => settleInSeries(this, 'task', task)).then(() => this._settleEach(resolution));
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
          this._processors = tasks.map(task => new TaskProcessor(this._performer, task));
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
TaskQueue = __decorate([evented], TaskQueue);
var TaskQueue$1 = TaskQueue;

var __decorate$1 = undefined && undefined.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

/**
 * Buckets can persist state. The base `Bucket` class is abstract and should be
 * extended to create buckets with different persistence strategies.
 *
 * Buckets have a simple map-like interface with methods like `getItem`,
 * `setItem`, and `removeItem`. All methods return promises to enable usage with
 * asynchronous stores like IndexedDB.
 *
 * Buckets can be assigned a unique `namespace` in order to avoid collisions.
 *
 * Buckets can be assigned a version, and can be "upgraded" to a new version.
 * The upgrade process allows buckets to migrate their data between versions.
 */

exports.Bucket = class Bucket {
  constructor(settings = {}) {
    if (settings.version === undefined) {
      settings.version = 1;
    }

    settings.namespace = settings.namespace || 'orbit-bucket';

    this._applySettings(settings);
  }
  /**
   * Name used for tracking and debugging a bucket instance.
   */


  get name() {
    return this._name;
  }
  /**
   * The namespace used by the bucket when accessing any items.
   *
   * This is used to distinguish one bucket's contents from another.
   */


  get namespace() {
    return this._namespace;
  }
  /**
   * The current version of the bucket.
   *
   * This is read-only. To change versions, `upgrade` should be invoked.
   */


  get version() {
    return this._version;
  }
  /**
   * Upgrades Bucket to a new version with new settings.
   *
   * Settings, beyond `version`, are bucket-specific.
   */


  upgrade(settings = {}) {
    if (settings.version === undefined) {
      settings.version = this._version + 1;
    }

    return this._applySettings(settings).then(() => this.emit('upgrade', this._version));
  }
  /**
   * Applies settings passed from a `constructor` or `upgrade`.
   */


  _applySettings(settings) {
    if (settings.name) {
      this._name = settings.name;
    }

    if (settings.namespace) {
      this._namespace = settings.namespace;
    }

    this._version = settings.version;
    return Promise.resolve();
  }

};
exports.Bucket = __decorate$1([evented], exports.Bucket);

/**
 * Base exception class.
 */
class Exception {
  constructor(message) {
    this.message = message;
    this.error = new Error(this.message);
    this.stack = this.error.stack;
  }

}
/**
 * Exception raised when an item does not exist in a log.
 */

class NotLoggedException extends Exception {
  constructor(id) {
    super(`Action not logged: ${id}`);
    this.id = id;
  }

}
/**
 * Exception raised when a value is outside an allowed range.
 */

class OutOfRangeException extends Exception {
  constructor(value) {
    super(`Out of range: ${value}`);
    this.value = value;
  }

}

var __decorate$2 = undefined && undefined.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

const {
  assert: assert$2
} = Orbit;
/**
 * Logs track a series of unique events that have occurred. Each event is
 * tracked based on its unique id. The log only tracks the ids but currently
 * does not track any details.
 *
 * Logs can automatically be persisted by assigning them a bucket.
 */

let Log = class Log {
  constructor(options = {}) {
    this._name = options.name;
    this._bucket = options.bucket;

    if (this._bucket) {
      assert$2('Log requires a name if it has a bucket', !!this._name);
    }

    this._reify(options.data);
  }

  get name() {
    return this._name;
  }

  get bucket() {
    return this._bucket;
  }

  get head() {
    return this._data[this._data.length - 1];
  }

  get entries() {
    return this._data;
  }

  get length() {
    return this._data.length;
  }

  append(...ids) {
    return this.reified.then(() => {
      Array.prototype.push.apply(this._data, ids);
      return this._persist();
    }).then(() => {
      this.emit('append', ids);
    });
  }

  before(id, relativePosition = 0) {
    const index = this._data.indexOf(id);

    if (index === -1) {
      throw new NotLoggedException(id);
    }

    const position = index + relativePosition;

    if (position < 0 || position >= this._data.length) {
      throw new OutOfRangeException(position);
    }

    return this._data.slice(0, position);
  }

  after(id, relativePosition = 0) {
    const index = this._data.indexOf(id);

    if (index === -1) {
      throw new NotLoggedException(id);
    }

    const position = index + 1 + relativePosition;

    if (position < 0 || position > this._data.length) {
      throw new OutOfRangeException(position);
    }

    return this._data.slice(position);
  }

  truncate(id, relativePosition = 0) {
    let removed;
    return this.reified.then(() => {
      const index = this._data.indexOf(id);

      if (index === -1) {
        throw new NotLoggedException(id);
      }

      const position = index + relativePosition;

      if (position < 0 || position > this._data.length) {
        throw new OutOfRangeException(position);
      }

      if (position === this._data.length) {
        removed = this._data;
        this._data = [];
      } else {
        removed = this._data.slice(0, position);
        this._data = this._data.slice(position);
      }

      return this._persist();
    }).then(() => {
      this.emit('truncate', id, relativePosition, removed);
    });
  }

  rollback(id, relativePosition = 0) {
    let removed;
    return this.reified.then(() => {
      const index = this._data.indexOf(id);

      if (index === -1) {
        throw new NotLoggedException(id);
      }

      const position = index + 1 + relativePosition;

      if (position < 0 || position > this._data.length) {
        throw new OutOfRangeException(position);
      }

      removed = this._data.slice(position);
      this._data = this._data.slice(0, position);
      return this._persist();
    }).then(() => {
      this.emit('rollback', id, relativePosition, removed);
    });
  }

  clear() {
    let clearedData;
    return this.reified.then(() => {
      clearedData = this._data;
      this._data = [];
      return this._persist();
    }).then(() => this.emit('clear', clearedData));
  }

  contains(id) {
    return this._data.indexOf(id) > -1;
  }

  _persist() {
    this.emit('change');

    if (this.bucket) {
      return this._bucket.setItem(this.name, this._data);
    } else {
      return Promise.resolve();
    }
  }

  _reify(data) {
    if (!data && this._bucket) {
      this.reified = this._bucket.getItem(this._name).then(bucketData => this._initData(bucketData));
    } else {
      this._initData(data);

      this.reified = Promise.resolve();
    }
  }

  _initData(data) {
    if (data) {
      this._data = data;
    } else {
      this._data = [];
    }
  }

};
Log = __decorate$2([evented], Log);
var Log$1 = Log;

exports['default'] = Orbit;
exports.TaskQueue = TaskQueue$1;
exports.TaskProcessor = TaskProcessor;
exports.evented = evented;
exports.isEvented = isEvented;
exports.settleInSeries = settleInSeries;
exports.fulfillInSeries = fulfillInSeries;
exports.Notifier = Notifier;
exports.Log = Log$1;
exports.Exception = Exception;
exports.NotLoggedException = NotLoggedException;
exports.OutOfRangeException = OutOfRangeException;

Object.defineProperty(exports, '__esModule', { value: true });

});
