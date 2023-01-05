Object.defineProperty(exports, '__esModule', { value: true });
var set_global_1 = require('./set-global');
var get_global_state_manager_1 = require('./utils/get-global-state-manager');
function ReactNComponentWillUnmount(that) {
  get_global_state_manager_1
    .default()
    .removePropertyListener(that._globalCallback);
}
exports.ReactNComponentWillUnmount = ReactNComponentWillUnmount;
function ReactNComponentWillUpdate(that) {
  get_global_state_manager_1
    .default()
    .removePropertyListener(that._globalCallback);
}
exports.ReactNComponentWillUpdate = ReactNComponentWillUpdate;
function ReactNShouldComponentUpdate(that) {
  get_global_state_manager_1
    .default()
    .removePropertyListener(that._globalCallback);
}
exports.ReactNShouldComponentUpdate = ReactNShouldComponentUpdate;
function ReactNDispatch() {
  return get_global_state_manager_1.default().dispatchers;
}
exports.ReactNDispatch = ReactNDispatch;
function ReactNGlobalCallback(that) {
  that.updater.enqueueForceUpdate(that, null, 'forceUpdate');
}
exports.ReactNGlobalCallback = ReactNGlobalCallback;
function ReactNGlobal(that, globalStateManager) {
  if (globalStateManager === void 0) {
    globalStateManager = get_global_state_manager_1.default();
  }
  return globalStateManager.spyState(that._globalCallback);
}
exports.ReactNGlobal = ReactNGlobal;
function ReactNSetGlobal(newGlobalState, callback, _sync, globalStateManager) {
  if (globalStateManager === void 0) {
    globalStateManager = get_global_state_manager_1.default();
  }
  return set_global_1.default(globalStateManager, newGlobalState, callback);
}
exports.ReactNSetGlobal = ReactNSetGlobal;
