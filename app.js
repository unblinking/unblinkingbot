#!/usr/bin/env node

/**
 * The unblinking bot.
 * @namespace unblinkingbot
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
 * @see {@link https://github.com/expressjs/express express}
 * @see {@link https://nodejs.org/api/http.html http}
 * @see {@link https://github.com/socketio/socket.io socket.io}
 * @see {@link https://github.com/Level/level level}
 * @see {@link https://nodejs.org/api/path.html path}
 * @see {@link https://github.com/AriaMinaei/pretty-error pretty-error}
 * @see {@link https://github.com/then/then-levelup then-levelup}
 */
const ansi_to_html = require('ansi-to-html');
const express = require("express");
const http = require("http");
const io = require("socket.io");
const level = require("levelup");
const path = require("path");
const pretty_error = require('pretty-error');
const thenLevel = require("then-levelup");

/**
 * Require the local modules that will be used.
 * @see {@link https://github.com/nothingworksright/unblinkingBot unblinkingbot}
 */
const routes = require("./routes.js"); // Endpoints for the local web interface
const sockets = require("./sockets.js");

/**
 * Define all app configurations here, except routes (define routes last).
 */
const app = express();
app.use(express.static(path.join(__dirname, "/public")));
app.set("views", "./views");
app.set("view engine", "pug");

/**
 * Instantiate the http server here.
 * @see {@link https://github.com/socketio/socket.io socket.io}
 * "Starting with 3.0, express applications have become request handler
 * functions that you pass to http or http Server instances. You need to pass
 * the Server to socket.io, and not the express application function. Also make
 * sure to call .listen on the server, not the app."
 */
const server = http.Server(app);

/**
 * Listen for connections on the specified port.
 * @see {@link https://expressjs.com/en/api.html#app.listen Express API app.listen}
 */
const port = parseInt(process.env.PORT, 10) || 1138;
server.listen(port, function () {
  console.log(`unblinkingbot web-server listening on port ${port}`);
});

/**
 * Create the main bundle object, copies of references that will be passed to
 * other functions. Holds references to the LevelDB data store, Slack RTM
 * Client, and Socket.io server.
 */
var bundle = {};
bundle.db = thenLevel(level("db", {
  valueEncoding: 'json'
}));
bundle.rtm = undefined;
bundle.io = io(server);
bundle.web = undefined;

/**
 * Define socket.io events.
 */
sockets.events(bundle);

/**
 * Define route configurations after other app configurations.
 */
routes(app, bundle);

/**
 * Using pretty-error along with ansi-to-html to display error messages to the
 * user in a nice format.
 */
const ansiConvert = new ansi_to_html({
  newline: true
});
const prettyError = new pretty_error()
  .skipNodeFiles();

/**
 * Define error-handling middleware after app and route configurations.
 */
app.use(function (req, res, next) {
  res.status(404).render("404");
});
app.use(function (err, req, res, next) {
  if (err) {
    let params = {
      error: ansiConvert.toHtml(prettyError.render(err))
    };
    res.render("error", params);
  }
});

/**
 * Assign our app object to module.exports.
 * @see {@link https://nodejs.org/api/modules.html#modules_the_module_object Nodejs modules: The module object}
 * @see {@link https://nodejs.org/api/modules.html#modules_module_exports Nodejs modules: module exports}
 */
exports.app = app;