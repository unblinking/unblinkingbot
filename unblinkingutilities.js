#!/usr/bin/env node

/**
 * The unblinking bot.
 * @namespace unblinkingutilities
 * @public
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * Invoke strict mode for the entire script.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode Strict mode}
 */
"use strict";

const utilities = {

  validateStringOrUndefined: function (string, callback) {
    let err = null;
    if (typeof string === 'string' ||
      string instanceof String ||
      string === undefined) {
      err = null;
    } else {
      err = new Error(`Invalid string: ${string}`);
    }
    callback(err, string);
  }

};

module.exports = utilities;