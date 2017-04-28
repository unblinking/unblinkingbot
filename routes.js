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
 * @see {@link https://github.com/rburns/ansi-to-html ansi-to-html}
 * @see {@link https://github.com/petkaantonov/bluebird bluebird}
 * @see {@link https://github.com/AriaMinaei/pretty-error pretty-error}
 */
const ansi_to_html = require('ansi-to-html');
const bluebird = require("bluebird");
const pretty_error = require('pretty-error');

const ansiConvert = new ansi_to_html({
  newline: true
});
const prettyError = new pretty_error()
  .skipNodeFiles();

/**
 * @namespace router
 * @memberof routes
 * @param {object} app - The Express application instance.
 * @see {@link https://expressjs.com/en/guide/routing.html Express routing}
 * @see {@link http://expressjs.com/en/api.html Express API}
 */
const router = function (app, bundle) {

  app.get("/", function (req, res) {
    res.render("index");
  });

  app.get("/settings", function (req, res) {
    res.render("settings");
  });

  app.get("/datastore", function (req, res) {
    res.render("datastore");
  });

};

/**
 * Assign our appRouter object to module.exports.
 * @see {@link https://nodejs.org/api/modules.html#modules_the_module_object Nodejs modules: The module object}
 * @see {@link https://nodejs.org/api/modules.html#modules_module_exports Nodejs modules: module exports}
 */
module.exports = router;