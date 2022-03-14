var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

import evented from './evented';
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

let Bucket = class Bucket {
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
Bucket = __decorate([evented], Bucket);
export { Bucket };