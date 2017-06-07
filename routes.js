#!/usr/bin/env node

/**
 * The application end points (routes) for the unblinkingBot web front-end.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @copyright 2015-2017 {@link https://github.com/nothingworksright nothingworksright}
 * @license MIT License
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

/**
 * @namespace router
 * @memberof routes
 * @param {object} app The Express application instance.
 * @param {*} bundle The main bundle object, holding references to the LevelDB
 * data store, Slack RTM Client, and Socket.io server.
 * @see {@link https://expressjs.com/en/guide/routing.html Express routing}
 */
const router = (app, bundle) => {
  app.get("/", (req, res) => res.render("index"));
  app.get("/settings", (req, res) => res.render("settings"));
  app.get("/datastore", (req, res) => res.render("datastore"));
};

/**
 * Assign our appRouter object to module.exports.
 * @see {@link https://nodejs.org/api/modules.html#modules_the_module_object Nodejs modules: The module object}
 * @see {@link https://nodejs.org/api/modules.html#modules_module_exports Nodejs modules: module exports}
 */
module.exports = router;
