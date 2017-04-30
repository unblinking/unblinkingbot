#!/usr/bin/env node

/**
 * The web sockets for the unblinkingbot web UI.
 * @namespace sockets.js
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * Require the 3rd party modules that will be used.
 * @see {@link https://github.com/rburns/ansi-to-html ansi-to-html}
 * @see {@link https://github.com/petkaantonov/bluebird bluebird}
 * @see {@link https://github.com/AriaMinaei/pretty-error pretty-error}
 */
const ansi_to_html = require("ansi-to-html");
const bluebird = require("bluebird");
const pretty_error = require("pretty-error");

/**
 * Configure the ansi-to-html and pretty-error modules.
 */
const ansiConvert = new ansi_to_html({
  newline: true
});
const prettyError = new pretty_error()
  .skipNodeFiles();

/**
 * Require the local modules that will be used.
 */
const spawns = require("./spawns.js");

/**
 * TODO: Setup processes to be spawned for real.
 */
spawns.spawner({
  "command": "echo",
  "argsArray": ["This is a test"]
});

/**
 * Promisify some local module callback functions.
 */
const getAllData = bluebird.promisify(require("./datastore.js").getAllData);
const getNewRtmInstance = require("./slacks.js").getNewRtmInstance;
const startRtmInstance = require("./slacks.js").startRtmInstance;
const listenForRtmEvents = require("./slacks.js").listenForEvents;
const disconnectRtm = require("./slacks.js").disconnectRtmInstance;

/**
 * Module to be exported, containing the Socket.io events.
 */
const sockets = {

  /**
   * Socket.io event handlers.
   * @param {Object} bundle The main bundle, containing references to the
   * LevelDB data store, Slack RTM Client, and Socket.io server.
   */
  events: bundle => {

    /**
     * Register the "connection" event handler for the main bundle.io object.
     * Upon connection, register the other event handlers.
     */
    bundle.io.on("connection", socket => {

      //let handshake = JSON.stringify(socket.handshake, null, 2);
      //console.log(`Socket.io connection handshake: ${handshake}.`);

      /**
       * Register the "disconnect" event handler.
       */
      //socket.on("disconnect", () => console.log("Socket.io disconnection."));

      /**
       * Register the "readFullDbReq" event handler.
       * Read the entire LevelDB Datastore and emit it back out.
       */
      socket.on("readFullDbReq", () => {
        getAllData(bundle.db)
          .then(allData => socket.emit("readFullDbRes", allData))
          .catch(err => socket.emit("readFullDbRes", err.message)); // TODO: Do a pretty error here
      });

      /**
       * Register the "readSlackChannelsReq" event handler.
       * If the Slack RTM Client is currently connected, get an array of all of
       * the channel names where the bot user is a member of the channel, and
       * then emit the channel names back out.
       */
      socket.on("readSlackChannelsReq", () => {
        try {
          let channelNames = [];
          let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
          if (rtmConnected) {
            let channels = bundle.rtm.dataStore.channels;
            Object.keys(channels).forEach((key) => {
              if (channels[key].is_member) { // Only if the bot is a member.
                channelNames.push(channels[key].name);
              }
            });
          }
          socket.emit("readSlackChannelsRes", channelNames);
        } catch (err) {
          console.log(err.message);
        }
      });

      /**
       * Register the "readSlackGroupsReq" event handler.
       * If the Slack RTM Client is currently connected, get an array of all of
       * the group names where the bot user is a member of the group, and then
       * emit the group names back out.
       */
      socket.on("readSlackGroupsReq", () => {
        try {
          let groupNames = [];
          let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
          if (rtmConnected) {
            let groups = bundle.rtm.dataStore.groups;
            Object.keys(groups).forEach((key) =>
              groupNames.push(groups[key].name)
            );
          }
          socket.emit("readSlackGroupsRes", groupNames);
        } catch (err) {
          console.log(err.message);
        }
      });

      /**
       * Register the "readSlackUsersReq" event handler.
       * If the Slack RTM Client is currently connected, get an array of all of
       * the user names where the bot user is in a direct message with the user,
       * and then emit the user names back out.
       */
      socket.on("readSlackUsersReq", () => {
        try {
          let directMessageUserNames = [];
          let rtmConnected = bundle.rtm !== undefined && bundle.rtm.connected === true;
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
          socket.emit("readSlackUsersRes", directMessageUserNames);
        } catch (err) {
          console.log(err.message);
        }
      });

      /**
       * Register the "saveSlackTokenReq" event handler.
       * Try to save the token to the LevelDB Datastore, and then emit a
       * response that includes the token, a boolean success, and an error if
       * one exists. The error is formatted using pretty-error and ansi-to-html.
       */
      socket.on("saveSlackTokenReq", token => {
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
       * Register the "saveSlackNotifyReq" event handler.
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
       * Register the "slackConnectionStatusReq" event handler.
       */
      socket.on("slackConnectionStatusReq", () => {
        socket.emit(
          "slackConnectionStatusRes",
          bundle.rtm !== undefined && bundle.rtm.connected === true
        );
      });

      /**
       * Register the "slackRestartReq" event handler.
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
          .catch(err => console.log(err.message));
      });

      /**
       * Register the "slackStopReq" event handler.
       * Disconnect the Slack RTM Client.
       */
      socket.on("slackStopReq", () => {
        disconnectRtm(bundle)
          .catch(err => console.log(err.message));
      });

      /**
       * Register the "slackNotifyReq" event handler.
       * Get the default notification recipient name and type from the LevelDB
       * Datastore, and then emit them back out as a response.
       */
      socket.on("slackNotifyReq", () => {
        let data = {};
        bundle.db.get("slack::settings::notify")
          .then(notify => data.notify = notify)
          .then(() => {
            return bundle.db.get("slack::settings::notifyType");
          })
          .then(notifyType => data.notifyType = notifyType)
          .then(() => socket.emit("slackNotifyRes", data))
          .catch(err => console.log(err.message));
      });

      /**
       * Register the "slackTokenReq" event handler.
       * Get the bot user token from the LevelDB Datastore, and then emit it
       * back out as a response.
       */
      socket.on("slackTokenReq", () => {
        bundle.db.get("slack::settings::token")
          .then(token => socket.emit("slackTokenRes", token))
          .catch(err => console.log(err.message));
      });

      /**
       * Register the "restartReq" event handler.
       * Exit the current process. The process is running as a systemd based
       * service, and will restart itself.
       */
      socket.on("restartReq", () => process.exit(1)); // TODO: Restart the systemd service differently?

    });

  }

};

module.exports = sockets;