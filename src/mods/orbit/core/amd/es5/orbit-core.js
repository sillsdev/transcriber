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

var globals = typeof self == 'object' && self.self === self && self || typeof global == 'object' && global || {};
var Orbit = {
  globals: globals,
  assert: assert,
  deprecate: deprecate,
  uuid: _orbit_utils.uuid
};

function _defineProperties$1(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass$1(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$1(Constructor.prototype, protoProps); if (staticProps) _defineProperties$1(Constructor, staticProps); return Constructor; }

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

  _createClass$1(TaskProcessor, [{
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

var deprecate$2 = Orbit.deprecate;
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

var Notifier =
/*#__PURE__*/
function () {
  function Notifier() {
    this.listeners = [];
  }
  /**
   * Add a callback as a listener, which will be triggered when sending
   * notifications.
   */


  var _proto = Notifier.prototype;

  _proto.addListener = function addListener(listener) {
    if (arguments.length > 1) {
      deprecate$2('`binding` argument is no longer supported for individual `Notifier` listeners. Please pre-bind listeners before calling `addListener`.');
    }

    this.listeners.push(listener);
  }
  /**
   * Remove a listener so that it will no longer receive notifications.
   */
  ;

  _proto.removeListener = function removeListener(listener) {
    if (arguments.length > 1) {
      deprecate$2('`binding` argument is no longer supported for individual `Notifier` listeners. Please pre-bind listeners before calling `removeListener`.');
    }

    var listeners = this.listeners;

    for (var i = 0, len = listeners.length; i < len; i++) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        return;
      }
    }
  }
  /**
   * Notify registered listeners.
   */
  ;

  _proto.emit = function emit() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    this.listeners.slice(0).forEach(function (listener) {
      return listener.apply(void 0, args);
    });
  };

  return Notifier;
}();

var deprecate$1 = Orbit.deprecate;
var EVENTED = '__evented__';
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
  var proto = Klass.prototype;

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

    var notifier = notifierForEvent(this, eventName);

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

    var notifier = notifierForEvent(this, eventName, true);

    var callOnce = function () {
      listener.apply(void 0, arguments);
      notifier.removeListener(callOnce);
    };

    notifier.addListener(callOnce);
  };

  proto.emit = function (eventName) {
    var notifier = notifierForEvent(this, eventName);

    if (notifier) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      notifier.emit.apply(notifier, args);
    }
  };

  proto.listeners = function (eventName) {
    var notifier = notifierForEvent(this, eventName);
    return notifier ? notifier.listeners : [];
  };
}
/**
 * Settle any promises returned by event listeners in series.
 *
 * If any errors are encountered during processing, they will be ignored.
 */

function settleInSeries(obj, eventName) {
  for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
    args[_key2 - 2] = arguments[_key2];
  }

  var listeners = obj.listeners(eventName);
  return listeners.reduce(function (chain, listener) {
    return chain.then(function () {
      return listener.apply(void 0, args);
    }).catch(function () {});
  }, Promise.resolve());
}
/**
 * Fulfill any promises returned by event listeners in series.
 *
 * Processing will stop if an error is encountered and the returned promise will
 * be rejected.
 */

function fulfillInSeries(obj, eventName) {
  for (var _len3 = arguments.length, args = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
    args[_key3 - 2] = arguments[_key3];
  }

  var listeners = obj.listeners(eventName);
  return new Promise(function (resolve, reject) {
    fulfillEach(listeners, args, resolve, reject);
  });
}

function notifierForEvent(object, eventName) {
  var createIfUndefined = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  if (object._eventedNotifiers === undefined) {
    object._eventedNotifiers = {};
  }

  var notifier = object._eventedNotifiers[eventName];

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
    var listener;
    var _listeners = listeners;
    listener = _listeners[0];
    listeners = _listeners.slice(1);
    var response = listener.apply(void 0, args);

    if (response) {
      return Promise.resolve(response).then(function () {
        return fulfillEach(listeners, args, resolve, reject);
      }).catch(function (error) {
        return reject(error);
      });
    } else {
      fulfillEach(listeners, args, resolve, reject);
    }
  }
}

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
    if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  }
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var assert$1 = Orbit.assert;
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
      assert$1('TaskQueue requires a name if it has a bucket', !!this._name);
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
var TaskQueue$1 = TaskQueue;

function _defineProperties$2(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass$2(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$2(Constructor.prototype, protoProps); if (staticProps) _defineProperties$2(Constructor, staticProps); return Constructor; }

var __decorate$1 = undefined && undefined.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
    if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  }
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

exports.Bucket =
/*#__PURE__*/
function () {
  function Bucket() {
    var settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (settings.version === undefined) {
      settings.version = 1;
    }

    settings.namespace = settings.namespace || 'orbit-bucket';

    this._applySettings(settings);
  }
  /**
   * Name used for tracking and debugging a bucket instance.
   */


  var _proto = Bucket.prototype;

  /**
   * Upgrades Bucket to a new version with new settings.
   *
   * Settings, beyond `version`, are bucket-specific.
   */
  _proto.upgrade = function upgrade() {
    var _this = this;

    var settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (settings.version === undefined) {
      settings.version = this._version + 1;
    }

    return this._applySettings(settings).then(function () {
      return _this.emit('upgrade', _this._version);
    });
  }
  /**
   * Applies settings passed from a `constructor` or `upgrade`.
   */
  ;

  _proto._applySettings = function _applySettings(settings) {
    if (settings.name) {
      this._name = settings.name;
    }

    if (settings.namespace) {
      this._namespace = settings.namespace;
    }

    this._version = settings.version;
    return Promise.resolve();
  };

  _createClass$2(Bucket, [{
    key: "name",
    get: function () {
      return this._name;
    }
    /**
     * The namespace used by the bucket when accessing any items.
     *
     * This is used to distinguish one bucket's contents from another.
     */

  }, {
    key: "namespace",
    get: function () {
      return this._namespace;
    }
    /**
     * The current version of the bucket.
     *
     * This is read-only. To change versions, `upgrade` should be invoked.
     */

  }, {
    key: "version",
    get: function () {
      return this._version;
    }
  }]);

  return Bucket;
}();

