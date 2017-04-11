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

  getFullDataStore: function (bundle, callback) {
    let err = null;
    let fullDataStore = {};
    bundle.dbp.createReadStream()
      .on("data", function (data) {
        fullDataStore[data.key] = data.value;
      })
      .on("error", function (e) {
        err = e;
      })
      .on("close", function () {})
      .on("end", function () {
        if (typeof callback === "function") {
          callback(err, fullDataStore);
        }
      });
  },

  trimObjKeys: function (bundle, callback) {
    let err = null;
    let allKeys = [];
    bundle.dbp.createReadStream({
        keys: true,
        values: false
      })
      .on('data', function (key) {
        if (key.startsWith("slack::activity")) {
          allKeys.push(key);
        }
      })
      .on("error", function (e) {
        err = e;
      })
      .on("close", function () {})
      .on("end", function () {
        allKeys.sort().reverse();
        Object.keys(allKeys).forEach(function (unique_key_name) {
          if (unique_key_name > 4) {
            bundle.dbp.del(allKeys[unique_key_name]);
          }
        });
        if (typeof callback === "function") {
          callback(err, bundle);
        }
      });
  }

};

module.exports = unblinkingdb;