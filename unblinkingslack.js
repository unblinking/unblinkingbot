#!/usr/bin/env node

/**
 * The unblinking bot.
 * @namespace unblinkingslack
 * @public
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * Invoke strict mode for the entire script.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode Strict mode}
 */
"use strict";

/**
 * Require the 3rd party modules that will be used.
 * @see {@link https://github.com/slackhq/node-slack-sdk node-slack-sdk}
 */
const slackClient = require("@slack/client");

// TODO: Get rid of this, maybe move to a utility
var unblinking_db = require('./unblinkingdb.js');

const slacking = {

  getRtmInstance: function (bundle, callback) {
    let err = null;
    let rtmExists = bundle.rtm !== undefined && Object.keys(bundle.rtm).length !== 0;
    try {
      // If RTM instance doesn't exist yet, instantiate a new RTM client object.
      if (!rtmExists) {
        bundle.rtm = new slackClient.RtmClient(bundle.token, {
          // logLevel: 'verbose',
          dataStore: new slackClient.MemoryDataStore()
        });
      } else {
        // RTM instance already exists, don't go making duplicates.
      }
    } catch (e) {
      err = e;
    } finally {
      if (typeof callback === "function") {
        callback(err, bundle);
      }
    }
  },

  startRtmInstance: function (bundle, callback) {
    let err = null;
    let rtmStartExists = bundle.rtm !== undefined && bundle.rtm.start !== undefined;
    try {
      if (rtmStartExists) {
        bundle.rtm.start();
      } else {
        err = new Error("No RTM instance exists to start.");
      }
    } catch (e) {
      err = e;
    } finally {
      if (typeof callback === "function") {
        callback(err, bundle);
      }
    }
  },

  disconnectRtmInstance: function (bundle, callback) {
    let err = null;
    let rtmExists = bundle.rtm !== undefined && bundle.rtm.connected === true;
    try {
      if (rtmExists) {
        bundle.rtm.autoReconnect = false;
        //bundle.rtm.handleWsClose('1', 'User request');
        bundle.rtm.disconnect('User request', '1');
      } else {
        // Nothing to be disconnected. Emit socket.io response immediately.
        // TODO: Handle this better.
        console.log(`RTM already disconnected`);
        setTimeout(function () {
          bundle.socket.emit('slackStopRes');
        }, 3000);
      }
    } catch (e) {
      err = e;
    } finally {
      if (typeof callback === "function") {
        callback(err, bundle);
      }
    }
  },

  logSlacktivity: function (bundle, callback) {
    let err = null;
    try {
      bundle.dbp.put("slack::activity::" + new Date().getTime(), bundle.slacktivity);
      unblinking_db.trimObjKeys(bundle);
    } catch (e) {
      err = e;
    } finally {
      if (typeof callback === "function") {
        callback(err, bundle);
      }
    }
  },

  sendMessage: function (bundle, callback) {
    let err = null;
    let rtmExists = bundle.rtm !== undefined && Object.keys(bundle.rtm).length !== 0;
    let text;
    let id;
    if (bundle.sending !== undefined) text = bundle.sending.text;
    if (bundle.sending !== undefined) id = bundle.sending.id;
    try {
      if (rtmExists && text !== undefined && id !== undefined) {
        bundle.rtm.sendMessage(text, id);
      } else {
        // No RTM instance exists to send a message
      }
    } catch (e) {
      err = e;
    } finally {
      if (typeof callback === "function") {
        callback(err, bundle);
      }
    }
  },

  listenForEvents: function (bundle, callback) {
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
      // console.log(`RTM Client authenticated. Rtm.start payload captured.`);
    });
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
      // var user = bundle.rtm.dataStore.getUserById(bundle.rtm.activeUserId);
      // var team = bundle.rtm.dataStore.getTeamById(bundle.rtm.activeTeamId);
      // console.log(`RTM connection opened. RTM hello event received.`);
      // console.log(`Slack RTM Client connected to ${team.name} as user ${user.name}.`);
      bundle.socket.emit('slackRestartRes');
    });
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.DISCONNECT, function (message) {
      console.log(`RTM Disconnect: ${message}`);
      bundle.socket.emit('slackStopRes');
    });
    bundle.rtm.on(slackClient.RTM_EVENTS.MESSAGE, function (message) {
      // Log the activity
      bundle.slacktivity = message;
      slacking.logSlacktivity(bundle);
      // Add the message to the bundle
      bundle.event = message;
      // See whats in the message text, if there is any
      if (bundle.event.text) {
        // If the unblinkingbot name or user ID is mentioned ...
        var re = new RegExp(bundle.rtm.activeUserId, 'g');
        if (bundle.event.text.match(/unblinkingbot/gi) || bundle.event.text.match(re)) {
          // Reply to the message
          bundle.sending = {};
          bundle.sending.user = bundle.rtm.dataStore.getUserById(bundle.event.user);
          bundle.sending.text = `That's my name ${bundle.sending.user.name}, don't wear it out!`;
          bundle.sending.id = bundle.event.channel;
          slacking.sendMessage(bundle);
        }
      }
    });
    bundle.rtm.on(slackClient.RTM_EVENTS.GOODBYE, function (message) {
      // Log the activity
      bundle.slacktivity = message;
      slacking.logSlacktivity(bundle);
    });
    bundle.rtm.on(slackClient.RTM_EVENTS.REACTION_ADDED, function (reaction) {
      bundle.slacktivity = reaction;
    });
    callback(null, bundle);
  }

};

module.exports = slacking;