exports.Bucket = __decorate$1([evented], exports.Bucket);

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _defaults(subClass, superClass); }

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

function _defineProperties$3(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass$3(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$3(Constructor.prototype, protoProps); if (staticProps) _defineProperties$3(Constructor, staticProps); return Constructor; }

var __decorate$2 = undefined && undefined.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
    if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  }
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var assert$2 = Orbit.assert;
/**
 * Logs track a series of unique events that have occurred. Each event is
 * tracked based on its unique id. The log only tracks the ids but currently
 * does not track any details.
 *
 * Logs can automatically be persisted by assigning them a bucket.
 */

var Log =
/*#__PURE__*/
function () {
  function Log() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this._name = options.name;
    this._bucket = options.bucket;

    if (this._bucket) {
      assert$2('Log requires a name if it has a bucket', !!this._name);
    }

    this._reify(options.data);
  }

  var _proto = Log.prototype;

  _proto.append = function append() {
    var _this = this;

    for (var _len = arguments.length, ids = new Array(_len), _key = 0; _key < _len; _key++) {
      ids[_key] = arguments[_key];
    }

    return this.reified.then(function () {
      Array.prototype.push.apply(_this._data, ids);
      return _this._persist();
    }).then(function () {
      _this.emit('append', ids);
    });
  };

  _proto.before = function before(id) {
    var relativePosition = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var index = this._data.indexOf(id);

    if (index === -1) {
      throw new NotLoggedException(id);
    }

    var position = index + relativePosition;

    if (position < 0 || position >= this._data.length) {
      throw new OutOfRangeException(position);
    }

    return this._data.slice(0, position);
  };

  _proto.after = function after(id) {
    var relativePosition = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var index = this._data.indexOf(id);

    if (index === -1) {
      throw new NotLoggedException(id);
    }

    var position = index + 1 + relativePosition;

    if (position < 0 || position > this._data.length) {
      throw new OutOfRangeException(position);
    }

    return this._data.slice(position);
  };

  _proto.truncate = function truncate(id) {
    var _this2 = this;

    var relativePosition = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var removed;
    return this.reified.then(function () {
      var index = _this2._data.indexOf(id);

      if (index === -1) {
        throw new NotLoggedException(id);
      }

      var position = index + relativePosition;

      if (position < 0 || position > _this2._data.length) {
        throw new OutOfRangeException(position);
      }

      if (position === _this2._data.length) {
        removed = _this2._data;
        _this2._data = [];
      } else {
        removed = _this2._data.slice(0, position);
        _this2._data = _this2._data.slice(position);
      }

      return _this2._persist();
    }).then(function () {
      _this2.emit('truncate', id, relativePosition, removed);
    });
  };

  _proto.rollback = function rollback(id) {
    var _this3 = this;

    var relativePosition = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var removed;
    return this.reified.then(function () {
      var index = _this3._data.indexOf(id);

      if (index === -1) {
        throw new NotLoggedException(id);
      }

      var position = index + 1 + relativePosition;

      if (position < 0 || position > _this3._data.length) {
        throw new OutOfRangeException(position);
      }

      removed = _this3._data.slice(position);
      _this3._data = _this3._data.slice(0, position);
      return _this3._persist();
    }).then(function () {
      _this3.emit('rollback', id, relativePosition, removed);
    });
  };

  _proto.clear = function clear() {
    var _this4 = this;

    var clearedData;
    return this.reified.then(function () {
      clearedData = _this4._data;
      _this4._data = [];
      return _this4._persist();
    }).then(function () {
      return _this4.emit('clear', clearedData);
    });
  };

  _proto.contains = function contains(id) {
    return this._data.indexOf(id) > -1;
  };

  _proto._persist = function _persist() {
    this.emit('change');

    if (this.bucket) {
      return this._bucket.setItem(this.name, this._data);
    } else {
      return Promise.resolve();
    }
  };

  _proto._reify = function _reify(data) {
    var _this5 = this;

    if (!data && this._bucket) {
      this.reified = this._bucket.getItem(this._name).then(function (bucketData) {
        return _this5._initData(bucketData);
      });
    } else {
      this._initData(data);

      this.reified = Promise.resolve();
    }
  };

  _proto._initData = function _initData(data) {
    if (data) {
      this._data = data;
    } else {
      this._data = [];
    }
  };

  _createClass$3(Log, [{
    key: "name",
    get: function () {
      return this._name;
    }
  }, {
    key: "bucket",
    get: function () {
      return this._bucket;
    }
  }, {
    key: "head",
    get: function () {
      return this._data[this._data.length - 1];
    }
  }, {
    key: "entries",
    get: function () {
      return this._data;
    }
  }, {
    key: "length",
    get: function () {
      return this._data.length;
    }
  }]);

  return Log;
}();

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
