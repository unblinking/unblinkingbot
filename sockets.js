#!/usr/bin/env node

/**
 * The unblinking bot.
 * @namespace sockets.js
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * Invoke strict mode for the entire script.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode Strict mode}
 */
"use strict";

/**
 * Require the 3rd party modules that will be used.
 * @see {@link https://github.com/rburns/ansi-to-html ansi-to-html}
 * @see {@link https://github.com/petkaantonov/bluebird bluebird}
 * @see {@link https://github.com/AriaMinaei/pretty-error pretty-error}
 */
const ansi_to_html = require('ansi-to-html');
const bluebird = require("bluebird");
const pretty_error = require('pretty-error');

/**
 * Configure the ansi-to-html and pretty-error modules.
 */
const ansiConvert = new ansi_to_html({
  newline: true
});
const prettyError = new pretty_error()
  .skipNodeFiles();

/**
 * Promisify some local module callback functions.
 */
const getAllData = bluebird.promisify(require("./datastore.js").getAllData);
const getNewRtmInstance = bluebird.promisify(require("./slacks.js").getNewRtmInstance);
const startRtmInstance = bluebird.promisify(require("./slacks.js").startRtmInstance);
const listenForRtmEvents = bluebird.promisify(require("./slacks.js").listenForEvents);
const disconnectRtm = bluebird.promisify(require("./slacks.js").disconnectRtmInstance);

/**
 * Module to be exported, containing the Socket.io events.
 */
const sockets = {

  /**
   * Socket.io event handlers.
   * @param {Object} bundle The main bundle, containing references to the
   * LevelDB data store, Slack RTM Client, and Socket.io server.
   */
  events: (bundle) => {

    /**
     * 
     */
    bundle.io.on("connection", (socket) => {

      //let handshake = JSON.stringify(socket.handshake, null, 2);
      //console.log(`Socket.io connection handshake: ${handshake}.`);

      /**
       * 
       */
      socket.on("disconnect", () => console.log("Socket.io disconnection."));

      /**
       * 
       */
      socket.on("readFullDbReq", () => {
        getAllData(bundle.db)
          .then((allData)=> socket.emit("readFullDbRes", allData))
          .catch((err) => socket.emit("readFullDbRes", err.message)); // TODO: Do a pretty error here
      });

      /**
       * Read available Slack channels
       */
      socket.on("readSlackChannelsReq", () => {
        let channelNames = [];
        let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
        try {
          if (rtmConnected) {
            let channels = bundle.rtm.dataStore.channels;
            Object.keys(channels).forEach((key) => {
              if (channels[key].is_member) { // Only if the bot is a member.
                channelNames.push(channels[key].name);
              }
            });
          }
        } catch (err) {
          console.log(err.message);
        } finally {
          socket.emit("readSlackChannelsRes", channelNames);
        }
      });

      /**
       * Read available Slack groups
       */
      socket.on("readSlackGroupsReq", () => {
        let groupNames = [];
        let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
        try {
          if (rtmConnected) {
            let groups = bundle.rtm.dataStore.groups;
            Object.keys(groups).forEach((key) =>
              groupNames.push(groups[key].name)
            );
          }
        } catch (err) {
          console.log(err.message);
        } finally {
          socket.emit("readSlackGroupsRes", groupNames);
        }
      });

      /**
       * Read available Slack users
       */
      socket.on("readSlackUsersReq", () => {
        let directMessageUserNames = [];
        let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
        try {
          if (rtmConnected) {
            let directMessageUserIds = [];
            let dms = bundle.rtm.dataStore.dms;
            let users = bundle.rtm.dataStore.users;
            Object.keys(dms).forEach((key) =>
              directMessageUserIds.push(dms[key].user)
            );
            directMessageUserIds.forEach((id) =>
              directMessageUserNames.push(users[id].name)
            );
          }
        } catch (err) {
          console.log(err.message);
        } finally {
          socket.emit("readSlackUsersRes", directMessageUserNames);
        }
      });

      /**
       * Save Slack token
       */
      socket.on("saveSlackTokenReq", (token) => {
        let success = true;
        let err = null;
        try {
          bundle.db.put("slack::settings::token", token);
        } catch (e) {
          success = false;
          err = ansiConvert.toHtml(prettyError.render(e));
        } finally {
          socket.emit(
            "saveSlackTokenRes",
            token,
            success,
            err
          );
        }
      });

      /**
       * Save Slack default-notify
       */
      socket.on("saveSlackNotifyReq", (notify, notifyType) => {
        let success = true;
        let err = null;
        let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
        let notifyId = null;
        try {
          if (rtmConnected && notifyType === "channel") {
            let channels = bundle.rtm.dataStore.channels;
            Object.keys(channels).forEach((key) => {
              if (channels[key].name === notify) {
                notifyId = key.toString();
              }
            });
          } else if (rtmConnected && notifyType === "group") {
            let groups = bundle.rtm.dataStore.groups;
            Object.keys(groups).forEach((key) => {
              if (groups[key].name === notify) {
                notifyId = key.toString();
              }
            });
          } else if (rtmConnected && notifyType === "user") {
            let users = bundle.rtm.dataStore.users;
            let dms = bundle.rtm.dataStore.dms;
            Object.keys(users).forEach((usersKey) => {
              if (users[usersKey].name === notify) {
                Object.keys(dms).forEach((dmsKey) => {
                  if (dms[dmsKey].user === users[usersKey].id) {
                    notifyId = dmsKey.toString();
                  }
                });
              }
            });
          }
          bundle.db.put("slack::settings::notify", notify);
          bundle.db.put("slack::settings::notifyId", notifyId);
          bundle.db.put("slack::settings::notifyType", notifyType);
        } catch (e) {
          success = false;
          err = ansiConvert.toHtml(prettyError.render(e));
        } finally {
          socket.emit(
            "saveSlackNotifyRes",
            notify,
            notifyType,
            success,
            err
          );
        }
      });

      /**
       * 
       */
      socket.on("slackConnectionStatusReq", () => {
        let connected = bundle.rtm !== undefined && bundle.rtm.connected === true;
        socket.emit("slackConnectionStatusRes", connected);
      });

      /**
       * Restart Slack integration
       */
      socket.on("slackRestartReq", () => {
        disconnectRtm(bundle)
          .then(() => {
            return bundle.db.get("slack::settings::token");
          })
          .then((token) => {
            bundle.token = token;
            return bundle;
          })
          .then(getNewRtmInstance)
          .then(startRtmInstance)
          .then(listenForRtmEvents)
          .catch((err) => console.log(err.message));
      });

      /**
       * Stop Slack integration
       */
      socket.on("slackStopReq", () => {
        disconnectRtm(bundle)
          .catch((err) => console.log(err.message));
      });

      /**
       * 
       */
      socket.on("slackNotifyReq", () => {
        try {
          let data = {};
          bundle.db.get("slack::settings::notify")
            .then((notify) => data.notify = notify)
            .then(() => {
              return bundle.db.get("slack::settings::notifyType");
            })
            .then((notifyType) => {
              data.notifyType = notifyType;
              socket.emit("slackNotifyRes", data);
            });
        } catch (err) {
          console.log(err.message);
        }
      });

      /**
       * 
       */
      socket.on("slackTokenReq", () => {
        try {
          bundle.db.get("slack::settings::token")
            .then((token) => socket.emit("slackTokenRes", token));
        } catch (err) {
          console.log(err.message);
        }
      });

      /**
       * Restart the unblinkingBot application
       */ 
      socket.on("restartReq", () => process.exit(1)); // TODO: Restart the systemd service correctly?

    });

  }

};

module.exports = sockets;