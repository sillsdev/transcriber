function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ('value' in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

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
      for (var i = decorators.length - 1; i >= 0; i--) {
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };

import Orbit from './main';
import evented from './evented';
import { NotLoggedException, OutOfRangeException } from './exception';
var assert = Orbit.assert;
/**
 * Logs track a series of unique events that have occurred. Each event is
 * tracked based on its unique id. The log only tracks the ids but currently
 * does not track any details.
 *
 * Logs can automatically be persisted by assigning them a bucket.
 */

var Log =
  /*#__PURE__*/
  (function () {
    function Log() {
      var options =
        arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      this._name = options.name;
      this._bucket = options.bucket;

      if (this._bucket) {
        assert('Log requires a name if it has a bucket', !!this._name);
      }

      this._reify(options.data);
    }

    var _proto = Log.prototype;

    _proto.append = function append() {
      var _this = this;

      for (
        var _len = arguments.length, ids = new Array(_len), _key = 0;
        _key < _len;
        _key++
      ) {
        ids[_key] = arguments[_key];
      }

      return this.reified
        .then(function () {
          Array.prototype.push.apply(_this._data, ids);
          return _this._persist();
        })
        .then(function () {
          _this.emit('append', ids);
        });
    };

    _proto.before = function before(id) {
      var relativePosition =
        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

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
      var relativePosition =
        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

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

      var relativePosition =
        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var removed;
      return this.reified
        .then(function () {
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
        })
        .then(function () {
          _this2.emit('truncate', id, relativePosition, removed);
        });
    };

    _proto.rollback = function rollback(id) {
      var _this3 = this;

      var relativePosition =
        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var removed;
      return this.reified
        .then(function () {
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
        })
        .then(function () {
          _this3.emit('rollback', id, relativePosition, removed);
        });
    };

    _proto.clear = function clear() {
      var _this4 = this;

      var clearedData;
      return this.reified
        .then(function () {
          clearedData = _this4._data;
          _this4._data = [];
          return _this4._persist();
        })
        .then(function () {
          return _this4.emit('clear', clearedData);
        });
    };

    _proto.contains = function contains(id) {
      return this._data?.indexOf(id) > -1;
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
        this.reified = this._bucket
          .getItem(this._name)
          .then(function (bucketData) {
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

    _createClass(Log, [
      {
        key: 'name',
        get: function () {
          return this._name;
        },
      },
      {
        key: 'bucket',
        get: function () {
          return this._bucket;
        },
      },
      {
        key: 'head',
        get: function () {
          return this._data[this._data.length - 1];
        },
      },
      {
        key: 'entries',
        get: function () {
          return this._data;
        },
      },
      {
        key: 'length',
        get: function () {
          return this._data.length;
        },
      },
    ]);

    return Log;
  })();

Log = __decorate([evented], Log);
export default Log;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxvZy5qcyJdLCJuYW1lcyI6WyJfX2RlY29yYXRlIiwiZGVjb3JhdG9ycyIsInRhcmdldCIsImtleSIsImRlc2MiLCJjIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiciIsIk9iamVjdCIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsImQiLCJSZWZsZWN0IiwiZGVjb3JhdGUiLCJpIiwiZGVmaW5lUHJvcGVydHkiLCJPcmJpdCIsImV2ZW50ZWQiLCJOb3RMb2dnZWRFeGNlcHRpb24iLCJPdXRPZlJhbmdlRXhjZXB0aW9uIiwiYXNzZXJ0IiwiTG9nIiwib3B0aW9ucyIsIl9uYW1lIiwibmFtZSIsIl9idWNrZXQiLCJidWNrZXQiLCJfcmVpZnkiLCJkYXRhIiwiYXBwZW5kIiwiaWRzIiwicmVpZmllZCIsInRoZW4iLCJBcnJheSIsInByb3RvdHlwZSIsInB1c2giLCJhcHBseSIsIl9kYXRhIiwiX3BlcnNpc3QiLCJlbWl0IiwiYmVmb3JlIiwiaWQiLCJyZWxhdGl2ZVBvc2l0aW9uIiwiaW5kZXgiLCJpbmRleE9mIiwicG9zaXRpb24iLCJzbGljZSIsImFmdGVyIiwidHJ1bmNhdGUiLCJyZW1vdmVkIiwicm9sbGJhY2siLCJjbGVhciIsImNsZWFyZWREYXRhIiwiY29udGFpbnMiLCJzZXRJdGVtIiwiUHJvbWlzZSIsInJlc29sdmUiLCJnZXRJdGVtIiwiYnVja2V0RGF0YSIsIl9pbml0RGF0YSJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLElBQUlBLFVBQVUsR0FBRyxRQUFRLEtBQUtBLFVBQWIsSUFBMkIsVUFBVUMsVUFBVixFQUFzQkMsTUFBdEIsRUFBOEJDLEdBQTlCLEVBQW1DQyxJQUFuQyxFQUF5QztBQUNuRixNQUFJQyxDQUFDLEdBQUdDLFNBQVMsQ0FBQ0MsTUFBbEI7QUFBQSxNQUNJQyxDQUFDLEdBQUdILENBQUMsR0FBRyxDQUFKLEdBQVFILE1BQVIsR0FBaUJFLElBQUksS0FBSyxJQUFULEdBQWdCQSxJQUFJLEdBQUdLLE1BQU0sQ0FBQ0Msd0JBQVAs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S0FBTCxDQUFXLEtBQUtBLEtBQUwsQ0FBVzlCLE1BQVgsR0FBb0IsQ0FBL0IsQ0FBUDtBQUNEO0FBdEJJO0FBQUE7QUFBQSxxQkF3QlM7QUFDWixhQUFPLEtBQUs4QixLQUFaO0FBQ0Q7QUExQkk7QUFBQTtBQUFBLHFCQTRCUTtBQUNYLGFBQU8sS0FBS0EsS0FBTCxDQUFXOUIsTUFBbEI7QUFDRDtBQTlCSTs7QUFBQTtBQUFBLEdBQVA7O0FBdUtBYyxHQUFHLEdBQUdyQixVQUFVLENBQUMsQ0FBQ2lCLE9BQUQsQ0FBRCxFQUFZSSxHQUFaLENBQWhCO0FBQ0EsZUFBZUEsR0FBZiIsInNvdXJjZXNDb250ZW50IjpbInZhciBfX2RlY29yYXRlID0gdGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgICAgIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLFxuICAgICAgZDtcbiAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcblxuaW1wb3J0IE9yYml0IGZyb20gJy4vbWFpbic7XG5pbXBvcnQgZXZlbnRlZCBmcm9tICcuL2V2ZW50ZWQnO1xuaW1wb3J0IHsgTm90TG9nZ2VkRXhjZXB0aW9uLCBPdXRPZlJhbmdlRXhjZXB0aW9uIH0gZnJvbSAnLi9leGNlcHRpb24nO1xuY29uc3Qge1xuICBhc3NlcnRcbn0gPSBPcmJpdDtcbi8qKlxuICogTG9ncyB0cmFjayBhIHNlcmllcyBvZiB1bmlxdWUgZXZlbnRzIHRoYXQgaGF2ZSBvY2N1cnJlZC4gRWFjaCBldmVudCBpc1xuICogdHJhY2tlZCBiYXNlZCBvbiBpdHMgdW5pcXVlIGlkLiBUaGUgbG9nIG9ubHkgdHJhY2tzIHRoZSBpZHMgYnV0IGN1cnJlbnRseVxuICogZG9lcyBub3QgdHJhY2sgYW55IGRldGFpbHMuXG4gKlxuICogTG9ncyBjYW4gYXV0b21hdGljYWxseSBiZSBwZXJzaXN0ZWQgYnkgYXNzaWduaW5nIHRoZW0gYSBidWNrZXQuXG4gKi9cblxubGV0IExvZyA9IGNsYXNzIExvZyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuX25hbWUgPSBvcHRpb25zLm5hbWU7XG4gICAgdGhpcy5fYnVja2V0ID0gb3B0aW9ucy5idWNrZXQ7XG5cbiAgICBpZiAodGhpcy5fYnVja2V0KSB7XG4gICAgICBhc3NlcnQoJ0xvZyByZXF1aXJlcyBhIG5hbWUgaWYgaXQgaGFzIGEgYnVja2V0JywgISF0aGlzLl9uYW1lKTtcbiAgICB9XG5cbiAgICB0aGlzLl9yZWlmeShvcHRpb25zLmRhdGEpO1xuICB9XG5cbiAgZ2V0IG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gIH1cblxuICBnZXQgYnVja2V0KCkge1xuICAgIHJldHVybiB0aGlzLl9idWNrZXQ7XG4gIH1cblxuICBnZXQgaGVhZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGF0YVt0aGlzLl9kYXRhLmxlbmd0aCAtIDFdO1xuICB9XG5cbiAgZ2V0IGVudHJpZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gIH1cblxuICBnZXQgbGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgfVxuXG4gIGFwcGVuZCguLi5pZHMpIHtcbiAgICByZXR1cm4gdGhpcy5yZWlmaWVkLnRoZW4oKCkgPT4ge1xuICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkodGhpcy5fZGF0YSwgaWRzKTtcbiAgICAgIHJldHVybiB0aGlzLl9wZXJzaXN0KCk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLmVtaXQoJ2FwcGVuZCcsIGlkcyk7XG4gICAgfSk7XG4gIH1cblxuICBiZWZvcmUoaWQsIHJlbGF0aXZlUG9zaXRpb24gPSAwKSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLl9kYXRhLmluZGV4T2YoaWQpO1xuXG4gICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IE5vdExvZ2dlZEV4Y2VwdGlvbihpZCk7XG4gICAgfVxuXG4gICAgY29uc3QgcG9zaXRpb24gPSBpbmRleCArIHJlbGF0aXZlUG9zaXRpb247XG5cbiAgICBpZiAocG9zaXRpb24gPCAwIHx8IHBvc2l0aW9uID49IHRoaXMuX2RhdGEubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgT3V0T2ZSYW5nZUV4Y2VwdGlvbihwb3NpdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2RhdGEuc2xpY2UoMCwgcG9zaXRpb24pO1xuICB9XG5cbiAgYWZ0ZXIoaWQsIHJlbGF0aXZlUG9zaXRpb24gPSAwKSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLl9kYXRhLmluZGV4T2YoaWQpO1xuXG4gICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IE5vdExvZ2dlZEV4Y2VwdGlvbihpZCk7XG4gICAgfVxuXG4gICAgY29uc3QgcG9zaXRpb24gPSBpbmRleCArIDEgKyByZWxhdGl2ZVBvc2l0aW9uO1xuXG4gICAgaWYgKHBvc2l0aW9uIDwgMCB8fCBwb3NpdGlvbiA+IHRoaXMuX2RhdGEubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgT3V0T2ZSYW5nZUV4Y2VwdGlvbihwb3NpdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2RhdGEuc2xpY2UocG9zaXRpb24pO1xuICB9XG5cbiAgdHJ1bmNhdGUoaWQsIHJlbGF0aXZlUG9zaXRpb24gPSAwKSB7XG4gICAgbGV0IHJlbW92ZWQ7XG4gICAgcmV0dXJuIHRoaXMucmVpZmllZC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fZGF0YS5pbmRleE9mKGlkKTtcblxuICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICB0aHJvdyBuZXcgTm90TG9nZ2VkRXhjZXB0aW9uKGlkKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcG9zaXRpb24gPSBpbmRleCArIHJlbGF0aXZlUG9zaXRpb247XG5cbiAgICAgIGlmIChwb3NpdGlvbiA8IDAgfHwgcG9zaXRpb24gPiB0aGlzLl9kYXRhLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgT3V0T2ZSYW5nZUV4Y2VwdGlvbihwb3NpdGlvbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChwb3NpdGlvbiA9PT0gdGhpcy5fZGF0YS5sZW5ndGgpIHtcbiAgICAgICAgcmVtb3ZlZCA9IHRoaXMuX2RhdGE7XG4gICAgICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlbW92ZWQgPSB0aGlzLl9kYXRhLnNsaWNlKDAsIHBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5fZGF0YSA9IHRoaXMuX2RhdGEuc2xpY2UocG9zaXRpb24pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5fcGVyc2lzdCgpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5lbWl0KCd0cnVuY2F0ZScsIGlkLCByZWxhdGl2ZVBvc2l0aW9uLCByZW1vdmVkKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJvbGxiYWNrKGlkLCByZWxhdGl2ZVBvc2l0aW9uID0gMCkge1xuICAgIGxldCByZW1vdmVkO1xuICAgIHJldHVybiB0aGlzLnJlaWZpZWQudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMuX2RhdGEuaW5kZXhPZihpZCk7XG5cbiAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgdGhyb3cgbmV3IE5vdExvZ2dlZEV4Y2VwdGlvbihpZCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBvc2l0aW9uID0gaW5kZXggKyAxICsgcmVsYXRpdmVQb3NpdGlvbjtcblxuICAgICAgaWYgKHBvc2l0aW9uIDwgMCB8fCBwb3NpdGlvbiA+IHRoaXMuX2RhdGEubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBPdXRPZlJhbmdlRXhjZXB0aW9uKHBvc2l0aW9uKTtcbiAgICAgIH1cblxuICAgICAgcmVtb3ZlZCA9IHRoaXMuX2RhdGEuc2xpY2UocG9zaXRpb24pO1xuICAgICAgdGhpcy5fZGF0YSA9IHRoaXMuX2RhdGEuc2xpY2UoMCwgcG9zaXRpb24pO1xuICAgICAgcmV0dXJuIHRoaXMuX3BlcnNpc3QoKTtcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuZW1pdCgncm9sbGJhY2snLCBpZCwgcmVsYXRpdmVQb3NpdGlvbiwgcmVtb3ZlZCk7XG4gICAgfSk7XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICBsZXQgY2xlYXJlZERhdGE7XG4gICAgcmV0dXJuIHRoaXMucmVpZmllZC50aGVuKCgpID0+IHtcbiAgICAgIGNsZWFyZWREYXRhID0gdGhpcy5fZGF0YTtcbiAgICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICAgIHJldHVybiB0aGlzLl9wZXJzaXN0KCk7XG4gICAgfSkudGhlbigoKSA9PiB0aGlzLmVtaXQoJ2NsZWFyJywgY2xlYXJlZERhdGEpKTtcbiAgfVxuXG4gIGNvbnRhaW5zKGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGEuaW5kZXhPZihpZCkgPiAtMTtcbiAgfVxuXG4gIF9wZXJzaXN0KCkge1xuICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG5cbiAgICBpZiAodGhpcy5idWNrZXQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9idWNrZXQuc2V0SXRlbSh0aGlzLm5hbWUsIHRoaXMuX2RhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICB9XG5cbiAgX3JlaWZ5KGRhdGEpIHtcbiAgICBpZiAoIWRhdGEgJiYgdGhpcy5fYnVja2V0KSB7XG4gICAgICB0aGlzLnJlaWZpZWQgPSB0aGlzLl9idWNrZXQuZ2V0SXRlbSh0aGlzLl9uYW1lKS50aGVuKGJ1Y2tldERhdGEgPT4gdGhpcy5faW5pdERhdGEoYnVja2V0RGF0YSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9pbml0RGF0YShkYXRhKTtcblxuICAgICAgdGhpcy5yZWlmaWVkID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICB9XG5cbiAgX2luaXREYXRhKGRhdGEpIHtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICB9XG4gIH1cblxufTtcbkxvZyA9IF9fZGVjb3JhdGUoW2V2ZW50ZWRdLCBMb2cpO1xuZXhwb3J0IGRlZmF1bHQgTG9nOyJdfQ==
