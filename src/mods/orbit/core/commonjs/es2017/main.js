"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = require("./assert");

var _deprecate = require("./deprecate");

var _utils = require("@orbit/utils");

// Establish the root object, `window` (`self`) in the browser, `global`
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
  assert: _assert.assert,
  deprecate: _deprecate.deprecate,
  uuid: _utils.uuid
};
var _default = Orbit;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiZ2xvYmFscyIsInNlbGYiLCJnbG9iYWwiLCJPcmJpdCIsImFzc2VydCIsImRlcHJlY2F0ZSIsInV1aWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFBcUM7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBLE1BQU1BLE9BQU8sR0FBRyxPQUFPQyxJQUFQLElBQWUsUUFBZixJQUEyQkEsSUFBSSxDQUFDQSxJQUFMLEtBQWNBLElBQXpDLElBQWlEQSxJQUFqRCxJQUF5RCxPQUFPQyxNQUFQLElBQWlCLFFBQWpCLElBQTZCQSxNQUF0RixJQUFnRyxFQUFoSDtBQUNBLE1BQU1DLEtBQUssR0FBRztBQUNaSCxFQUFBQSxPQURZO0FBRVpJLEVBQUFBLE1BQU0sRUFBTkEsY0FGWTtBQUdaQyxFQUFBQSxTQUFTLEVBQVRBLG9CQUhZO0FBSVpDLEVBQUFBLElBQUksRUFBSkE7QUFKWSxDQUFkO2VBTWVILEsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhc3NlcnQgfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQgeyBkZXByZWNhdGUgfSBmcm9tICcuL2RlcHJlY2F0ZSc7XG5pbXBvcnQgeyB1dWlkIH0gZnJvbSAnQG9yYml0L3V0aWxzJzsgLy8gRXN0YWJsaXNoIHRoZSByb290IG9iamVjdCwgYHdpbmRvd2AgKGBzZWxmYCkgaW4gdGhlIGJyb3dzZXIsIGBnbG9iYWxgXG4vLyBvbiB0aGUgc2VydmVyLCBvciBgdGhpc2AgaW4gc29tZSB2aXJ0dWFsIG1hY2hpbmVzLiBXZSB1c2UgYHNlbGZgXG4vLyBpbnN0ZWFkIG9mIGB3aW5kb3dgIGZvciBgV2ViV29ya2VyYCBzdXBwb3J0LlxuLy9cbi8vIFNvdXJjZTogaHR0cHM6Ly9naXRodWIuY29tL2phc2hrZW5hcy91bmRlcnNjb3JlL2Jsb2IvbWFzdGVyL3VuZGVyc2NvcmUuanMjTDExLUwxN1xuLy8gICAgIFVuZGVyc2NvcmUuanMgMS44LjNcbi8vICAgICBodHRwOi8vdW5kZXJzY29yZWpzLm9yZ1xuLy8gICAgIChjKSAyMDA5LTIwMTcgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbi8vICAgICBVbmRlcnNjb3JlIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG5jb25zdCBnbG9iYWxzID0gdHlwZW9mIHNlbGYgPT0gJ29iamVjdCcgJiYgc2VsZi5zZWxmID09PSBzZWxmICYmIHNlbGYgfHwgdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgfHwge307XG5jb25zdCBPcmJpdCA9IHtcbiAgZ2xvYmFscyxcbiAgYXNzZXJ0LFxuICBkZXByZWNhdGUsXG4gIHV1aWRcbn07XG5leHBvcnQgZGVmYXVsdCBPcmJpdDsiXX0=