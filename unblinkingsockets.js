#!/usr/bin/env node

/**
 * The unblinking bot.
 * @namespace unblinkingsockets
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
 * @see {@link https://github.com/petkaantonov/bluebird bluebird}
 */
const bluebird = require("bluebird");

/**
 * Promisify some local module callback functions.
 */
const getFullDataStore = bluebird.promisify(require("./unblinkingdb.js").getFullDataStore);
//const addTokenToBundle = bluebird.promisify(require("./unblinkingslack.js").addTokenToBundle);

const getRtmInstance = bluebird.promisify(require("./unblinkingslack.js").getRtmInstance);
const startRtmInstance = bluebird.promisify(require("./unblinkingslack.js").startRtmInstance);
const listenForRtmEvents = bluebird.promisify(require("./unblinkingslack.js").listenForEvents);
const disconnectRtm = bluebird.promisify(require("./unblinkingslack.js").disconnectRtmInstance);

const sockets = {

  events: function (bundle, callback) {

    bundle.socket.on("connection", function (socket) {
      // let handshake = JSON.stringify(socket.handshake, null, 2);
      // console.log(`Socket.io connection handshake: ${handshake}.`);

      socket.on("disconnect", function () {
        // console.log("Socket.io disconnection.");
      });

      socket.on("readFullDbReq", function () {
        getFullDataStore(bundle)
          .then(function (fullDataStore) {
            socket.emit("readFullDbRes", fullDataStore);
          })
          .catch(function (err) {
            socket.emit("readFullDbRes", err.message);
          });
      });

      // Read available Slack channels
      socket.on("readSlackChannelsReq", function () {
        let channelNames = [];
        let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
        try {
          if (rtmConnected) {
            let channels = bundle.rtm.dataStore.channels;
            Object.keys(channels).forEach(function (key) {
              // Only if the bot is a member.
              if (channels[key].is_member) {
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

      // Read available Slack groups
      socket.on("readSlackGroupsReq", function () {
        let groupNames = [];
        let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
        try {
          if (rtmConnected) {
            let groups = bundle.rtm.dataStore.groups;
            Object.keys(groups).forEach(function (key) {
              groupNames.push(groups[key].name);
            });
          }
        } catch (err) {
          console.log(err.message);
        } finally {
          socket.emit("readSlackGroupsRes", groupNames);
        }
      });

      // Read available Slack users
      socket.on("readSlackUsersReq", function () {
        let directMessageUserNames = [];
        let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
        try {
          if (rtmConnected) {
            let directMessageUserIds = [];
            let dms = bundle.rtm.dataStore.dms;
            let users = bundle.rtm.dataStore.users;
            Object.keys(dms).forEach(function (key) {
              directMessageUserIds.push(dms[key].user);
            });
            directMessageUserIds.forEach(function (id) {
              directMessageUserNames.push(users[id].name);
            });
          }
        } catch (err) {
          console.log(err.message);
        } finally {
          socket.emit("readSlackUsersRes", directMessageUserNames);
        }
      });

      // Save Slack token
      socket.on("saveSlackTokenReq", function (token) {
        let success = true;
        let err = null;
        try {
          bundle.dbp.put("slack::settings::token", token);
        } catch (e) {
          success = false;
          err = e;
          console.log(err.message);
        } finally {
          socket.emit("saveSlackTokenRes", {
            token: token,
            success: success,
            err: err
          });
        }
      });

      // Save Slack default-notify
      socket.on("saveSlackNotifyReq", function (defaults) {
        let success = true;
        let err = null;
        let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
        let notify = defaults.notify;
        let notifyId = null;
        let notifyType = defaults.type;
        try {
          if (rtmConnected && notifyType === "channel") {
            let channels = bundle.rtm.dataStore.channels;
            Object.keys(channels).forEach(function (key) {
              if (channels[key].name === notify) {
                notifyId = key.toString();
              }
            });
          } else if (rtmConnected && notifyType === "group") {
            let groups = bundle.rtm.dataStore.groups;
            Object.keys(groups).forEach(function (key) {
              if (groups[key].name === notify) {
                notifyId = key.toString();
              }
            });
          } else if (rtmConnected && notifyType === "user") {
            let users = bundle.rtm.dataStore.users;
            let dms = bundle.rtm.dataStore.dms;
            Object.keys(users).forEach(function (usersKey) {
              if (users[usersKey].name === notify) {
                Object.keys(dms).forEach(function (dmsKey) {
                  if (dms[dmsKey].user === users[usersKey].id) {
                    notifyId = dmsKey.toString();
                  }
                });
              }
            });
          }
          bundle.dbp.put("slack::settings::notify", notify);
          bundle.dbp.put("slack::settings::notifyId", notifyId);
          bundle.dbp.put("slack::settings::notifyType", notifyType);
        } catch (e) {
          success = false;
          err = e;
          console.log(err.message);
        } finally {
          socket.emit("saveSlackNotifyRes", {
            defaultNotifyType: notifyType,
            defaultNotify: notify,
            success: success,
            err: err
          });
        }
      });

      // Restart Slack integration
      socket.on("slackRestartReq", function () {
        // The disconnectRtm and startRtmInstance functions will do their own
        // socket.emit messages when they have completed.
        disconnectRtm(bundle)
          .then(function () {
            return bundle.dbp.get("slack::settings::token");
          })
          .then(function (token) {
            bundle.token = token;
            return bundle;
          })
          .then(getRtmInstance)
          .then(startRtmInstance)
          .then(listenForRtmEvents)
          .catch(function (err) {
            console.log(`Error: ${err.message}`);
          });
      });

      // Stop Slack integration
      socket.on("slackStopReq", function () {
        // The disconnectRtm function will do its own socket.emit message when
        // it has completed.
        disconnectRtm(bundle)
          .catch(function (err) {
            console.log(`Error: ${err.message}`);
          });
      });

      // Restart the unblinkingBot application
      socket.on("restartReq", function () {
        // TODO: Restart the systemd service correctly?
        process.exit(1);
      });

    }); // on connection

  } // events function

}; // const sockets

module.exports = sockets;