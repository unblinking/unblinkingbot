#!/usr/bin/env node

/**
 * Database related functions for the unblinking bot.
 * @namespace databases
 * @public
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * Invoke strict mode for the entire script.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode Strict mode}
 */
"use strict";

/**
 * @public
 * @namespace database
 * @memberof databases
 */
const unblinkingdb = {

  trimObjKeys: function (bundle, callback) {
    bundle.db.get(bundle.objectPath, function (err, obj) {
      if (err) {
        console.log(`ERROR: ${err}`);
      } else {
        var keys = Object.keys(obj);
        var keyCount = Object.keys(obj).length;
        var extraCount = keyCount - 5;
        if (keyCount > 5) {
          // Sort the keys array in ascending order,
          // smallest (oldest) at the top
          keys.sort(function compareNumbers(a, b) {
            return a - b;
          });
          // Cut off the array after the extra keys, leaving only
          // the keys that we want to remove from the data store.
          keys.length = extraCount;
          // Remove the extra keys.
          keys.some(
            function (key) {
              //console.log(key);
              // Clone the objectPath array to a temp keyPath array.
              var keyPath = bundle.objectPath.slice();
              //console.log(keyPath);
              keyPath.push(key);
              //console.log(keyPath);
              bundle.db.del(keyPath, function (err) {
                if (err) {
                  console.log(`ERROR: ${err}`);
                } else {
                  //callback();
                }
              });
            }
          );
        }
      }
    });
  }

};

module.exports = unblinkingdb;