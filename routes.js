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
const bluebird = require('bluebird');

/**
 * Promisify the unblinkingdb.js callback functions.
 */
const addTokenToBundle = bluebird.promisify(require("./unblinkingslack.js").addTokenToBundle);
const addNotifyToBundle = bluebird.promisify(require("./unblinkingslack.js").addNotifyToBundle);
const addNotifyTypeToBundle = bluebird.promisify(require("./unblinkingslack.js").addNotifyTypeToBundle);

/**
 * @public
 * @namespace router
 * @memberof routes
 * @param {object} app - The Express application instance.
 * @see {@link https://expressjs.com/en/guide/routing.html Express routing}
 * @see {@link http://expressjs.com/en/api.html Express API}
 */
const router = function (app, bundle) {

  app.get('/', function (req, res) {
    let params = {};
    params.title = 'Dashboard';
    if (bundle.rtm !== null && bundle.rtm.connected) {
      params.rtmConnected = true;
    }
    res.render('index', params);
  });

  app.get('/settings', function (req, res) {
    let params = {};
    params.title = 'Settings';
    if (bundle.rtm !== null && bundle.rtm.connected === true) {
      params.rtmConnected = true;
    } else {
      params.rtmConnected = false;
    }
    addTokenToBundle(bundle)
      .then(addNotifyToBundle)
      .then(addNotifyTypeToBundle)
      .then(function (data) {
        params.token = data.token;
        params.notify = data.notify;
        params.notifyType = data.notifyType;
        res.render('settings', params);
      })
      .catch(function (err) {
        res.status(500).send(err.message);
      });
  });

  app.get('/datastore', function (req, res) {
    let params = {};
    params.title = "Data Store";
    res.render('datastore', params);
  });

};

/**
 * Assign our appRouter object to module.exports.
 * @see {@link https://nodejs.org/api/modules.html#modules_the_module_object Nodejs modules: The module object}
 * @see {@link https://nodejs.org/api/modules.html#modules_module_exports Nodejs modules: module exports}
 */
module.exports = router;