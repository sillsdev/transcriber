Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = _propTypes2.default.shape({
  query: _propTypes2.default.func.isRequired,
  on: _propTypes2.default.func.isRequired,
  cache: _propTypes2.default.object.isRequired,
  schema: _propTypes2.default.object.isRequired,
});
