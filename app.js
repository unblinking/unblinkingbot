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
 * The main "bundle" object, which holds copies of references, to be passed to
 * other functions. I'm creating it here with undefined (placeholder) names that
 * will be assigned as the application starts up.
 */
var bundle = {
  "db": undefined, // LevelDB key/value datastore.
  "express": undefined, // Express.js web application framework.
  "server": undefined, // Http server for Express.js and Socket.IO to share.
  "io": undefined, // Socket.IO websockets for the web front-end application.
  "rtm": undefined, // Slack RTM API Client object (real-time messaging).
  "web": undefined // Slack Web API Client object.
}

/**
 * Starts the unblinkingBot application parts in proper order.
 * @param {Object} bundle The main bundle of shared references.
 */
async function startThisApp (bundle) {
  await datastore.create(bundle)
  await frontend.create(bundle)
  await sockets.create(bundle) // Uses bundle.server from frontend.create()
  await slacks.create(bundle)
}
startThisApp(bundle)
