#!/usr/bin/env node

/**
 * The node-slack-sdk wrapper functions for the unblinkingbot.
 * @namespace slacks.js
 * @public
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * Require the 3rd party modules that will be used.
 * @see {@link https://github.com/moment/moment/ moment}
 * @see {@link https://github.com/petkaantonov/bluebird bluebird}
 * @see {@link https://github.com/slackhq/node-slack-sdk node-slack-sdk}
 */

const moment = require("moment");
const P = require("bluebird");
const slackClient = require("@slack/client");

/**
 * Require the local modules/functions that will be used.
 */
const trimByKeyPrefix = require("./datastore.js").trimByKeyPrefix;

/**
 * 
 */
const slacks = {

  /**
   * Instantiate a new Slack RTM Client
   * @param {*} bundle References to the db, rtm, and io.
   */
  getNewRtmInstance: bundle => {
    return new P(resolve => {
      bundle.rtm = new slackClient.RtmClient(bundle.token, {
        logLevel: "verbose",
        dataStore: new slackClient.MemoryDataStore()
      });
      bundle.web = new slackClient.WebClient(bundle.token);
      resolve(bundle);
    });
  },

  /**
   * 
   * @param {*} bundle
   */
  startRtmInstance: bundle => {
    return new P(resolve => {
      if ((bundle.rtm !== undefined && bundle.rtm.start !== undefined) &&
        !(bundle.rtm !== undefined && bundle.rtm.connected === true))
        bundle.rtm.start();
      resolve(bundle);
    });
  },

  /**
   * 
   * @param {*} bundle
   */
  disconnectRtmInstance: bundle => {
    return new P(resolve => {
      if (bundle.rtm !== undefined && bundle.rtm.connected === true) {
        bundle.rtm.autoReconnect = false;
        bundle.rtm.disconnect("User request", "1");
      } else {
        let message = "The Slack RTM Client was already disconnected.";
        bundle.io.emit("slackDisconnection", message);
      }
      resolve();
    });
  },

  /**
   * 
   * @param {*} bundle
   */
  logSlacktivity: bundle => {
    return new P(resolve => {
      let key = "slack::activity::" + new Date().getTime();
      bundle.db.put(key, bundle.slacktivity)
        .then(() => trimByKeyPrefix(bundle, "slack::activity"))
        .then(() => {
          if (bundle.slacktivity.type === "message") {
            let name = "unknown";
            Object.keys(bundle.rtm.dataStore.users).forEach(key => {
              if (bundle.rtm.dataStore.users[key].id === bundle.slacktivity.user)
                name = bundle.rtm.dataStore.users[key].name;
            });
            let time = moment(bundle.slacktivity.ts.split(".")[0]*1000).format("HH:mma");
            let dashActivity = `Message [${name} ${time}] ${bundle.slacktivity.text}`;
            bundle.io.emit("slacktivity", dashActivity);
          }
        })
        .then(() => resolve(bundle));
    });
  },

  /**
   * 
   * @param {*} bundle
   */
  sendMessage: bundle => {
    return new P(resolve => {
      if (
        (bundle.rtm !== undefined && Object.keys(bundle.rtm).length !== 0) &&
        (bundle.sending !== undefined) &&
        (bundle.sending.text !== undefined) &&
        (bundle.sending.id !== undefined)
      ) bundle.rtm.sendMessage(bundle.sending.text, bundle.sending.id);
      resolve();
    });
  },

  /**
   * 
   * @param {*} bundle
   */
  listenForEvents: bundle => {
    return new P(resolve => {

      bundle.rtm.on(
        slackClient.CLIENT_EVENTS.RTM.AUTHENTICATED,
        rtmStartData => console.log(`RTM Client authenticated.`));

      bundle.rtm.on(
        slackClient.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED,
        () => {
          var user = bundle.rtm.dataStore.getUserById(bundle.rtm.activeUserId);
          var team = bundle.rtm.dataStore.getTeamById(bundle.rtm.activeTeamId);
          let message = `Slack RTM Client connected to team ${team.name} as user ${user.name}.`;
          bundle.io.emit("slackConnectionOpened", message);
        });

      bundle.rtm.on(
        slackClient.CLIENT_EVENTS.RTM.DISCONNECT,
        message => bundle.io.emit("slackDisconnection", message));

      bundle.rtm.on(
        slackClient.RTM_EVENTS.MESSAGE,
        message => {
          bundle.slacktivity = message;
          slacks.logSlacktivity(bundle);
          bundle.event = message;
          if (
            bundle.event.text !== undefined &&
            bundle.event.text.match(/unblinkingbot/gi) ||
            bundle.event.text.match(new RegExp(bundle.rtm.activeUserId, "g"))
          ) {
            let slackUser = bundle.rtm.dataStore.getUserById(bundle.event.user).name;
            bundle.sending = {};
            bundle.sending.text = `That's my name ${slackUser}, don't wear it out!`;
            bundle.sending.id = bundle.event.channel;
            slacks.sendMessage(bundle);
          }
        });

      bundle.rtm.on(
        slackClient.RTM_EVENTS.GOODBYE,
        message => {
          bundle.slacktivity = message;
          slacks.logSlacktivity(bundle);
        });

      bundle.rtm.on(
        slackClient.RTM_EVENTS.REACTION_ADDED,
        reaction => {
          bundle.slacktivity = reaction;
          slacks.logSlacktivity(bundle);
        });

      resolve();
    });
  },

};

module.exports = slacks;