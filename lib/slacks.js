#!/usr/bin/env node

'use strict'

/**
 * The node-slack-sdk wrapper functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

const slackClient = require('@slack/client')
const request = require('request')
const messages = require('./messages')

/**
 * Instantiate new Slack RTM and Web Clients.
 */
function getNewClients (slack, token) {
  return new Promise(resolve => {
    slack.rtm = new slackClient.RtmClient(token, {
      logLevel: 'verbose',
      dataStore: new slackClient.MemoryDataStore()
    })
    slack.web = new slackClient.WebClient(token)
    resolve()
  })
}

/**
 * Start the Slack RTM Client.
 */
function startRtm (slack) {
  return new Promise(resolve => {
    if ((slack.rtm !== undefined && slack.rtm.start !== undefined) &&
      !(slack.rtm !== undefined && slack.rtm.connected === true)) {
      slack.rtm.start()
    }
    resolve()
  })
}

/**
 * Disconnect the Slack RTM Client.
 */
function disconnectRtm (io, slack) {
  return new Promise(resolve => {
    if (slack.rtm !== undefined && slack.rtm.connected === true) {
      slack.rtm.autoReconnect = false
      slack.rtm.disconnect('User request', '1')
    } else {
      let message = 'The Slack RTM Client was already disconnected.'
      io.emit('slackDisconnection', message)
    }
    resolve()
  })
}

/**
 * Listen for Slack RTM Client events.
 */
function listen (db, io, slack) {
  return new Promise(resolve => {
    slack.rtm.on(
      slackClient.CLIENT_EVENTS.RTM.AUTHENTICATED,
      rtmStartData => console.log(`RTM Client authenticated.`))

    slack.rtm.on(
      slackClient.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED,
      () => {
        var user = slack.rtm.dataStore.getUserById(slack.rtm.activeUserId)
        var team = slack.rtm.dataStore.getTeamById(slack.rtm.activeTeamId)
        let message = `Slack RTM Client connected to team ${team.name} as user ${user.name}.`
        io.emit('slackConnectionOpened', message)
      })

    slack.rtm.on(
      slackClient.CLIENT_EVENTS.RTM.DISCONNECT,
      message => io.emit('slackDisconnection', message))

    slack.rtm.on(
      slackClient.RTM_EVENTS.MESSAGE,
      message => messages.inbox(db, message, slack)) /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    slack.rtm.on(
      slackClient.RTM_EVENTS.GOODBYE,
      message => console.log(`RTM Client said goodbye.`))

    slack.rtm.on(
      slackClient.RTM_EVENTS.REACTION_ADDED,
      reaction => console.log(`RTM Client reaction added event.`))

    resolve()
  })
}

/**
 * Start the Slack integration.
 */
async function create (db, io, slack) {
  try {
    console.log(`inside create now`)
    await disconnectRtm(io, slack)
    let token = await db.get('slack::settings::token')
    await getNewClients(slack, token)
    await startRtm(slack)
    await listen(db, io, slack)
    return
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  create: create,
  disconnectRtm: disconnectRtm
}
