"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Bucket = void 0;

var _evented = _interopRequireDefault(require("./evented"));

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
var Bucket =
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

  _createClass(Bucket, [{
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

exports.Bucket = Bucket;
exports.Bucket = Bucket = __decorate([_evented.default], Bucket);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJ1Y2tldC5qcyJdLCJuYW1lcyI6WyJfX2RlY29yYXRlIiwiYyIsImFyZ3VtZW50cyIsInIiLCJkZXNjIiwiT2JqZWN0IiwiUmVmbGVjdCIsImkiLCJkZWNvcmF0b3JzIiwiZCIsIkJ1Y2tldCIsInNldHRpbmdzIiwidXBncmFkZSIsIl9hcHBseVNldHRpbmdzIiwiUHJvbWlzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVJBLElBQUlBLFVBQVUsR0FBRyxVQUFRLFNBQVIsVUFBQSxJQUEyQixVQUFBLFVBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBeUM7QUFDbkYsTUFBSUMsQ0FBQyxHQUFHQyxTQUFTLENBQWpCLE1BQUE7QUFBQSxNQUNJQyxDQUFDLEdBQUdGLENBQUMsR0FBREEsQ0FBQUEsR0FBQUEsTUFBQUEsR0FBaUJHLElBQUksS0FBSkEsSUFBQUEsR0FBZ0JBLElBQUksR0FBR0MsTUFBTSxDQUFOQSx3QkFBQUEsQ0FBQUEsTUFBQUEsRUFBdkJELEdBQXVCQyxDQUF2QkQsR0FEekIsSUFBQTtBQUFBLE1BQUEsQ0FBQTtBQUdBLE1BQUksT0FBQSxPQUFBLEtBQUEsUUFBQSxJQUErQixPQUFPRSxPQUFPLENBQWQsUUFBQSxLQUFuQyxVQUFBLEVBQTJFSCxDQUFDLEdBQUdHLE9BQU8sQ0FBUEEsUUFBQUEsQ0FBQUEsVUFBQUEsRUFBQUEsTUFBQUEsRUFBQUEsR0FBQUEsRUFBL0UsSUFBK0VBLENBQUpILENBQTNFLEtBQW9JLEtBQUssSUFBSUksQ0FBQyxHQUFHQyxVQUFVLENBQVZBLE1BQUFBLEdBQWIsQ0FBQSxFQUFvQ0QsQ0FBQyxJQUFyQyxDQUFBLEVBQTRDQSxDQUE1QyxFQUFBLEVBQUE7QUFBaUQsUUFBSUUsQ0FBQyxHQUFHRCxVQUFVLENBQWxCLENBQWtCLENBQWxCLEVBQXVCTCxDQUFDLEdBQUcsQ0FBQ0YsQ0FBQyxHQUFEQSxDQUFBQSxHQUFRUSxDQUFDLENBQVRSLENBQVMsQ0FB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LEVBQVY7OztBQXVFQUosaUJBQUFBLE1BQU0sR0FBR1YsVUFBVSxDQUFDLENBQUQsZ0JBQUMsQ0FBRCxFQUFuQlUsTUFBbUIsQ0FBbkJBIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF9fZGVjb3JhdGUgPSB0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLFxuICAgICAgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsXG4gICAgICBkO1xuICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO2Vsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuXG5pbXBvcnQgZXZlbnRlZCBmcm9tICcuL2V2ZW50ZWQnO1xuLyoqXG4gKiBCdWNrZXRzIGNhbiBwZXJzaXN0IHN0YXRlLiBUaGUgYmFzZSBgQnVja2V0YCBjbGFzcyBpcyBhYnN0cmFjdCBhbmQgc2hvdWxkIGJlXG4gKiBleHRlbmRlZCB0byBjcmVhdGUgYnVja2V0cyB3aXRoIGRpZmZlcmVudCBwZXJzaXN0ZW5jZSBzdHJhdGVnaWVzLlxuICpcbiAqIEJ1Y2tldHMgaGF2ZSBhIHNpbXBsZSBtYXAtbGlrZSBpbnRlcmZhY2Ugd2l0aCBtZXRob2RzIGxpa2UgYGdldEl0ZW1gLFxuICogYHNldEl0ZW1gLCBhbmQgYHJlbW92ZUl0ZW1gLiBBbGwgbWV0aG9kcyByZXR1cm4gcHJvbWlzZXMgdG8gZW5hYmxlIHVzYWdlIHdpdGhcbiAqIGFzeW5jaHJvbm91cyBzdG9yZXMgbGlrZSBJbmRleGVkREIuXG4gKlxuICogQnVja2V0cyBjYW4gYmUgYXNzaWduZWQgYSB1bmlxdWUgYG5hbWVzcGFjZWAgaW4gb3JkZXIgdG8gYXZvaWQgY29sbGlzaW9ucy5cbiAqXG4gKiBCdWNrZXRzIGNhbiBiZSBhc3NpZ25lZCBhIHZlcnNpb24sIGFuZCBjYW4gYmUgXCJ1cGdyYWRlZFwiIHRvIGEgbmV3IHZlcnNpb24uXG4gKiBUaGUgdXBncmFkZSBwcm9jZXNzIGFsbG93cyBidWNrZXRzIHRvIG1pZ3JhdGUgdGhlaXIgZGF0YSBiZXR3ZWVuIHZlcnNpb25zLlxuICovXG5cbmxldCBCdWNrZXQgPSBjbGFzcyBCdWNrZXQge1xuICBjb25zdHJ1Y3RvcihzZXR0aW5ncyA9IHt9KSB7XG4gICAgaWYgKHNldHRpbmdzLnZlcnNpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgc2V0dGluZ3MudmVyc2lvbiA9IDE7XG4gICAgfVxuXG4gICAgc2V0dGluZ3MubmFtZXNwYWNlID0gc2V0dGluZ3MubmFtZXNwYWNlIHx8ICdvcmJpdC1idWNrZXQnO1xuXG4gICAgdGhpcy5fYXBwbHlTZXR0aW5ncyhzZXR0aW5ncyk7XG4gIH1cbiAgLyoqXG4gICAqIE5hbWUgdXNlZCBmb3IgdHJhY2tpbmcgYW5kIGRlYnVnZ2luZyBhIGJ1Y2tldCBpbnN0YW5jZS5cbiAgICovXG5cblxuICBnZXQgbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgfVxuICAvKipcbiAgICogVGhlIG5hbWVzcGFjZSB1c2VkIGJ5IHRoZSBidWNrZXQgd2hlbiBhY2Nlc3NpbmcgYW55IGl0ZW1zLlxuICAgKlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gZGlzdGluZ3Vpc2ggb25lIGJ1Y2tldCdzIGNvbnRlbnRzIGZyb20gYW5vdGhlci5cbiAgICovXG5cblxuICBnZXQgbmFtZXNwYWNlKCkge1xuICAgIHJldHVybiB0aGlzLl9uYW1lc3BhY2U7XG4gIH1cbiAgLyoqXG4gICAqIFRoZSBjdXJyZW50IHZlcnNpb24gb2YgdGhlIGJ1Y2tldC5cbiAgICpcbiAgICogVGhpcyBpcyByZWFkLW9ubHkuIFRvIGNoYW5nZSB2ZXJzaW9ucywgYHVwZ3JhZGVgIHNob3VsZCBiZSBpbnZva2VkLlxuICAgKi9cblxuXG4gIGdldCB2ZXJzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLl92ZXJzaW9uO1xuICB9XG4gIC8qKlxuICAgKiBVcGdyYWRlcyBCdWNrZXQgdG8gYSBuZXcgdmVyc2lvbiB3aXRoIG5ldyBzZXR0aW5ncy5cbiAgICpcbiAgICogU2V0dGluZ3MsIGJleW9uZCBgdmVyc2lvbmAsIGFyZSBidWNrZXQtc3BlY2lmaWMuXG4gICAqL1xuXG5cbiAgdXBncmFkZShzZXR0aW5ncyA9IHt9KSB7XG4gICAgaWYgKHNldHRpbmdzLnZlcnNpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgc2V0dGluZ3MudmVyc2lvbiA9IHRoaXMuX3ZlcnNpb24gKyAxO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9hcHBseVNldHRpbmdzKHNldHRpbmdzKS50aGVuKCgpID0+IHRoaXMuZW1pdCgndXBncmFkZScsIHRoaXMuX3ZlcnNpb24pKTtcbiAgfVxuICAvKipcbiAgICogQXBwbGllcyBzZXR0aW5ncyBwYXNzZWQgZnJvbSBhIGBjb25zdHJ1Y3RvcmAgb3IgYHVwZ3JhZGVgLlxuICAgKi9cblxuXG4gIF9hcHBseVNldHRpbmdzKHNldHRpbmdzKSB7XG4gICAgaWYgKHNldHRpbmdzLm5hbWUpIHtcbiAgICAgIHRoaXMuX25hbWUgPSBzZXR0aW5ncy5uYW1lO1xuICAgIH1cblxuICAgIGlmIChzZXR0aW5ncy5uYW1lc3BhY2UpIHtcbiAgICAgIHRoaXMuX25hbWVzcGFjZSA9IHNldHRpbmdzLm5hbWVzcGFjZTtcbiAgICB9XG5cbiAgICB0aGlzLl92ZXJzaW9uID0gc2V0dGluZ3MudmVyc2lvbjtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxufTtcbkJ1Y2tldCA9IF9fZGVjb3JhdGUoW2V2ZW50ZWRdLCBCdWNrZXQpO1xuZXhwb3J0IHsgQnVja2V0IH07Il19