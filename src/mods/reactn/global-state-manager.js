var __values =
  (this && this.__values) ||
  function (o) {
    var s = typeof Symbol === 'function' && Symbol.iterator,
      m = s && o[s],
      i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === 'number')
      return {
        next: function () {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        },
      };
    throw new TypeError(
      s ? 'Object is not iterable.' : 'Symbol.iterator is not defined.'
    );
  };
var __read =
  (this && this.__read) ||
  function (o, n) {
    var m = typeof Symbol === 'function' && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
      r,
      ar = [],
      e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error: error };
    } finally {
      try {
        if (r && !r.done && (m = i['return'])) m.call(i);
      } finally {
        if (e) throw e.error;
      }
    }
    return ar;
  };
var __spread =
  (this && this.__spread) ||
  function () {
    for (var ar = [], i = 0; i < arguments.length; i++)
      ar = ar.concat(__read(arguments[i]));
    return ar;
  };
Object.defineProperty(exports, '__esModule', { value: true });
var object_get_listener_1 = require('./utils/object-get-listener');
var copyObject = function (obj) {
  return Object.assign(Object.create(null), obj);
};
exports.INVALID_NEW_GLOBAL_STATE = new Error(
  'ReactN global state must be a function, null, object, or Promise.'
);
var GlobalStateManager = (function () {
  function GlobalStateManager(initialState, initialReducers) {
    if (initialState === void 0) {
      initialState = Object.create(null);
    }
    if (initialReducers === void 0) {
      initialReducers = Object.create(null);
    }
    this._callbacks = new Set();
    this._dispatchers = Object.create(null);
    this._middlewares = new Set();
    this._propertyListeners = new Map();
    this._queue = new Map();
    this._initialReducers = copyObject(initialReducers);
    this._initialState = copyObject(initialState);
    this._state = copyObject(initialState);
    this.addReducers(initialReducers);
  }
  GlobalStateManager.prototype.addCallback = function (callback) {
    var _this = this;
    this._callbacks.add(callback);
    return function () {
      return _this.removeCallback(callback);
    };
  };
  GlobalStateManager.prototype.addMiddleware = function (createMiddleware) {
    var _this = this;
    var middleware = createMiddleware(this.state, this.dispatchers);
    this._middlewares.add(middleware);
    return function () {
      return _this.removeMiddleware(middleware);
    };
  };
  GlobalStateManager.prototype.addPropertyListener = function (
    property,
    propertyListener
  ) {
    if (this.propertyListeners.has(property)) {
      this.propertyListeners.get(property).add(propertyListener);
    } else {
      this.propertyListeners.set(property, new Set([propertyListener]));
    }
  };
  GlobalStateManager.prototype.addReducer = function (name, reducer) {
    var _this = this;
    this._dispatchers[name] = this.createDispatcher(reducer, name);
    return function () {
      return _this.removeDispatcher(name);
    };
  };
  GlobalStateManager.prototype.addReducers = function (reducers) {
    var e_1, _a;
    try {
      for (
        var _b = __values(Object.entries(reducers)), _c = _b.next();
        !_c.done;
        _c = _b.next()
      ) {
        var _d = __read(_c.value, 2),
          name_1 = _d[0],
          reducer = _d[1];
        this.addReducer(name_1, reducer);
      }
    } catch (e_1_1) {
      e_1 = { error: e_1_1 };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
      } finally {
        if (e_1) throw e_1.error;
      }
    }
  };
  GlobalStateManager.prototype.clearQueue = function () {
    return this.queue.clear();
  };
  GlobalStateManager.prototype.createDispatcher = function (reducer, name) {
    var _this = this;
    if (name === void 0) {
      name = reducer.name;
    }
    return function () {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return _this
        .set(
          reducer.apply(
            void 0,
            __spread([_this.state, _this.dispatcherMap], args)
          ),
          name,
          args
        )
        .then(function () {
          return _this.state;
        });
    };
  };
  Object.defineProperty(GlobalStateManager.prototype, 'dispatcherMap', {
    get: function () {
      var _this = this;
      var dispatch = function (newGlobalState) {
        return _this.set(newGlobalState).then(function () {
          return _this.state;
        });
      };
      return Object.assign(dispatch, this.dispatchers);
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(GlobalStateManager.prototype, 'dispatchers', {
    get: function () {
      return copyObject(this._dispatchers);
    },
    enumerable: true,
    configurable: true,
  });
  GlobalStateManager.prototype.enqueue = function (property, value) {
    this._queue.set(property, value);
  };
  GlobalStateManager.prototype.flush = function (reducerName, reducerArgs) {
    var e_2, _a, e_3, _b, e_4, _c, e_5, _d;
    var propertyListeners = new Set();
    var stateChange = Object.create(null);
    this.queue.forEach(function (value, key) {
      stateChange[key] = value;
    });
    try {
      for (
        var _e = __values(this.queue.entries()), _f = _e.next();
        !_f.done;
        _f = _e.next()
      ) {
        var _g = __read(_f.value, 2),
          property = _g[0],
          value = _g[1];
        this._state[property] = value;
        if (this.propertyListeners.has(property)) {
          try {
            for (
              var _h =
                  ((e_3 = void 0),
                  __values(this.propertyListeners.get(property))),
                _j = _h.next();
              !_j.done;
              _j = _h.next()
            ) {
              var propertyListener = _j.value;
              propertyListeners.add(propertyListener);
            }
          } catch (e_3_1) {
            e_3 = { error: e_3_1 };
          } finally {
            try {
              if (_j && !_j.done && (_b = _h.return)) _b.call(_h);
            } finally {
              if (e_3) throw e_3.error;
            }
          }
        }
      }
    } catch (e_2_1) {
      e_2 = { error: e_2_1 };
    } finally {
      try {
        if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
      } finally {
        if (e_2) throw e_2.error;
      }
    }
    this.clearQueue();
    try {
      for (
        var propertyListeners_1 = __values(propertyListeners),
          propertyListeners_1_1 = propertyListeners_1.next();
        !propertyListeners_1_1.done;
        propertyListeners_1_1 = propertyListeners_1.next()
      ) {
        // eslint-disable-next-line
        var propertyListener = propertyListeners_1_1.value;
        propertyListener();
      }
    } catch (e_4_1) {
      e_4 = { error: e_4_1 };
    } finally {
      try {
        if (
          propertyListeners_1_1 &&
          !propertyListeners_1_1.done &&
          (_c = propertyListeners_1.return)
        )
          _c.call(propertyListeners_1);
      } finally {
        if (e_4) throw e_4.error;
      }
    }
    try {
      for (
        var _k = __values(this._callbacks), _l = _k.next();
        !_l.done;
        _l = _k.next()
      ) {
        var callback = _l.value;
        this.set(
          callback(
            this.state,
            this.dispatchers,
            stateChange,
            reducerName,
            reducerArgs
          )
        );
      }
    } catch (e_5_1) {
      e_5 = { error: e_5_1 };
    } finally {
      try {
        if (_l && !_l.done && (_d = _k.return)) _d.call(_k);
      } finally {
        if (e_5) throw e_5.error;
      }
    }
    return stateChange;
  };
  GlobalStateManager.prototype.getDispatcher = function (name) {
    if (this.hasDispatcher(name)) {
      return this._dispatchers[name];
    }
    throw new Error('Cannot return unknown ReactN reducer `' + name + '`.');
  };
  GlobalStateManager.prototype.hasCallback = function (callback) {
    return this._callbacks.has(callback);
  };
  GlobalStateManager.prototype.hasMiddleware = function (middleware) {
    return this._middlewares.has(middleware);
  };
  GlobalStateManager.prototype.hasPropertyListener = function (pl) {
    var e_6, _a, e_7, _b;
    try {
      for (
        var _c = __values(this.propertyListeners.values()), _d = _c.next();
        !_d.done;
        _d = _c.next()
      ) {
        var propertyListeners = _d.value;
        try {
          for (
            var propertyListeners_2 =
                ((e_7 = void 0), __values(propertyListeners)),
              propertyListeners_2_1 = propertyListeners_2.next();
            !propertyListeners_2_1.done;
            propertyListeners_2_1 = propertyListeners_2.next()
          ) {
            var propertyListener = propertyListeners_2_1.value;
            if (propertyListener === pl) {
              return true;
            }
          }
        } catch (e_7_1) {
          e_7 = { error: e_7_1 };
        } finally {
          try {
            if (
              propertyListeners_2_1 &&
              !propertyListeners_2_1.done &&
              (_b = propertyListeners_2.return)
            )
              _b.call(propertyListeners_2);
          } finally {
            if (e_7) throw e_7.error;
          }
        }
      }
    } catch (e_6_1) {
      e_6 = { error: e_6_1 };
    } finally {
      try {
        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
      } finally {
        if (e_6) throw e_6.error;
      }
    }
    return false;
  };
  GlobalStateManager.prototype.hasDispatcher = function (name) {
    return Object.prototype.hasOwnProperty.call(this._dispatchers, name);
  };
  Object.defineProperty(GlobalStateManager.prototype, 'queue', {
    get: function () {
      return this._queue;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(GlobalStateManager.prototype, 'propertyListeners', {
    get: function () {
      return this._propertyListeners;
    },
    enumerable: true,
    configurable: true,
  });
  GlobalStateManager.prototype.removeCallback = function (callback) {
    return this._callbacks.delete(callback);
  };
  GlobalStateManager.prototype.removeDispatcher = function (name) {
    if (this.hasDispatcher(name)) {
      delete this._dispatchers[name];
      return true;
    }
    return false;
  };
  GlobalStateManager.prototype.removeMiddleware = function (middleware) {
    return this._middlewares.delete(middleware);
  };
  GlobalStateManager.prototype.removePropertyListener = function (
    propertyListener
  ) {
    var e_8, _a;
    var removed = false;
    try {
      for (
        var _b = __values(this.propertyListeners.values()), _c = _b.next();
        !_c.done;
        _c = _b.next()
      ) {
        var propertyListeners = _c.value;
        if (propertyListeners.delete(propertyListener)) {
          removed = true;
        }
      }
    } catch (e_8_1) {
      e_8 = { error: e_8_1 };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
      } finally {
        if (e_8) throw e_8.error;
      }
    }
    return removed;
  };
  GlobalStateManager.prototype.reset = function () {
    this._callbacks.clear();
    this._dispatchers = Object.create(null);
    this._middlewares.clear();
    this._propertyListeners.clear();
    this._queue.clear();
    this.addReducers(this._initialReducers);
    this._state = copyObject(this._initialState);
  };
  GlobalStateManager.prototype.set = function (
    newGlobalState,
    reducerName,
    reducerArgs
  ) {
    if (newGlobalState === null || typeof newGlobalState === 'undefined') {
      return Promise.resolve(Object.create(null));
    }
    if (newGlobalState instanceof Promise) {
      return this.setPromise(newGlobalState, reducerName, reducerArgs);
    }
    if (typeof newGlobalState === 'function') {
      return this.setFunction(newGlobalState, reducerName, reducerArgs);
    }
    if (typeof newGlobalState === 'object') {
      return this.setObject(newGlobalState, reducerName, reducerArgs);
    }
    throw exports.INVALID_NEW_GLOBAL_STATE;
  };
  GlobalStateManager.prototype.setFunction = function (
    f,
    reducerName,
    reducerArgs
  ) {
    return this.set(
      f(this.state, reducerName, reducerArgs),
      reducerName,
      reducerArgs
    );
  };
  GlobalStateManager.prototype.setObject = function (
    obj,
    reducerName,
    reducerArgs
  ) {
    var e_9, _a;
    var properties = Object.keys(obj);
    try {
      for (
        var properties_1 = __values(properties),
          properties_1_1 = properties_1.next();
        !properties_1_1.done;
        properties_1_1 = properties_1.next()
      ) {
        var property = properties_1_1.value;
        var value = obj[property];
        this.enqueue(property, value);
      }
    } catch (e_9_1) {
      e_9 = { error: e_9_1 };
    } finally {
      try {
        if (
          properties_1_1 &&
          !properties_1_1.done &&
          (_a = properties_1.return)
        )
          _a.call(properties_1);
      } finally {
        if (e_9) throw e_9.error;
      }
    }
    var stateChange = this.flush(reducerName, reducerArgs);
    return Promise.resolve(stateChange);
  };
  GlobalStateManager.prototype.setPromise = function (
    promise,
    reducerName,
    reducerArgs
  ) {
    var _this = this;
    return promise.then(function (result) {
      return _this.set(result, reducerName, reducerArgs);
    });
  };
  GlobalStateManager.prototype.spyState = function (propertyListener) {
    var _this = this;
    return object_get_listener_1.default(this._state, function (property) {
      _this.addPropertyListener(property, propertyListener);
    });
  };
  Object.defineProperty(GlobalStateManager.prototype, 'state', {
    get: function () {
      return copyObject(this._state);
    },
    enumerable: true,
    configurable: true,
  });
  return GlobalStateManager;
})();
exports.default = GlobalStateManager;
