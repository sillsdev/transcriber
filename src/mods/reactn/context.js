Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = require('react');
var default_global_state_manager_1 = require('./default-global-state-manager');
var getContext = function () {
  if (typeof react_1.createContext === 'function') {
    return react_1.createContext(default_global_state_manager_1.default);
  }
  return null;
};
exports.default = getContext();
