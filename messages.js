#!/usr/bin/env node

/**
 * The child process wrapper functions for the unblinkingBot.
 * @author jmg1138 {@link https://github.com/jmg1138 jmg1138}
 * @copyright 2015-2017 {@link https://github.com/nothingworksright nothingworksright}
 * @license MIT License
 * @see {@link http://unblinkingbot.com/ unblinkingBot.com}
 */

 /**
  * Require the 3rd party modules that will be used.
  * @see {@link https://github.com/petkaantonov/bluebird bluebird}
  * @see {@link https://github.com/request/request request}
  */
 const P = require("bluebird");
 const request = require("request");

 /**
  * Require the local modules/functions that will be used.
  */
 const getValuesByKeyPrefix = require("./datastore.js").getValuesByKeyPrefix;

/**
 *
 */
const messages = {

  /**
   * Handle a new message from the Slack RTM Client RTM_EVENTS.MESSAGE event.
   */
  new: (bundle, message) => {
    return new P(resolve => {
      if (message.user !== bundle.rtm.activeUserId) messages.notBot(bundle, message);
      resolve();
    });
  },

  /**
   * Handle a message that didn't originate from the bot itself.
   */
  notBot: (bundle, message) => {
    return new P(resolve => {
      if (message.text !== undefined) messages.findTriggerWords(bundle, message);
      resolve();
    });
  },

  /**
   * Look for the trigger word(s) in a message text.
   * Using the bot's name or user ID as trigger words.
   */
  findTriggerWords: (bundle, message) => {
    return new P(resolve => {
      if (
        message.text.match(/unblinkingbot/gi) ||
        message.text.match(new RegExp(bundle.rtm.activeUserId, "g"))
      ) messages.findCommandWords(bundle, message);
      resolve();
    });
  },

  /**
   *
   */
  findCommandWords: (bundle, message) => {
    return new P(resolve => {
      if (message.text.match(/snapshot list/gi)) { // Asked for the snapshot list.
        messages.getSnapshotList(bundle, message);
      } else if (message.text.match(/snapshot/gi)) { // Asked for an actual snapshot.
        messages.getSnapshot(bundle, message);
      } else { // No command words were found in the message text.
        messages.thatsMyName(bundle, message);
      }
      resolve();
    });
  },

  /**
   *
   */
  getSnapshotList: (bundle, message) => {
    return new P(resolve => {
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
        });
      resolve();
    });
  },

  getSnapshot: (bundle, message) => {
    return new P(resolve => {
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
      resolve();
    });
  },

  thatsMyName: (bundle, message) => {
    return new P(resolve => {
      let user = bundle.rtm.dataStore.getUserById(message.user).name;
      bundle.web.chat.postMessage(
        message.channel,
        `That's my name @${user}, don't wear it out!`, {
          "as_user": true,
          "parse": "full"
        }
      );
      resolve();
    });
  }

};

module.exports = messages;
