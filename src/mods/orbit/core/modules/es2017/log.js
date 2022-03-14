var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };

import Orbit from './main';
import evented from './evented';
import { NotLoggedException, OutOfRangeException } from './exception';
const { assert } = Orbit;
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
      assert('Log requires a name if it has a bucket', !!this._name);
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
    return this.reified
      .then(() => {
        Array.prototype.push.apply(this._data, ids);
        return this._persist();
      })
      .then(() => {
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
    return this.reified
      .then(() => {
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
      })
      .then(() => {
        this.emit('truncate', id, relativePosition, removed);
      });
  }

  rollback(id, relativePosition = 0) {
    let removed;
    return this.reified
      .then(() => {
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
      })
      .then(() => {
        this.emit('rollback', id, relativePosition, removed);
      });
  }

  clear() {
    let clearedData;
    return this.reified
      .then(() => {
        clearedData = this._data;
        this._data = [];
        return this._persist();
      })
      .then(() => this.emit('clear', clearedData));
  }

  contains(id) {
    return this._data?.indexOf(id) > -1;
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
      this.reified = this._bucket
        .getItem(this._name)
        .then((bucketData) => this._initData(bucketData));
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
Log = __decorate([evented], Log);
export default Log;
