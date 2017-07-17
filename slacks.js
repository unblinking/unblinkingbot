#!/usr/bin/env node

/**
 * The node-slack-sdk wrapper functions for the unblinkingBot.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @copyright 2015-2017 {@link https://github.com/nothingworksright nothingworksright}
 * @license MIT License
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

/**
 * Require the 3rd party modules that will be used.
 * @see {@link https://github.com/slackhq/node-slack-sdk node-slack-sdk}
 * @see {@link https://github.com/request/request request}
 */
const slackClient = require('@slack/client')
const request = require('request')

/**
 * Require the local modules that will be used.
 */
const getValuesByKeyPrefix = require('./datastore.js').getValuesByKeyPrefix
const messages = require('./messages.js')

/**
 *
 */
const slacks = {

  /**
   * Instantiate a new Slack RTM Client
   * @param {Object} bundle Shared references.
   */
  getNewRtmWebInstances: bundle => {
    return new Promise(resolve => {
      bundle.rtm = new slackClient.RtmClient(bundle.token, {
        logLevel: 'verbose',
        dataStore: new slackClient.MemoryDataStore()
      })
      bundle.web = new slackClient.WebClient(bundle.token)
      resolve(bundle)
    })
  },

  /**
   *
   * @param {Object} bundle Shared references.
   */
  startRtmInstance: bundle => {
    return new Promise(resolve => {
      if ((bundle.rtm !== undefined && bundle.rtm.start !== undefined) &&
        !(bundle.rtm !== undefined && bundle.rtm.connected === true)) { bundle.rtm.start() }
      resolve(bundle)
    })
  },

  /**
   *
   * @param {Object} bundle Shared references.
   */
  disconnectRtm: bundle => {
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
  },

  /**
   *
   * @param {Object} bundle Shared references.
   */
  listenForEvents: bundle => {
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
  },

  /**
   * Try to start the Slack clients.
   */
  startSlack: bundle => {
    slacks.disconnectRtm(bundle)
      .then(() => {
        return bundle.db.get('slack::settings::token')
      })
      .then((token) => {
        bundle.token = token
        return bundle
      })
      .then(slacks.getNewRtmWebInstances)
      .then(slacks.startRtmInstance)
      .then(slacks.listenForEvents)
      .catch(err => console.log(err.message))
  }

}

module.exports = slacks
