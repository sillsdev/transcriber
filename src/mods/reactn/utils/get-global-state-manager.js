Object.defineProperty(exports, '__esModule', { value: true });
var context_1 = require('../context');
var default_global_state_manager_1 = require('../default-global-state-manager');
function getGlobalStateManager() {
  return (
    (context_1.default &&
      (context_1.default._currentValue2 || context_1.default._currentValue)) ||
    default_global_state_manager_1.default
  );
}
exports.default = getGlobalStateManager;
