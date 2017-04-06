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
const addTokenToBundle = bluebird.promisify(require("./unblinkingslack.js").addTokenToBundle);
const getChannelNamesArray = bluebird.promisify(require("./unblinkingslack.js").getChannelNamesArray);
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
          .then(function (data) {
            socket.emit("readFullDbRes", data);
          })
          .catch(function (err) {
            socket.emit("readFullDbRes", err.message);
          });
      });

      // Read available Slack channels
      socket.on("readSlackChannelsReq", function () {
        getChannelNamesArray(bundle)
          .then(function (data) {
            socket.emit("readSlackChannelsRes", data);
          })
          .catch(function (err) {
            socket.emit("readSlackChannelsRes", err.message);
          });
      });

      // Read available Slack groups
      socket.on("readSlackGroupsReq", function () {
        bundle.db.get("slack::groups", function (err, data) {
          if (err) return console.log(err);
          let names = [];
          Object.keys(data).forEach(function (key) {
            names.push(data[key].name);
          });
          socket.emit("readSlackGroupsRes", names);
        });
      });

      // Read available Slack users
      socket.on("readSlackUsersReq", function () {
        let ids = [];
        let names = [];
        bundle.db.get("slack::dms", function (err, dms) {
          if (err) return console.log(err);
          Object.keys(dms).forEach(function (key) {
            ids.push(dms[key].user);
          });
          bundle.db.get("slack::users", function (err, users) {
            if (err) return console.log(err);
            ids.forEach(function (id) {
              names.push(users[id].name);
            });
            socket.emit("readSlackUsersRes", names);
          });
        });
      });

      // Save Slack token
      socket.on("saveSlackTokenReq", function (token) {
        bundle.db.put("slack::credentials::token", token, function (err) {
          if (err) {
            bundle.success = false;
            bundle.err = err;
          } else {
            bundle.success = true;
          }
          socket.emit("saveSlackTokenRes", {
            token: token,
            success: bundle.success,
            err: bundle.err
          });
        });
      });

      // Save Slack default-notify
      socket.on("saveSlackNotifyReq", function (defaults) {
        let slackObjectName = null;
        if (defaults.type === "channel") {
          slackObjectName = "channels";
        }
        if (defaults.type === "group") {
          slackObjectName = "groups";
        }
        if (defaults.type === "user") {
          slackObjectName = "users";
        }

        function saveSlackNotifyAndEmitRes() {
          bundle.db.put([], {
            unblinkingSlack: {
              credentials: {
                defaultNotifyId: defaults.id,
                defaultNotifyType: defaults.type,
                defaultNotify: defaults.notify
              }
            }
          }, function (err) {
            if (err) {
              bundle.success = false;
              bundle.err = err;
            } else {
              bundle.success = true;
            }
            socket.emit("saveSlackNotifyRes", {
              defaultNotifyType: defaults.type,
              defaultNotify: defaults.notify,
              success: bundle.success,
              err: bundle.err
            });
          });
        }
        bundle.db.get(["unblinkingSlack", slackObjectName], function (err, obj) {
          if (err) {
            console.log(`ERROR: ${err}`);
          } else {
            Object.keys(obj).forEach(function (key) {
              if (obj[key].name === defaults.notify) {
                defaults.id = key.toString();
                if (defaults.type !== "user") {
                  saveSlackNotifyAndEmitRes();
                } else {
                  // If its a user, get the correct DM id number
                  bundle.db.get(["unblinkingSlack", "dms"], function (err, obj) {
                    if (err) {
                      console.log(`ERROR: ${err}`);
                    } else {
                      Object.keys(obj).forEach(function (key) {
                        if (obj[key].user === defaults.id) {
                          defaults.id = key;
                          saveSlackNotifyAndEmitRes();
                        }
                      });
                    }
                  });
                }
              }
            });
          }
        });
      });

      // Restart Slack integration
      socket.on("slackRestartReq", function () {
        disconnectRtm(bundle)
          .then(addTokenToBundle)
          .then(getRtmInstance)
          .then(startRtmInstance)
          .then(listenForRtmEvents)
          .then(function () {
            //socket.emit("slackRestartRes");
            console.log("Slack restart requested from unblinkingsockets.js");
          })
          .catch(function (err) {
            console.log(err);
          });
      });

      // Stop Slack integration
      socket.on("slackStopReq", function () {
        disconnectRtm(bundle)
          .then(function () {
            socket.emit("slackStopRes");
          })
          .catch(function (err) {
            console.log(err);
          });
      });

      // Restart the unblinkingBot application
      socket.on("restartReq", function () {
        console.log("Request to restart unblinkingBot application.");
        // TODO: Restart the service correctly.
        process.exit(1);
        /*
        unblinking_child.unblinkingSpawn({
            command:"npm",
            args:"restart",
            options:undefined
        });
        */
      });

    });

  }

};

module.exports = sockets;