#!/usr/bin/env node

/**
 * The unblinking bot.
 * @namespace slacks.js
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

/**
 * 
 */
const slacking = {

  /**
   * 
   */
  getNewRtmInstance: function (bundle, callback) {
    let err = null;
    let rtmExists = bundle.rtm !== undefined && Object.keys(bundle.rtm).length !== 0;
    try {
      bundle.rtm = new slackClient.RtmClient(bundle.token, {
        // logLevel: "verbose",
        dataStore: new slackClient.MemoryDataStore()
      });
    } catch (e) {
      err = e;
    } finally {
      if (typeof callback === "function") {
        callback(err, bundle);
      }
    }
  },

  /**
   * 
   */
  startRtmInstance: function (bundle, callback) {
    let err = null;
    let rtmStartExists = bundle.rtm !== undefined && bundle.rtm.start !== undefined;
    let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
    try {
      if (rtmStartExists && !rtmConnected) {
        bundle.rtm.start();
      }
    } catch (e) {
      err = e;
    } finally {
      if (typeof callback === "function") {
        callback(err, bundle);
      }
    }
  },

  /**
   * 
   */
  disconnectRtmInstance: function (bundle, callback) {
    let err = null;
    let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
    try {
      if (rtmConnected) {
        bundle.rtm.autoReconnect = false;
        bundle.rtm.disconnect("User request", "1");
      } else {
        bundle.socket.emit("slackDisconnection", "Disconnect requested but the Slack RTM Client was already disconnected.");
      }
    } catch (e) {
      err = e;
    } finally {
      if (typeof callback === "function") {
        callback(err, bundle);
      }
    }
  },

  /**
   * 
   */
  logSlacktivity: function (bundle, callback) {
    let err = null;
    try {
      bundle.dbp.put("slack::activity::" + new Date().getTime(), bundle.slacktivity);
      // trim the number of saved activity
    } catch (e) {
      err = e;
    } finally {
      if (typeof callback === "function") {
        callback(err, bundle);
      }
    }
  },

  /**
   * 
   */
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
        err = new Error("Message not sent.");
      }
    } catch (e) {
      err = e;
    } finally {
      if (typeof callback === "function") {
        callback(err, bundle);
      }
    }
  },

  /**
   * 
   */
  listenForEvents: function (bundle, callback) {

    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
      // console.log(`RTM Client authenticated. Rtm.start payload captured.`);
    });

    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
      var user = bundle.rtm.dataStore.getUserById(bundle.rtm.activeUserId);
      var team = bundle.rtm.dataStore.getTeamById(bundle.rtm.activeTeamId);
      let message = `Slack RTM Client connected to ${team.name} as user ${user.name}.`;
      bundle.socket.emit("slackConnectionOpened", message);
    });

    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.DISCONNECT, function (message) {
      //console.log(`RTM Disconnect Event: ${message}`);
      bundle.socket.emit("slackDisconnection", message);
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
        var re = new RegExp(bundle.rtm.activeUserId, "g");
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
      console.log(`RTM Goodbye Event: ${message}`);
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