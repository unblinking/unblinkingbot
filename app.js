#!/usr/bin/env node

'use strict'

/**
 * The unblinkingBot Node.js application.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

/**
 * Require local modules.
 */
const datastore = require('./datastore')
const frontend = require('./frontend')
const slacks = require('./slacks')
const sockets = require('./sockets')

/**
 * The main bundle object, which holds copies of references to be passed to
 * other functions. Created as an object with undefined (placeholder) names.
 */
var bundle = {
  "db": undefined, // LevelDB datastore.
  "express": undefined, // Express.js web front-end.
  "io": undefined, // Socket.IO websockets.
  "rtm": undefined, // Slack RTM Client object.
  "server": undefined, // Http server.
  "web": undefined, // Slack Web Client object.
}

async function startThisApp (bundle) {
  await frontend.create(bundle)
  await datastore.create(bundle)
  await sockets.create(bundle) // Uses bundle.server from frontend.create
  await slacks.startSlack(bundle)
}

startThisApp(bundle)

exports.app = bundle.express // For unit tests.
