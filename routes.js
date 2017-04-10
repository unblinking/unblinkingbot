#!/usr/bin/env node

/**
 * The application end points (routes) for the unblinking bot.
 * @namespace routes
 * @public
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * Invoke strict mode for the entire script.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode Strict mode}
 */
"use strict";

/**
 * Require the 3rd party modules that will be used.
 * @see {@link https://github.com/petkaantonov/bluebird bluebird}
 */
const bluebird = require("bluebird");

/**
 * Promisify the unblinkingdb.js callback functions.
 */
//const addTokenToBundle = bluebird.promisify(require("./unblinkingslack.js").addTokenToBundle);
//const addNotifyToBundle = bluebird.promisify(require("./unblinkingslack.js").addNotifyToBundle);
//const addNotifyTypeToBundle = bluebird.promisify(require("./unblinkingslack.js").addNotifyTypeToBundle);

/**
 * @public
 * @namespace router
 * @memberof routes
 * @param {object} app - The Express application instance.
 * @see {@link https://expressjs.com/en/guide/routing.html Express routing}
 * @see {@link http://expressjs.com/en/api.html Express API}
 */
const router = function (app, bundle) {

  app.get("/", function (req, res) {
    let params = {
      title: "Dashboard",
      rtmConnected: bundle.rtm !== undefined && bundle.rtm.connected
    };
    res.render("index", params);
  });

  app.get("/settings", function (req, res) {
    let params = {
      title: "Settings",
      rtmConnected: bundle.rtm !== undefined && bundle.rtm.connected === true
    };
    bundle.dbp.get("slack::credentials::token")
      .then(function (token) {
        params.token = token;
      })
      .then(function () {
        return bundle.dbp.get("slack::credentials::notify");
      })
      .then(function (err, notify) {
        if (err) throw err;
        params.notify = notify;
      })
      .then(function () {
        return bundle.dbp.get("slack::credentials::notifyType");
      })
      .then(function (notifyType) {
        params.notifyType = notifyType;
      })
      .then(function () {
        res.render("settings", params);
      })
      .catch(function (err) {
        if (err.notFound) {
          // Common expected error, continue normally.
          console.log(err.message);
          res.render("settings", params);
        } else {
          res.status(500).send(err.message);
        }
      });
  });

  app.get("/datastore", function (req, res) {
    let params = {
      title: "Data Store",
      rtmConnected: bundle.rtm !== undefined && bundle.rtm.connected === true
    };
    res.render("datastore", params);
  });

};

/**
 * Assign our appRouter object to module.exports.
 * @see {@link https://nodejs.org/api/modules.html#modules_the_module_object Nodejs modules: The module object}
 * @see {@link https://nodejs.org/api/modules.html#modules_module_exports Nodejs modules: module exports}
 */
module.exports = router;