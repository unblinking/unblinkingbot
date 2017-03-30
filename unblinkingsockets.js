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
const bluebird = require('bluebird');

/**
 * Require the local modules that will be used.
 */
const getSlackCredentials = bluebird.promisify(require("./unblinkingslack.js").getCredentials);
const getRtmInstance = bluebird.promisify(require("./unblinkingslack.js").getRtmInstance);
const startRtmInstance = bluebird.promisify(require("./unblinkingslack.js").startRtmInstance);
const listenForRtmEvents = bluebird.promisify(require("./unblinkingslack.js").listenForEvents);
const disconnectRtm = bluebird.promisify(require("./unblinkingslack.js").disconnectRtmInstance);

const sockets = {

  on: function (bundle, callback) {

    bundle.socket.on('connection', function (socket) {
      //console.log(`Socket.io__ someone connected.`);
      socket.on('disconnect', function () {
        //console.log(`Socket.io__ someone disconnected.`);
      });

      // Read full data store
      socket.on('readFullDbReq', function () {
        bundle.db.get([], function (err, obj) {
          if (err) {
            console.log(`ERROR: ${err}`);
          } else {
            socket.emit('readFullDbRes', obj);
          }
        });
      });

      // Read available Slack channels
      socket.on('readSlackChannelsReq', function () {
        bundle.db.get(['unblinkingSlack', 'channels'], function (err, channels) {
          if (err) {
            console.log(`ERROR: ${err}`);
          } else {
            let channelNames = [];
            Object.keys(channels).forEach(function (key) {
              // Only if the bot is a member of the channel.
              if (channels[key].is_member) {
                channelNames.push(channels[key].name);
              }
            });
            socket.emit('readSlackChannelsRes', channelNames);
          }
        });
      });

      // Read available Slack groups
      socket.on('readSlackGroupsReq', function () {
        bundle.db.get(['unblinkingSlack', 'groups'], function (err, groups) {
          if (err) {
            console.log(`ERROR: ${err}`);
          } else {
            let groupNames = [];
            Object.keys(groups).forEach(function (key) {
              groupNames.push(groups[key].name);
            });
            socket.emit('readSlackGroupsRes', groupNames);
          }
        });
      });


      // Read available Slack users
      socket.on('readSlackUsersReq', function () {
        bundle.db.get(['unblinkingSlack', 'dms'], function (err, dms) {
          if (err) {
            console.log(`ERROR: ${err}`);
          } else {
            let dmUserIds = [];
            Object.keys(dms).forEach(function (key) {
              dmUserIds.push(dms[key].user);
            });
            bundle.db.get(['unblinkingSlack', 'users'], function (err, users) {
              if (err) {
                console.log(`ERROR: ${err}`);
              } else {
                let userNames = [];
                dmUserIds.forEach(function (id) {
                  userNames.push(users[id].name);
                });
                socket.emit('readSlackUsersRes', userNames);
              }
            });
          }
        });
      });


      // Save Slack token
      socket.on('saveSlackTokenReq', function (token) {
        bundle.db.put([], {
          unblinkingSlack: {
            credentials: {
              token: token
            }
          }
        }, function (err) {
          if (err) {
            bundle.success = false;
            bundle.err = err;
          } else {
            bundle.success = true;
          }
          socket.emit('saveSlackTokenRes', {
            token: token,
            success: bundle.success,
            err: bundle.err
          });
        });
      });

      // Save Slack default-notify
      socket.on('saveSlackNotifyReq', function (defaults) {
        let slackObjectName = null;
        if (defaults.type === 'channel') {
          slackObjectName = 'channels';
        }
        if (defaults.type === 'group') {
          slackObjectName = 'groups';
        }
        if (defaults.type === 'user') {
          slackObjectName = 'users';
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
            socket.emit('saveSlackNotifyRes', {
              defaultNotifyType: defaults.type,
              defaultNotify: defaults.notify,
              success: bundle.success,
              err: bundle.err
            });
          });
        }
        bundle.db.get(['unblinkingSlack', slackObjectName], function (err, obj) {
          if (err) {
            console.log(`ERROR: ${err}`);
          } else {
            Object.keys(obj).forEach(function (key) {
              if (obj[key].name === defaults.notify) {
                defaults.id = key.toString();
                if (defaults.type !== 'user') {
                  saveSlackNotifyAndEmitRes();
                } else {
                  // If its a user, get the correct DM id number
                  bundle.db.get(['unblinkingSlack', 'dms'], function (err, obj) {
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
      socket.on('slackRestartReq', function () {
        disconnectRtm(bundle)
          .then(getSlackCredentials)
          .then(getRtmInstance)
          .then(startRtmInstance)
          .then(listenForRtmEvents)
          .then(function () {
            //socket.emit('slackRestartRes');
            console.log("Slack restart requested from unblinkingsockets.js");
          })
          .catch(function (err) {
            console.log(err);
          });
      });

      // Stop Slack integration
      socket.on('slackStopReq', function () {
        disconnectRtm(bundle)
          .then(function () {
            socket.emit('slackStopRes');
          })
          .catch(function (err) {
            console.log(err);
          });
      });

      // Restart the unblinkingBot application
      socket.on('restartReq', function () {
        console.log('Request to restart unblinkingBot application.');
        process.exit(1);
        /*
        unblinking_child.unblinkingSpawn({
            command:'npm',
            args:'restart',
            options:undefined
        });
        */
      });

    });

  }

};

module.exports = sockets;