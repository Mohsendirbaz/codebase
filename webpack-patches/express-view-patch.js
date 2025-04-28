/**
 * Patched version of express/lib/view.js that doesn't use dynamic requires
 * This eliminates the webpack warning: "Critical dependency: the request of a dependency is an expression"
 */

'use strict';

/**
 * Module dependencies.
 */
const path = require('path');
const fs = require('fs');
// Add debug module with a no-op function if not available
const debug = require('debug') ? require('debug')('express:view') : function() {};

/**
 * Initialize a new `View` with the given `name`.
 *
 * Options:
 *
 *   - `defaultEngine` the default template engine name
 *   - `engines` template engine require() cache
 *   - `root` root directory for view lookup
 *
 * @param {string} name
 * @param {object} options
 * @public
 */
function View(name, options) {
  this.name = name;
  this.root = options.root;
  this.defaultEngine = options.defaultEngine;
  this.ext = path.extname(name);

  // Get engine safely without dynamic requires
  if (this.ext && options.engines[this.ext]) {
    this.engine = options.engines[this.ext];
  } else if (this.defaultEngine && options.engines[this.defaultEngine]) {
    this.engine = options.engines[this.defaultEngine];
  } else {
    this.engine = null;
  }

  this.path = this.lookup(name);
}

/**
 * Lookup view by the given `name`
 *
 * @param {string} name
 * @private
 */
View.prototype.lookup = function lookup(name) {
  let path;
  const roots = [].concat(this.root);

  debug('lookup "%s"', name);

  for (let i = 0; i < roots.length && !path; i++) {
    const root = roots[i];
    // Simplified path resolution without dynamic requires
    path = this.resolve(root, name);
  }

  return path;
};

/**
 * Resolve the file within the given directory.
 *
 * @param {string} dir
 * @param {string} file
 * @private
 */
View.prototype.resolve = function resolve(dir, file) {
  // Simplified path resolution without dynamic requires
  const ext = this.ext;

  // <path>.<ext>
  let filePath = path.join(dir, file);
  let stat = this.tryStat(filePath);

  if (stat && stat.isFile()) {
    return filePath;
  }

  // <path>/index.<ext>
  const basename = path.basename(file, ext);
  filePath = path.join(dir, basename, 'index' + ext);
  stat = this.tryStat(filePath);

  if (stat && stat.isFile()) {
    return filePath;
  }

  // If no extension was provided, try adding the extension
  if (!ext && this.defaultEngine) {
    const defaultExt = this.defaultEngine[0] !== '.' 
      ? '.' + this.defaultEngine 
      : this.defaultEngine;

    // <path>.<defaultExt>
    filePath = path.join(dir, file + defaultExt);
    stat = this.tryStat(filePath);

    if (stat && stat.isFile()) {
      return filePath;
    }

    // <path>/index.<defaultExt>
    filePath = path.join(dir, basename, 'index' + defaultExt);
    stat = this.tryStat(filePath);

    if (stat && stat.isFile()) {
      return filePath;
    }
  }

  return null;
};

/**
 * Try to stat the file.
 *
 * @param {string} path
 * @return {fs.Stats}
 * @private
 */
View.prototype.tryStat = function tryStat(path) {
  debug('stat "%s"', path);
  try {
    return fs.statSync(path);
  } catch (e) {
    return false;
  }
};

/**
 * Render with the given options.
 *
 * @param {object} options
 * @param {function} callback
 * @private
 */
View.prototype.render = function render(options, callback) {
  debug('render "%s"', this.path);
  // Simplified render function without dynamic requires
  if (!this.engine) {
    callback(new Error('No rendering engine available'));
    return;
  }

  if (typeof this.engine.renderFile === 'function') {
    this.engine.renderFile(this.path, options, callback);
  } else if (typeof this.engine === 'function') {
    // Handle case where engine is a function
    try {
      const rendered = this.engine(this.path, options);
      callback(null, rendered);
    } catch (err) {
      callback(err);
    }
  } else {
    callback(new Error('Unsupported rendering engine'));
  }
};

// Export using CommonJS syntax only to avoid dual module issues
module.exports = View;
