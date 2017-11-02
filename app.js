#!/usr/bin/env node

'use strict'

/**
 * unblinkingBot - Surveillance system assistant
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const datastores = require(`./lib/datastores`)
const frontends = require(`./lib/frontends`)
const funs = require(`./lib/funs`)
const slacks = require(`./lib/slacks`)
const sockets = require(`./lib/sockets`)

/**
 * Starts the unblinkingBot application.
 * @see {@link https://github.com/socketio/socket.io socket.io}
 * "Starting with 3.0, express applications have become request handler
 * functions that you pass to http or http Server instances. You need to pass
 * the Server to socket.io, and not the express application function. Also make
 * sure to call .listen on the server, not the app."
 */
async function main () {
  try {
    let db = await datastores.instance()
    let express = await frontends.expressInstance()
    await frontends.expressConfigure(express)
    await frontends.expressRoutes(express)
    await frontends.expressErrors(express)
    let server = await frontends.serverInstance(express)
    await frontends.serverListen(server)
    let io = await sockets.instance(server)
    let slack = {}
    await sockets.listen(db, io, slack)
    await slacks.connect(db, io, slack)
    console.log(await funs.graffiti())
  } catch (err) {
    console.log(err)
  }
}

if (require.main === module) main()

module.exports = {
  main: main
}
