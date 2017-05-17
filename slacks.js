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
 * @see {@link https://github.com/request/request request}
 */
const moment = require("moment");
const P = require("bluebird");
const slackClient = require("@slack/client");
const request = require('request');

/**
 * Require the local modules/functions that will be used.
 */
const getValuesByKeyPrefix = require("./datastore.js").getValuesByKeyPrefix;

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

          if (message.user !== bundle.rtm.activeUserId) { // Not a message from the bot itself, don't respond to its own messages.

            if (message.text !== undefined) { // There is text in this message event.

              if (message.text.match(/get/gi)) { // The word "get" appeared in the text

                if (message.text.match(/snapshot/gi)) { // The word "snapshot" appeared in the text.

                  if (message.text.match(/snapshot list/gi)) { // The words "snapshot list" appeared together.
                    // Get the requested snapshot URL names from the LevelDB data store.
                    let names = [];
                    getValuesByKeyPrefix(bundle, "motion::snapshot::")
                      .then(snapshots => {
                        Object.keys(snapshots).forEach(key => {
                          let name = snapshots[key].name;
                          names.push(name);
                        });
                      })
                      .then(() => {
                        // Respond with the requested snapshot URL names.
                        bundle.web.chat.postMessage(
                            message.channel,
                            names.join(", "), {
                              "as_user": true,
                              "parse": "full"
                            }
                          )
                          .then(res => {
                            console.log(`Got a response after giving the snapshot names list.`);
                            // console.log(res);
                          });
                      });
                  } else { // The word "snapshot" appeared, but not "snapshot list", so see if they asked for an existing snapshot name.
                    let names = [];
                    let foundOne = false;
                    getValuesByKeyPrefix(bundle, "motion::snapshot::")
                      .then(snapshots => {
                        Object.keys(snapshots).forEach(key => {
                          let name = snapshots[key].name;
                          names.push(name);
                        });
                      })
                      .then(() => {
                        names.forEach(name => {
                          let re = new RegExp(name, "gi");
                          if (message.text.match(re)) {
                            foundOne = true;
                            let url;
                            let filename;
                            let title;
                            let comment;
                            bundle.db.get("motion::snapshot::" + name)
                              .then(object => url = object.url)
                              .then(() => {
                                filename = `snapshot_${name}_${new Date().getTime()}.jpg`;
                                title = `Snapshot of ${name}`;
                                comment = `Here's that snapshot of the ${name}`;
                              })
                              .then(() => {
                                //console.log(snapshot);
                                console.log(`Attempting to upload it to Slack now.`);
                                return bundle.web.files.upload(filename, {
                                  "file": request(url),
                                  "filename": filename,
                                  "title": title,
                                  "channels": message.channel,
                                  "initial_comment": comment,
                                });
                              })
                              .then(res => {
                                console.log(`Got a response from Slack after the upload.`);
                                //console.log(res);
                              })
                              .catch(err => console.log(err));
                          }
                        });
                      })
                      .then(() => {
                        if (foundOne === false) {
                          bundle.web.chat.postMessage(
                              message.channel,
                              "Did you want a snapshot? If so, ask for one that exists next time. (hint: try asking me to get you the snapshot list)", {
                                "as_user": true,
                                "parse": "full"
                              }
                            )
                            .then(res => {
                                console.log(`Got a response from Slack after telling user to ask for one that exists next time.`);
                                //console.log(res);
                              });
                        }
                      })
                      .catch(err => console.log(err));
                  }

                }

              }

            }

          }

        });

      bundle.rtm.on(
        slackClient.RTM_EVENTS.GOODBYE,
        message => console.log(`RTM Client said goodbye.`));

      bundle.rtm.on(
        slackClient.RTM_EVENTS.REACTION_ADDED,
        reaction => console.log(`RTM Client reaction added event.`));

      resolve();
    });
  },

};

module.exports = slacks;