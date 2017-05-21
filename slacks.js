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
const request = require("request");

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

          if (message.user !== bundle.rtm.activeUserId) { // Not a message from the bot itself, do not respond to its own messages.
            if (message.text !== undefined) { // There is text in this message event.
              if (message.text.match(/get/gi)) { // The word "get" appeared in the text
                if (message.text.match(/snapshot/gi)) { // The word "snapshot" appeared in the text.
                  if (message.text.match(/snapshot list/gi)) { // The words "snapshot list" appeared together.
                    getValuesByKeyPrefix(bundle, "motion::snapshot::")
                      .then(snapshots => {
                        let names = [];
                        names.push("Here are the snapshot names that you requested:")
                        Object.keys(snapshots).forEach(key => {
                          let name = snapshots[key].name;
                          names.push("• " + name);
                        });
                        return names;
                      })
                      .then(names => {
                        return bundle.web.chat.postMessage(
                          message.channel,
                          names.join("\n"), {
                            "as_user": true,
                            "parse": "full"
                          }
                        )
                      })
                      .then(res => {
                        console.log(`Got a response after giving the snapshot names list.`);
                        //console.log(res);
                      });
                  };
                  if (!message.text.match(/snapshot list/gi)) { // The words "snapshot list" do not appeared together.
                    getValuesByKeyPrefix(bundle, "motion::snapshot::")
                      .then(snapshots => {
                        let names = {};
                        Object.keys(snapshots).forEach(key => {
                          names[key] = snapshots[key];
                        });
                        return names;
                      })
                      .then(names => {
                        let matchingNames = {};
                        Object.keys(names).forEach(key => {
                          let re = new RegExp(names[key].name, "gi");
                          if (message.text.match(re)) {
                            matchingNames[key] = names[key];
                          }
                        });
                        return matchingNames;
                      })
                      .then(matchingNames => {
                        if (Object.keys(matchingNames).length === 0) { // No names were found :(
                          bundle.web.chat.postMessage(
                            message.channel,
                            "Did you want a snapshot? If so, next time ask for one that exists. (hint: ask for the snapshot list)", {
                              "as_user": true,
                              "parse": "full"
                            }
                          );
                        } else { // Some names were found!
                          Object.keys(matchingNames).forEach(key => {
                            bundle.web.files.upload(`snapshot_${matchingNames[key].name}_${new Date().getTime()}.jpg`, {
                                "file": request(matchingNames[key].url),
                                "filename": `snapshot_${matchingNames[key].name}_${new Date().getTime()}.jpg`,
                                "title": `Snapshot of ${matchingNames[key].name}`,
                                "channels": message.channel,
                                "initial_comment": `Here's that picture of the ${matchingNames[key].name} that you wanted.`,
                              })
                              .then(res => {
                                console.log(`Got a res from the file upload to Slack`);
                              })
                              .catch(err => console.log(err.message));
                          });
                        }
                      })
                      .catch(err => console.log(err.message));
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
