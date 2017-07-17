#!/usr/bin/env node

'use strict'

/**
 * The unblinkingBot Node.js application.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

/**
 * Require the modules that will be used.
 * @see {@link https://github.com/expressjs/express express}
 * @see {@link https://nodejs.org/api/http.html http}
 * @see {@link https://github.com/socketio/socket.io socket.io}
 * @see {@link https://github.com/Level/level level}
 * @see {@link https://nodejs.org/api/path.html path}
 * @see {@link https://github.com/then/then-levelup then-levelup}
 */
const express = require('express')
const http = require('http')
const io = require('socket.io')
const level = require('levelup')
const path = require('path')
const thenLevel = require('then-levelup')

/**
 * Require the local functions that will be used.
 */
const errors = require('./errors.js')
const routes = require('./routes.js')
const sockets = require('./sockets.js')
const slacks = require('./slacks.js')

/**
 * Define all app configurations here, except routes (define routes last).
 */
const app = express()
app.use(express.static(path.join(__dirname, '/public')))
app.locals.pretty = true // Pretty html.
app.set('views', './views')
app.set('view engine', 'pug')

/**
 * Instantiate the http server and listen for connections.
 * @see {@link https://expressjs.com/en/api.html#app.listen Express app.listen}
 * @see {@link https://github.com/socketio/socket.io socket.io}
 * "Starting with 3.0, express applications have become request handler
 * functions that you pass to http or http Server instances. You need to pass
 * the Server to socket.io, and not the express application function. Also make
 * sure to call .listen on the server, not the app."
 */
const server = http.Server(app)
const port = parseInt(process.env.PORT, 10) || 1138
server.listen(port, () => console.log(`Server listening on port ${port}`))

/**
 * Create the main bundle object, which holds copies of references to be passed
 * to other functions. This allows separate functions to share the same
 * datastore, Socket.IO server, and Slack clients.
 */
var bundle = {}
bundle.db = thenLevel(level('db', {
  valueEncoding: 'json'
}))
bundle.io = io(server)
bundle.rtm = undefined // Placeholder for the Slack RTM Client object.
bundle.web = undefined // Placeholder for the Slack Web Client object.

/**
 * Define socket.io websocket events.
 */
sockets.events(bundle)

/**
 * Define route configurations after other app configurations.
 */
routes(app, bundle)

/**
 * Define error-handling middleware after app and route configurations.
 */
errors(app)

/**
 * Try to start the Slack clients.
 */
slacks.startSlack(bundle)

exports.app = app // For unit tests.
