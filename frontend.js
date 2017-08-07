#!/usr/bin/env node

'use strict'

/**
 * Express.js front-end functions for the unblinkingBot.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

/**
 * 3rd party modules that will be used.
 * @see {@link https://github.com/rburns/ansi-to-html ansi-to-html}
 * @see {@link https://github.com/expressjs/express express}
 * @see {@link https://nodejs.org/api/http.html http}
 * @see {@link https://nodejs.org/api/path.html path}
 * @see {@link https://github.com/AriaMinaei/pretty-error pretty-error}
 */
const AnsiToHtml = require('ansi-to-html')
const express = require('express')
const http = require('http')
const path = require('path')
const PrettyError = require('pretty-error')

/**
 * Instantiate the express.js application.
 * @param {Object} bundle The main bundle of shared references from app.js.
 */
function expressInstance (bundle) {
  return new Promise(resolve => {
    bundle.express = express()
    resolve()
  })
}

/**
 * Configure the express.js application.
 * Define all express configurations here (except routes, define routes last).
 * @param {Object} bundle The main bundle of shared references from app.js.
 */
function expressConfigure (bundle) {
  return new Promise(resolve => {
    bundle.express.use(express.static(path.join(__dirname, '/public')))
    bundle.express.locals.pretty = true // Pretty html.
    bundle.express.set('views', './views')
    bundle.express.set('view engine', 'pug')
    resolve()
  })
}

/**
 * Define the express.js routes.
 * @param {Object} bundle The main bundle of shared references from app.js.
 * @see {@link https://expressjs.com/en/guide/routing.html Express routing}
 */
function expressRoutes (bundle) {
  return new Promise(resolve => {
    bundle.express.get('/', (req, res) => res.render('index'))
    bundle.express.get('/settings', (req, res) => res.render('settings'))
    bundle.express.get('/datastore', (req, res) => res.render('datastore'))
    resolve()
  })
}

/**
 * Define the express.js error handling middleware.
 * @param {Object} bundle The main bundle of shared references from app.js.
 */
function expressErrors (bundle) {
  return new Promise(resolve => {
    const convert = new AnsiToHtml({
      newline: true
    })
    const pretty = new PrettyError().skipNodeFiles()
    bundle.express.use(function (req, res, next) {
      res.status(404).render('404')
    })
    bundle.express.use(function (err, req, res, next) {
      if (err) {
        let params = {
          error: convert.toHtml(pretty.render(err))
        }
        res.render('error', params)
      }
    })
    resolve()
  })
}

/**
 * Instantiate the http server.
 * @param {Object} bundle The main bundle of shared references from app.js.
 */
function serverInstance (bundle) {
  return new Promise(resolve => {
    bundle.server = http.Server(bundle.express)
    resolve()
  })
}

/**
 * Listen for http server connections.
 * @param {Object} bundle The main bundle of shared references from app.js.
 * @see {@link https://expressjs.com/en/api.html#app.listen Express app.listen}
 * @see {@link https://github.com/socketio/socket.io socket.io}
 * "Starting with 3.0, express applications have become request handler
 * functions that you pass to http or http Server instances. You need to pass
 * the Server to socket.io, and not the express application function. Also make
 * sure to call .listen on the server, not the app."
 */
function serverListen (bundle) {
  return new Promise(resolve => {
    const port = parseInt(process.env.PORT, 10) || 1138
    bundle.server.listen(port, () => {
      console.log(`Server listening on port ${port}`)
      resolve()
    })
  })
}

/**
 * Create the web front-end parts in proper order.
 * @param {Object} bundle The main bundle of shared references from app.js.
 */
async function create (bundle) {
  await expressInstance(bundle)
  await expressConfigure(bundle)
  await expressRoutes(bundle)
  await expressErrors(bundle)
  await serverInstance(bundle)
  await serverListen(bundle)
}
exports.create = create
