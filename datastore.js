#!/usr/bin/env node

/**
 * Datastore module.
 * @module datastore
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * Invoke strict mode for the entire script.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode Strict mode}
 */
"use strict";

/**
 * Datastore related functions for the unblinkingbot application.
 * @constant datastore
 * @type {Object}
 */
const datastore = {

  /**
   * Obtain all key-value pairs.
   * 
   * @function getAllData
   * @param {Object} db Reference to the LevelDB data store
   * @param {Function} callback Called when the ReadStream ends.
   */
  getAllData: function (db, callback) {
    let err = null;
    let allData = {};

    db.createReadStream()
      .on("data", function (data) {
        allData[data.key] = data.value;
      })
      .on("error", function (e) {
        err = e;
      })
      .on("close", function () {})
      .on("end", function () {
        doCallback();
      });

    function doCallback() {
      if (typeof callback === "function") {
        /**
         * @function getAllData~callback
         * @param {Error} err An error, only if an error occurred.
         * @param {Object} allData Key-value pairs captured from the ReadStream data events.
         */
        callback(err, allData);
      }
    }
  },

  /**
   * Obtain all keys with a given prefix.
   * 
   * @function getKeysByPrefix
   * @param {Object} bundle References to the LevelDB data store, Slack RTM Client, and Socket.io server.
   * @param {Function} callback A callback function
   */
  getKeysByPrefix: function (bundle, callback) {
    let err = null;
    let keysWithPrefix = [];
    bundle.db.createReadStream({
        keys: true,
        values: false
      })
      .on('data', function (key) {
        if (key.startsWith(bundle.prefix)) {
          keysWithPrefix.push(key);
        }
      })
      .on("error", function (e) {
        err = e;
      })
      .on("close", function () {})
      .on("end", function () {
        doCallback();
      });

    function doCallback() {
      if (typeof callback === "function") {
        callback(err, keysWithPrefix);
      }
    }
  },

  

  /**
   * @param {Object} bundle References to the LevelDB data store, Slack RTM Client, and Socket.io server.
   * @param {Function} callback A callback function
   */
  trimByKeyPrefix: function (bundle, callback) {
    let err = null;
    let allKeys = [];
    bundle.db.createReadStream({
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
            bundle.db.del(allKeys[unique_key_name]);
          }
        });
        if (typeof callback === "function") {
          callback(err, bundle);
        }
      });
  }

};

module.exports = datastore;