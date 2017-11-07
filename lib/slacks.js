#!/usr/bin/env node

'use strict'

/**
 * The node-slack-sdk wrapper functions for the unblinkingBot.
 * @author {@link https://github.com/jmg1138 jmg1138}
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

// const datastores = require(`./datastores`)
const slackClient = require(`@slack/client`)
const messages = require(`./messages`)

/**
 * Instantiate new Slack RTM and Web Clients.
 */
function instance (slack, token) {
  slack.rtm = new slackClient.RtmClient(token, {
    // logLevel: `verbose`,
    dataStore: new slackClient.MemoryDataStore()
  })
  slack.web = new slackClient.WebClient(token)
}

/**
 * Start the Slack RTM Client.
 */
function start (slack) {
  return new Promise(resolve => {
    let result = {}
    if (
      // rtm.start is there to be called
      (slack.rtm !== undefined && slack.rtm.start !== undefined) &&
      // rtm isn't already connected
      !(slack.rtm !== undefined && slack.rtm.connected === true)
    ) {
      slack.rtm.start()
      result.done = true
      result.message = `Starting RTM.`
    } else {
      result.done = false
      if (slack.rtm === undefined) {
        result.message = `Slack messaging could not be connected.`
      } else if (slack.rtm.start === undefined) {
        result.message = `Slack messaging could not be connected.`
      } else if (slack.rtm.connected === true) {
        result.message = `Slack messaging already connected.`
      }
    }
    resolve(result)
  })
}

/**
 * Disconnect the Slack RTM Client.
 */
function disconnect (slack) {
  return new Promise(resolve => {
    let result = {}
    if (
      // rtm is already connected
      slack.rtm !== undefined && slack.rtm.connected === true
    ) {
      slack.rtm.autoReconnect = false
      slack.rtm.disconnect(`User request`, `1`)
      result.done = true
      result.message = `Disconnecting RTM.`
    } else {
      result.done = false
      if (slack.rtm === undefined) {
        result.message = `Slack messaging already disconnected.`
      } else if (slack.rtm.connected !== true) {
        result.message = `Slack messaging already disconnected.`
      }
    }
    resolve(result)
  })
}

/**
 * Listen for Slack RTM Client events.
 */
function listen (db, io, slack) {
  return new Promise(resolve => {
    slack.rtm.on(
      slackClient.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED,
      () => {
        var user = slack.rtm.dataStore.getUserById(slack.rtm.activeUserId)
        var team = slack.rtm.dataStore.getTeamById(slack.rtm.activeTeamId)
        let message = `Slack messaging connected to team ${team.name} as user ${user.name}.`
        io.emit(`slackConnectionOpened`, message)
      })
    slack.rtm.on(
      slackClient.CLIENT_EVENTS.RTM.DISCONNECT,
      message => io.emit(`slackDisconnection`, message))
    slack.rtm.on(
      slackClient.RTM_EVENTS.MESSAGE,
      message => messages.inbox(db, message, slack))
    slack.rtm.on(
      slackClient.RTM_EVENTS.GOODBYE,
      message => console.log(`Slack RTM API said goodbye.`))
    resolve()
  })
}

/**
 * Start (or force restart) the Slack Real-Time-Messaging.
 */
async function restart (slack, token) {
  try {
    let result = {}
    if (token === undefined || token === `` || token === null) {
      result.done = false
      result.message = `No token. Save a Slack bot-user token before trying again.`
      return result
    }
    await disconnect(slack)
    await instance(slack, token)
    let started = await start(slack)
    if (started.done === false) {
      result.done = false
      result.message = `Start failed: ${started.message}`
      return result
    }
    result.done = true
    result.message = `Started.`
    return result
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  disconnect: disconnect,
  listen: listen,
  restart: restart
}
