#!/usr/bin/env node

'use strict'

/**
 * Routes for the unblinkingBot web front-end.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

/**
 * @param {Object} app The Express application instance.
 * @see {@link https://expressjs.com/en/guide/routing.html Express routing}
 */
const routes = app => {
  app.get('/', (req, res) => res.render('index'))
  app.get('/settings', (req, res) => res.render('settings'))
  app.get('/datastore', (req, res) => res.render('datastore'))
}
module.exports = routes
