import { assert } from './assert';
import { deprecate } from './deprecate';
import { uuid } from '@orbit/utils'; // Establish the root object, `window` (`self`) in the browser, `global`
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
  uuid: uuid
};
export default Orbit;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiYXNzZXJ0IiwiZGVwcmVjYXRlIiwidXVpZCIsImdsb2JhbHMiLCJzZWxmIiwiZ2xvYmFsIiwiT3JiaXQiXSwibWFwcGluZ3MiOiJBQUFBLFNBQVNBLE1BQVQsUUFBdUIsVUFBdkI7QUFDQSxTQUFTQyxTQUFULFFBQTBCLGFBQTFCO0FBQ0EsU0FBU0MsSUFBVCxRQUFxQixjQUFyQixDLENBQXFDO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUMsT0FBTyxHQUFHLE9BQU9DLElBQVAsSUFBZSxRQUFmLElBQTJCQSxJQUFJLENBQUNBLElBQUwsS0FBY0EsSUFBekMsSUFBaURBLElBQWpELElBQXlELE9BQU9DLE1BQVAsSUFBaUIsUUFBakIsSUFBNkJBLE1BQXRGLElBQWdHLEVBQWhIO0FBQ0EsSUFBTUMsS0FBSyxHQUFHO0FBQ1pILEVBQUFBLE9BQU8sRUFBUEEsT0FEWTtBQUVaSCxFQUFBQSxNQUFNLEVBQU5BLE1BRlk7QUFHWkMsRUFBQUEsU0FBUyxFQUFUQSxTQUhZO0FBSVpDLEVBQUFBLElBQUksRUFBSkE7QUFKWSxDQUFkO0FBTUEsZUFBZUksS0FBZiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFzc2VydCB9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7IGRlcHJlY2F0ZSB9IGZyb20gJy4vZGVwcmVjYXRlJztcbmltcG9ydCB7IHV1aWQgfSBmcm9tICdAb3JiaXQvdXRpbHMnOyAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCAoYHNlbGZgKSBpbiB0aGUgYnJvd3NlciwgYGdsb2JhbGBcbi8vIG9uIHRoZSBzZXJ2ZXIsIG9yIGB0aGlzYCBpbiBzb21lIHZpcnR1YWwgbWFjaGluZXMuIFdlIHVzZSBgc2VsZmBcbi8vIGluc3RlYWQgb2YgYHdpbmRvd2AgZm9yIGBXZWJXb3JrZXJgIHN1cHBvcnQuXG4vL1xuLy8gU291cmNlOiBodHRwczovL2dpdGh1Yi5jb20vamFzaGtlbmFzL3VuZGVyc2NvcmUvYmxvYi9tYXN0ZXIvdW5kZXJzY29yZS5qcyNMMTEtTDE3XG4vLyAgICAgVW5kZXJzY29yZS5qcyAxLjguM1xuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxNyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbmNvbnN0IGdsb2JhbHMgPSB0eXBlb2Ygc2VsZiA9PSAnb2JqZWN0JyAmJiBzZWxmLnNlbGYgPT09IHNlbGYgJiYgc2VsZiB8fCB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbCB8fCB7fTtcbmNvbnN0IE9yYml0ID0ge1xuICBnbG9iYWxzLFxuICBhc3NlcnQsXG4gIGRlcHJlY2F0ZSxcbiAgdXVpZFxufTtcbmV4cG9ydCBkZWZhdWx0IE9yYml0OyJdfQ==