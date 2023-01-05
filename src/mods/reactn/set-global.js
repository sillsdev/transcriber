Object.defineProperty(exports, '__esModule', { value: true });
function _setGlobal(globalStateManager, newGlobalState, callback) {
  if (callback === void 0) {
    callback = null;
  }
  if (callback === null) {
    return globalStateManager.set(newGlobalState).then(function () {
      return globalStateManager.state;
    });
  }
  return globalStateManager
    .set(newGlobalState)
    .then(function (stateChange) {
      return _setGlobal(
        globalStateManager,
        callback(
          globalStateManager.state,
          globalStateManager.dispatcherMap,
          stateChange
        )
      );
    })
    .then(function () {
      return globalStateManager.state;
    });
}
exports.default = _setGlobal;
