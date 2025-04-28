/**
 * Patched version of @react-dnd/invariant that doesn't rely on the 'module' object
 */

function invariant(condition, format, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    if (!condition) {
      let error;
      if (format === undefined) {
        error = new Error(
          'Minified exception occurred; use the non-minified dev environment ' +
            'for the full error message and additional helpful warnings.'
        );
      } else {
        let argIndex = 0;
        error = new Error(
          format.replace(/%s/g, function() {
            return args[argIndex++];
          })
        );
        error.name = 'Invariant Violation';
      }

      error.framesToPop = 1; // we don't care about invariant's own frame
      throw error;
    }
  }
}

// Export using both CommonJS and ES modules syntax
if (typeof exports !== 'undefined') {
  exports.default = invariant;
  exports.__esModule = true;
  module.exports = exports.default;
}

export default invariant;