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


var unblinking_db = require('./unblinkingdb.js');

const slacking = {

  getToken: function (bundle, callback) {
    let key = "slack::credentials::token";
    bundle.db.get(key, function (err, data) {
      if (data) {
        if (typeof data === 'string' || data instanceof String) {
          bundle.token = data;
        } else {
          bundle.token = "Invalid token.";
        }
      }
      if (err) {
        if (err.notFound) {
          // Common and expected, null this error.
          err = null;
          bundle.token = "Token not found.";
        }
      }
      callback(err, bundle);
    });
  },

  getNotify: function (bundle, callback) {
    let key = "slack::credentials::notify";
    bundle.db.get(key, function (err, data) {
      if (data) {
        if (typeof data === 'string' || data instanceof String) {
          bundle.notify = data;
        } else {
          bundle.notify = "Invalid notify.";
        }
      }
      if (err) {
        if (err.notFound) {
          // Common and expected, null this error.
          err = null;
          bundle.notify = "Notify not found.";
        }
      }
      callback(err, bundle);
    });
  },

  getNotifyType: function (bundle, callback) {
    let key = "slack::credentials::notifyType";
    bundle.db.get(key, function (err, data) {
      if (data) {
        if (typeof data === 'string' || data instanceof String) {
          bundle.notifyType = data;
        } else {
          bundle.notifyType = "Invalid notifyType.";
        }
      }
      if (err) {
        if (err.notFound) {
          // Common and expected, null this error.
          err = null;
          bundle.notifyType = "Notify type not found.";
        }
      }
      callback(err, bundle);
    });
  },

  getRtmInstance: function (bundle, callback) {
    let err = null;
    bundle.rtm = new slackClient.RtmClient(bundle.token, {
      logLevel: 'verbose',
      dataStore: new slackClient.MemoryDataStore()
    });
    callback(err, bundle);
  },

  startRtmInstance: function (bundle, callback) {
    let err = null;
    bundle.rtm.start();
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
      console.log(`RTM Client authenticated. Rtm.start payload captured.`);
    });
    // wait for the client to connect
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
      var user = bundle.rtm.dataStore.getUserById(bundle.rtm.activeUserId);
      var team = bundle.rtm.dataStore.getTeamById(bundle.rtm.activeTeamId);
      console.log(`RTM connection opened. RTM hello event received.`);
      console.log(`RTM connected to ${team.name} as bot user ${user.name}.`);

      bundle.socket.emit('slackRestartRes');

      bundle.db.put("slack::channels", bundle.rtm.dataStore.channels, function(err) {});
      bundle.db.put("slack::users", bundle.rtm.dataStore.users, function(err) {});
      bundle.db.put("slack::dms", bundle.rtm.dataStore.dms, function(err) {});
      bundle.db.put("slack::groups", bundle.rtm.dataStore.groups, function(err) {});
      bundle.db.put("slack::bots", bundle.rtm.dataStore.bots, function(err) {});
      bundle.db.put("slack::teams", bundle.rtm.dataStore.teams, function(err) {});
    });

    // Some extra logging to the console to determine why we sometimes end up
    // with multiple open web sockets, presented as duplicate bot responses.
    function clientEventLogging(desc, err, code, reason) {
      if (desc) {
        console.log(`RTM Client Event: ${desc}`);
      }
      if (err) {
        console.log(`RTM Client Event: ${err}`);
      }
      if (code) {
        console.log(`RTM Client Event: ${code}`);
      }
      if (reason) {
        console.log(`RTM Client Event: ${reason}`);
      }
    }
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.DISCONNECT, function (err, code) {
      var desc = 'CLIENT_EVENTS.RTM.DISCONNECT';
      clientEventLogging(desc, err, code, undefined);
    });
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.ATTEMPTING_RECONNECT, function () {
      var desc = 'CLIENT_EVENTS.RTM.ATTEMPTING_RECONNECT';
      clientEventLogging(desc, undefined, undefined, undefined);
    });
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, function (err) {
      var desc = 'CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START';
      clientEventLogging(desc, err, undefined, undefined);
    });
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.WS_OPENING, function () {
      var desc = 'CLIENT_EVENTS.RTM.WS_OPENING';
      clientEventLogging(desc, undefined, undefined, undefined);
    });
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.WS_OPENED, function () {
      var desc = 'CLIENT_EVENTS.RTM.WS_OPENED';
      clientEventLogging(desc, undefined, undefined, undefined);
    });
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.WS_CLOSE, function (code, reason) {
      var desc = 'CLIENT_EVENTS.RTM.WS_CLOSE';
      clientEventLogging(desc, undefined, code, reason);
    });
    bundle.rtm.on(slackClient.CLIENT_EVENTS.RTM.WS_ERROR, function (err) {
      var desc = 'CLIENT_EVENTS.RTM.WS_ERROR';
      clientEventLogging(desc, err, undefined, undefined);
    });

  },

  disconnectRtmInstance: function (bundle, callback) {
    let err = null;
    if (bundle.rtm !== null && Object.keys(bundle.rtm).length !== 0) { // not null or empty object
      bundle.rtm.autoReconnect = false;
      bundle.rtm.handleWsClose('1', 'User request');
      bundle.rtm.disconnect('User request', '1');
    } else {
      //console.log("Attempted to disconnect null or empty Slack RTM Client object.");
    }
    callback(err, bundle);
  },

  trimMessageLog: function (bundle, callback) {
    bundle.objectPath = ['unblinkingSlack', 'history'];
    unblinking_db.trimObjKeys(bundle);
  },

  logSlacktivity: function (bundle, callback) {
    bundle.now = new Date().getTime();
    if (bundle.slacktivity) {
      bundle.db.put([], {
        unblinkingSlack: {
          history: {
            [bundle.now]: {
              slacktivity: bundle.slacktivity
            }
          }
        }
      }, function (err) {
        if (err) {
          console.log(`ERROR: ${err}`);
        } else {
          // Success logging this message, now trim the message log.
          slacking.trimMessageLog(bundle);
        }
      });
    }
  },

  sendMessage: function (bundle, callback) {
    bundle.rtm.sendMessage(
      bundle.sending.text,
      bundle.sending.id,
      function messageSent(err, msg) {
        if (err) {
          bundle.slacktivity = err;
          slacking.logSlacktivity(bundle);
        } else {
          bundle.slacktivity = msg;
          slacking.logSlacktivity(bundle);
        }
      }
    );
  },

  listenForEvents: function (bundle, callback) {
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
  }

};

module.exports = slacking;