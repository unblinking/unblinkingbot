#!/usr/bin/env node

/**
 * The socket.io wrapper functions for the unblinkingbot.
 * @namespace sockets.js
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138 on GitHub}
 */

/**
 * Require the 3rd party modules that will be used.
 * @see {@link https://github.com/rburns/ansi-to-html ansi-to-html}
 * @see {@link https://github.com/moment/moment/ moment}
 * @see {@link https://github.com/petkaantonov/bluebird bluebird}
 * @see {@link https://github.com/AriaMinaei/pretty-error pretty-error}
 */
const ansi_to_html = require("ansi-to-html");
const moment = require("moment");
const P = require("bluebird");
const pretty_error = require("pretty-error");

/**
 * Configure the ansi-to-html and pretty-error modules.
 */
const convert = new ansi_to_html({
  newline: true
});
const pretty = new pretty_error()
  .skipNodeFiles();

/**
 * Require the local modules/functions that will be used.
 */
const getAllData = require("./datastore.js").getAllData;
const getValuesByKeyPrefix = require("./datastore.js").getValuesByKeyPrefix;
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
       * Register the "fullDbReq" event handler.
       * Read the entire LevelDB Datastore and emit it back out.
       */
      socket.on("fullDbReq", () =>
        getAllData(bundle.db)
        .then(allData => socket.emit("fullDbRes", allData))
        .catch(err => socket.emit("fullDbRes", err.message))); // TODO: Do a pretty error here

      /**
       * Register the "channelsReq" event handler.
       * If the Slack RTM Client is currently connected, get an array of all of
       * the channel names where the bot user is a member of the channel, and
       * then emit the channel names back out.
       */
      socket.on("channelsReq", () =>
        getJoinedChannelNamesArray(bundle)
        .then(channelNames => socket.emit("channelsRes", channelNames)));

      /**
       * Register the "readSlackGroupsReq" event handler.
       * If the Slack RTM Client is currently connected, get an array of all of
       * the group names where the bot user is a member of the group, and then
       * emit the group names back out.
       */
      socket.on("readSlackGroupsReq", () =>
        getJoinedGroupNamesArray(bundle)
        .then(groupNames => socket.emit("readSlackGroupsRes", groupNames)));

      /**
       * Register the "readSlackUsersReq" event handler.
       * If the Slack RTM Client is currently connected, get an array of all of
       * the user names where the bot user is in a direct message with the user,
       * and then emit the user names back out.
       */
      socket.on("readSlackUsersReq", () =>
        getJoinedDmUserNamesArray(bundle)
        .then(userNames => socket.emit("readSlackUsersRes", userNames)));

      /**
       * Register the "saveSlackTokenReq" event handler.
       * Try to save the token to the LevelDB Datastore, and then emit a
       * response that includes the token, a boolean success, and an error if
       * one exists. The error is formatted using pretty-error and ansi-to-html.
       */
      socket.on("saveSlackTokenReq", token =>
        bundle.db.put("slack::settings::token", token)
        .then(() => socket.emit("saveSlackTokenRes", token, true, null))
        .catch(err => socket.emit("saveSlackTokenRes", token, false,
          convert.toHtml(pretty.render(err)))));

      /**
       * Register the "saveSlackNotifyReq" event handler.
       */
      socket.on("saveSlackNotifyReq", (notify, notifyType) =>
        bundle.db.put("slack::settings::notify", notify)
        .then(() => bundle.db.put("slack::settings::notifyType", notifyType))
        .then(() => {
          if (bundle.rtm !== undefined && bundle.rtm.connected === true) {
            if (notifyType === "channel") return getChannelIdByName(notify);
            else if (notifyType === "group") return getGroupIdByName(notify);
            else if (notifyType === "user") return getDmIdByUserName(notify);
          }
        })
        .then(id => bundle.db.put("slack::settings::notifyId", id))
        .then(() => socket.emit("saveSlackNotifyRes", notify, notifyType, true, null))
        .catch(err => socket.emit("saveSlackNotifyRes", notify, notifyType, false,
          convert.toHtml(pretty.render(err)))));

      /**
       * Register the "slackConnectionStatusReq" event handler.
       */
      socket.on("slackConnectionStatusReq", () =>
        socket.emit("slackConnectionStatusRes",
          bundle.rtm !== undefined && bundle.rtm.connected === true));

      /**
       * Register the "slackRestartReq" event handler.
       */
      socket.on("slackRestartReq", () =>
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
        .catch(err => console.log(err.message)));

      /**
       * Register the "slackStopReq" event handler.
       * Disconnect the Slack RTM Client.
       */
      socket.on("slackStopReq", () =>
        disconnectRtm(bundle)
        .catch(err => console.log(err.message)));

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
      socket.on("slackTokenReq", () =>
        bundle.db.get("slack::settings::token")
        .then(token => socket.emit("slackTokenRes", token))
        .catch(err => console.log(err.message)));

      /**
       * Register the "restartReq" event handler.
       * Exit the current process. The process is running as a systemd based
       * service, and will restart itself.
       */
      socket.on("restartReq", () => process.exit(1)); // TODO: Restart the systemd service differently?

      /**
       * 
       */
      socket.on("dashRecentActivityReq", () => {
        if (
          bundle.rtm !== undefined &&
          bundle.rtm.connected === true &&
          bundle.web !== undefined
        ) {
          bundle.web.channels.history("C2T0214N8")
            .then((res) => console.log(res))
            .catch(err => console.log(err));
        }

        /*
        getValuesByKeyPrefix(bundle, "slack::activity::")
          .then((slacktivities) => {
            Object.keys(slacktivities).forEach(key => {
              if (slacktivities[key].type === "message" &&
                bundle.rtm !== undefined &&
                bundle.rtm.connected === true) {

                  

                let name = "unknown";
                Object.keys(bundle.rtm.dataStore.users).forEach(usersKey => {
                  if (bundle.rtm.dataStore.users[usersKey].id === slacktivities[key].user)
                    name = bundle.rtm.dataStore.users[usersKey].name;
                });
                let time = moment(slacktivities[key].ts.split(".")[0] * 1000).format("HH:mma");
                let dashActivity = `Message [${name} ${time}] ${slacktivities[key].text}`;
                bundle.io.emit("slacktivity", dashActivity);

              } else {
                bundle.io.emit("slacktivity", "Bot is disconnected.");
              }
            });
          });
        */

      });

      /**
       * 
       * @param {*} bundle 
       */
      function getJoinedChannelNamesArray(bundle) {
        return new P(resolve => {
          let channelNames = [];
          if (bundle.rtm !== undefined && bundle.rtm.connected === true)
            Object.keys(bundle.rtm.dataStore.channels).forEach(key => {
              if (bundle.rtm.dataStore.channels[key].is_member) // Only if the bot is a member.
                channelNames.push(bundle.rtm.dataStore.channels[key].name);
            });
          resolve(channelNames);
        });
      }

      /**
       * 
       * @param {*} bundle 
       */
      function getJoinedGroupNamesArray(bundle) {
        return new P(resolve => {
          let groupNames = [];
          if (bundle.rtm !== undefined && bundle.rtm.connected === true)
            Object.keys(bundle.rtm.dataStore.groups).forEach(key =>
              groupNames.push(bundle.rtm.dataStore.groups[key].name));
          resolve(groupNames);
        });
      }

      /**
       * 
       * @param {*} bundle 
       */
      function getJoinedDmUserNamesArray(bundle) {
        return new P(resolve => {
          let directMessageUserIds = [];
          let directMessageUserNames = [];
          if (bundle.rtm !== undefined && bundle.rtm.connected === true) {
            Object.keys(bundle.rtm.dataStore.dms).forEach(key =>
              directMessageUserIds.push(bundle.rtm.dataStore.dms[key].user));
            directMessageUserIds.forEach(id =>
              directMessageUserNames.push(bundle.rtm.dataStore.users[id].name));
          }
          resolve(directMessageUserNames);
        });
      }

      /**
       * 
       * @param {*} name 
       */
      function getChannelIdByName(name) {
        return new P(resolve => {
          let id;
          Object.keys(bundle.rtm.dataStore.channels).forEach(key => {
            if (bundle.rtm.dataStore.channels[key].name === name)
              id = key.toString();
          });
          resolve(id);
        });
      }

      /**
       * 
       * @param {*} name 
       */
      function getGroupIdByName(name) {
        return new P(resolve => {
          let id;
          Object.keys(bundle.rtm.dataStore.groups).forEach(key => {
            if (bundle.rtm.dataStore.groups[key].name === name)
              id = key.toString();
          });
          resolve(id);
        });
      }

      /**
       * 
       * @param {*} name 
       */
      function getDmIdByUserName(name) {
        return new P(resolve => {
          let id;
          Object.keys(bundle.rtm.dataStore.users).forEach(usersKey => {
            if (bundle.rtm.dataStore.users[usersKey].name === name)
              Object.keys(bundle.rtm.dataStore.dms).forEach(dmsKey => {
                if (bundle.rtm.dataStore.dms[dmsKey].user ===
                  bundle.rtm.dataStore.users[usersKey].id)
                  id = dmsKey.toString();
              });
          });
          resolve(id);
        });

      }

    });

  }

};

module.exports = sockets;