#!/usr/bin/env node

'use strict'

/**
 * The node-slack-sdk wrapper functions for the unblinkingBot.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

/**
 * 3rd party modules that will be used.
 * @see {@link https://github.com/slackhq/node-slack-sdk node-slack-sdk}
 * @see {@link https://github.com/request/request request}
 */
const slackClient = require('@slack/client')
const request = require('request')

/**
 * Local functions that will be used.
 */
const messages = require('./messages')

/**
 * Instantiate a new Slack RTM Client
 * @param {Object} bundle The main bundle of shared references from app.js.
 */
function getNewClients (bundle) {
  return new Promise(resolve => {
    bundle.rtm = new slackClient.RtmClient(bundle.token, {
      // logLevel: 'verbose',
      dataStore: new slackClient.MemoryDataStore()
    })
    bundle.web = new slackClient.WebClient(bundle.token)
    resolve(bundle)
  })
}

/**
 * Start the Slack RTM Client.
 * @param {Object} bundle The main bundle of shared references from app.js.
 */
function startRtm (bundle) {
  return new Promise(resolve => {
    if ((bundle.rtm !== undefined && bundle.rtm.start !== undefined) &&
      !(bundle.rtm !== undefined && bundle.rtm.connected === true)) {
      bundle.rtm.start()
    }
    resolve(bundle)
  })
}

/**
 * Disconnect the Slack RTM Client.
 * @param {Object} bundle The main bundle of shared references from app.js.
 */
function disconnectRtm (bundle) {
  return new Promise(resolve => {
    if (bundle.rtm !== undefined && bundle.rtm.connected === true) {
      bundle.rtm.autoReconnect = false
      bundle.rtm.disconnect('User request', '1')
    } else {
      let message = 'The Slack RTM Client was already disconnected.'
      bundle.io.emit('slackDisconnection', message)
    }
    resolve()
  })
}

/**
 * Listen for Slack RTM Client events.
 * @param {Object} bundle The main bundle of shared references from app.js.
 */
function listen (bundle) {
  return new Promise(resolve => {
    bundle.rtm.on(
      slackClient.CLIENT_EVENTS.RTM.AUTHENTICATED,
      rtmStartData => console.log(`RTM Client authenticated.`))

    bundle.rtm.on(
      slackClient.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED,
      () => {
        var user = bundle.rtm.dataStore.getUserById(bundle.rtm.activeUserId)
        var team = bundle.rtm.dataStore.getTeamById(bundle.rtm.activeTeamId)
        let message = `Slack RTM Client connected to team ${team.name} as user ${user.name}.`
        bundle.io.emit('slackConnectionOpened', message)
      })

    bundle.rtm.on(
      slackClient.CLIENT_EVENTS.RTM.DISCONNECT,
      message => bundle.io.emit('slackDisconnection', message))

    bundle.rtm.on(
      slackClient.RTM_EVENTS.MESSAGE,
      message => messages.inbox(bundle, message))

    bundle.rtm.on(
      slackClient.RTM_EVENTS.GOODBYE,
      message => console.log(`RTM Client said goodbye.`))

    bundle.rtm.on(
      slackClient.RTM_EVENTS.REACTION_ADDED,
      reaction => console.log(`RTM Client reaction added event.`))

    resolve()
  })
}

/**
 * Start the Slack integration.
 * @param {Object} bundle The main bundle of shared references from app.js.
 */
async function create (bundle) {
  await disconnectRtm(bundle)
  bundle.token = await bundle.db.get('slack::settings::token')
  await getNewClients(bundle)
  await startRtm(bundle)
  await listen(bundle)
}
exports.create = create
